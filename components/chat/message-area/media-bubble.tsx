'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileText, Image as ImageIcon, Loader2, Play, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WhatsAppMessage } from './types'
import { getMediaCaption, getMediaTypeFromText, isMediaLoaded } from './utils'
import { AudioPlayer } from './audio-player'

export function MediaBubble({ msg, outbound, onOpenLightbox }: { msg: WhatsAppMessage; outbound: boolean; onOpenLightbox?: (src: string, type: 'image' | 'video') => void }) {
  const [mediaData, setMediaData] = useState<string | null>(msg.mediaUrl || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasTriggered = useRef(false)

  const mType = msg.mediaType || getMediaTypeFromText(msg.text)
  const caption = getMediaCaption(msg.text)

  const fetchMedia = useCallback(async () => {
    if (isMediaLoaded(mediaData) || loading) return
    if (!msg.messageId) return
    setLoading(true)
    try {
      const r = await fetch(`/api/whatsapp/media?messageId=${msg.messageId}`)
      if (r.ok) {
        const data = await r.json()
        if (data.url) {
          setMediaData(data.url)
        } else if (data.base64) {
          setMediaData(data.base64)
        } else {
          setError(true)
        }
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [msg.messageId, mediaData, loading])

  // Lazy load: only fetch media when element enters viewport
  useEffect(() => {
    const shouldAutoLoad = (mType === 'image' || mType === 'sticker' || mType === 'audio')
    if (!shouldAutoLoad || isMediaLoaded(mediaData) || !msg.messageId || hasTriggered.current) return

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true
          fetchMedia()
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [mType, msg.messageId, mediaData, fetchMedia])

  // Image
  if (mType === 'image' || mType === 'sticker') {
    return (
      <div ref={containerRef} className="space-y-1">
        {isMediaLoaded(mediaData) ? (
          <img
            src={mediaData!}
            alt="Imagem"
            className={cn(
              'rounded-lg max-w-[280px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity',
              mType === 'sticker' && 'bg-transparent !max-w-[180px] !max-h-[180px]'
            )}
            onClick={() => onOpenLightbox?.(mediaData!, 'image')}
          />
        ) : loading ? (
          <div className={cn(
            'flex items-center justify-center rounded-lg w-[200px] h-[140px] animate-pulse',
            outbound ? 'bg-[#c4edc0]' : 'bg-gray-100'
          )}>
            <Loader2 className="h-6 w-6 animate-spin text-[#667781]" />
          </div>
        ) : error ? (
          <button
            onClick={fetchMedia}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-6 w-[200px] justify-center transition-colors',
              outbound ? 'bg-[#c4edc0] hover:bg-[#b8e6b4]' : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            <ImageIcon className="h-5 w-5 text-[#667781]" />
            <span className="text-xs text-[#667781]">Tentar novamente</span>
          </button>
        ) : (
          <div className={cn(
            'flex items-center justify-center rounded-lg w-[200px] h-[140px]',
            outbound ? 'bg-[#c4edc0]' : 'bg-gray-100'
          )}>
            <ImageIcon className="h-6 w-6 text-[#667781] opacity-50" />
          </div>
        )}
        {caption && (
          <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100">{caption}</p>
        )}
      </div>
    )
  }

  // Video
  if (mType === 'video') {
    return (
      <div ref={containerRef} className="space-y-1">
        {isMediaLoaded(mediaData) ? (
          <div className="relative cursor-pointer group" onClick={() => onOpenLightbox?.(mediaData!, 'video')}>
            <video
              src={mediaData!}
              className="rounded-lg max-w-[280px] max-h-[300px]"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg group-hover:bg-black/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="h-6 w-6 text-[#111b21] ml-0.5 fill-[#111b21]" />
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={fetchMedia}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-6 w-[200px] justify-center transition-colors',
              outbound ? 'bg-[#c4edc0] hover:bg-[#b8e6b4]' : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[#667781]" />
            ) : (
              <>
                <Video className="h-5 w-5 text-[#667781]" />
                <span className="text-xs text-[#667781]">Carregar vídeo</span>
              </>
            )}
          </button>
        )}
        {caption && (
          <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100">{caption}</p>
        )}
      </div>
    )
  }

  // Audio — WhatsApp-style player
  if (mType === 'audio') {
    // Extract duration from text like "[Áudio 0:04]" → 4 seconds
    const durMatch = msg.text?.match(/(\d+):(\d{2})/)
    const knownDuration = durMatch ? parseInt(durMatch[1]) * 60 + parseInt(durMatch[2]) : undefined
    return <AudioPlayer messageId={msg.id} mediaData={mediaData} outbound={outbound} loading={loading} onFetch={fetchMedia} containerRef={containerRef} knownDuration={knownDuration} error={error} />
  }

  // Document
  if (mType === 'document') {
    const fileName = caption || 'Documento'
    return (
      <div ref={containerRef} className="space-y-1">
        <div className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 min-w-[200px] max-w-[280px]',
          outbound ? 'bg-[#c4edc0]' : 'bg-gray-100'
        )}>
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#00a884]/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#00a884]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-[#111b21] dark:text-zinc-100 font-medium truncate leading-tight">
              {fileName}
            </p>
            <p className="text-[11px] text-[#667781] mt-0.5">Documento</p>
          </div>
          {isMediaLoaded(mediaData) ? (
            <a
              href={mediaData!}
              download={fileName}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors"
            >
              <Download className="h-4 w-4 text-[#667781]" />
            </a>
          ) : (
            <button
              onClick={fetchMedia}
              disabled={loading}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#667781]" />
              ) : (
                <Download className="h-4 w-4 text-[#667781]" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
