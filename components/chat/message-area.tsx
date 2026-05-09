'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Send, Users, Loader2, Check, CheckCheck, Mic, Paperclip,
  Image as ImageIcon, Video, FileText, Download, Play, Pause,
  File, Search, Reply, X, Info, ArrowLeft, ChevronDown, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ConversationTags } from './conversation-tags'
import { MessageSearch } from './message-search'
import { QuickReplyPicker } from './quick-reply-picker'
import { QuotedMessage } from './quoted-message'
import { ContactSidebar } from './contact-sidebar'
import { AgentAssignment } from './agent-assignment'
import { TypingIndicator } from './typing-indicator'
import { ReactionBar } from './reaction-bar'
import { ReactionChips } from './reaction-chips'
import { MediaLightbox } from './media-lightbox'
import { usePusher } from '@/hooks/use-pusher'
import type { ChatTypingEvent, MessageNewEvent, MessageStatusEvent } from '@/hooks/use-pusher'
import { useTranslations } from 'next-intl'

interface Tag { id: string; name: string; color: string }
interface Deal {
  id: string
  title: string
  value: number | null
  stage: { name: string }
  pipeline: { name: string }
  updatedAt: Date
}
interface Note {
  id: string
  content: string
  createdAt: Date
  user: { name: string | null }
}
interface User {
  id: string
  name: string | null
  email: string
}
interface ChatConversation {
  id: string
  assignedUserId: string | null
  assignedUser: User | null
  status: string
  priority: string
}
interface Contact {
  id: string
  name: string | null
  phone: string | null
  email?: string | null
  company?: string | null
  profilePicUrl?: string | null
  tags?: Tag[]
  deals?: Deal[]
  notes?: Note[]
  chatConversation?: ChatConversation | null
  _count?: { whatsappMessages: number }
}
interface Connection { id: string; instanceName: string; phoneNumber: string | null }
interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}
interface WhatsAppMessage {
  id: string; text: string; direction: string; sentAt: Date
  deliveredAt: Date | null; readAt: Date | null; status: string
  mediaUrl: string | null; mediaType: string | null; messageId?: string
  replyToId?: string | null; replyToText?: string | null
  reactions?: Reaction[]
}
interface MessageAreaProps {
  contact: Contact; connections: Connection[]
  organizationId: string; userId: string; userName: string
  onContactUpdate?: () => void
  onBack?: () => void
  wabaEnabled?: boolean
}

type MessageItem = {
  msg: WhatsAppMessage
  showDate: boolean
  pos: BubblePos
}

// ── Helpers ──────────────────────────────────────────────────

function formatPhone(p: string | null): string {
  if (!p || p.includes('@')) return ''
  const d = p.replace(/\D/g, '')
  if (d.startsWith('55') && d.length === 13)
    return `+55 (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
  if (d.startsWith('55') && d.length === 12)
    return `+55 (${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return p
}

function getName(c: Contact): string {
  if (c.name && !c.name.includes('@g.us') && !c.name.includes('@s.whatsapp.net')) return c.name
  return formatPhone(c.phone) || c.phone?.replace(/@.+/,'') || 'Sem nome'
}

function getSub(c: Contact): string {
  if (c.phone?.includes('@g.us')) return 'Grupo'
  return formatPhone(c.phone) || ''
}

const COLORS = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-cyan-500','bg-pink-500','bg-teal-500']
function colorHash(n: string) { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length] }

function fmtDate(d: Date): string {
  const now = new Date(), msg = new Date(d)
  const days = Math.floor((now.getTime()-msg.getTime())/86400000)
  if (days===0) return 'Hoje'
  if (days===1) return 'Ontem'
  return msg.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
}

function needsDateSep(cur: WhatsAppMessage, prev: WhatsAppMessage|null): boolean {
  if (!prev) return true
  return new Date(cur.sentAt).toDateString() !== new Date(prev.sentAt).toDateString()
}

// Grouped bubble border-radius (Messenger/iMessage pattern)
type BubblePos = 'single' | 'first' | 'middle' | 'last'
function getBubblePos(msgs: WhatsAppMessage[], i: number): BubblePos {
  const cur = msgs[i]
  const prev = i > 0 ? msgs[i-1] : null
  const next = i < msgs.length-1 ? msgs[i+1] : null
  const sameAsPrev = prev && prev.direction === cur.direction &&
    new Date(cur.sentAt).getTime() - new Date(prev.sentAt).getTime() < 60000
  const sameAsNext = next && next.direction === cur.direction &&
    new Date(next.sentAt).getTime() - new Date(cur.sentAt).getTime() < 60000
  if (sameAsPrev && sameAsNext) return 'middle'
  if (sameAsPrev) return 'last'
  if (sameAsNext) return 'first'
  return 'single'
}

function bubbleRadius(pos: BubblePos, outbound: boolean): string {
  if (outbound) {
    switch(pos) {
      case 'single': return 'rounded-[18px]'
      case 'first':  return 'rounded-tl-[18px] rounded-tr-[18px] rounded-br-[4px] rounded-bl-[18px]'
      case 'middle': return 'rounded-tl-[18px] rounded-tr-[4px] rounded-br-[4px] rounded-bl-[18px]'
      case 'last':   return 'rounded-tl-[18px] rounded-tr-[4px] rounded-br-[18px] rounded-bl-[18px]'
    }
  } else {
    switch(pos) {
      case 'single': return 'rounded-[18px]'
      case 'first':  return 'rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]'
      case 'middle': return 'rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]'
      case 'last':   return 'rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px]'
    }
  }
}

// ── Media detection from text ──────────────────────────────

function getMediaTypeFromText(text: string): string | null {
  if (text.startsWith('[Imagem]')) return 'image'
  if (text.startsWith('[Vídeo]')) return 'video'
  if (text.startsWith('[Documento]')) return 'document'
  if (text.startsWith('[Áudio]')) return 'audio'
  if (text.startsWith('[Figurinha]')) return 'sticker'
  return null
}

function getMediaCaption(text: string): string {
  return text
    .replace(/^\[Imagem\]\s*/, '')
    .replace(/^\[Vídeo\]\s*/, '')
    .replace(/^\[Documento\]\s*/, '')
    .replace(/^\[Áudio\]\s*/, '')
    .replace(/^\[Figurinha\]\s*/, '')
    .replace(/^\[Localiza[^\]]*\]\s*/, '')
    .replace(/^\[Contato\]\s*/, '')
    .replace(/^\[Enquete\]\s*/, '')
    .replace(/^\[Visualiza[^\]]*\]\s*/, '')
    .replace(/^\[Mensagem[^\]]*\]\s*/, '')
    .trim()
}

// ── Audio Player (WhatsApp-style) ───────────────────────────

function fmtDurationStatic(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtAudioTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function AudioPlayer({
  mediaData, outbound, loading, onFetch, containerRef, knownDuration, error,
}: {
  mediaData: string | null
  outbound: boolean
  loading: boolean
  onFetch: () => void
  containerRef: React.RefObject<HTMLDivElement>
  knownDuration?: number
  error?: boolean
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(knownDuration ?? 0)
  const [playbackRate, setPlaybackRate] = useState(1)

  // Sync knownDuration into state when it arrives (e.g. after message reloads)
  useEffect(() => {
    if (knownDuration && knownDuration > 0) setDuration(knownDuration)
  }, [knownDuration])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  useEffect(() => {
    if (!mediaData) return
    const audio = audioRef.current
    if (!audio) return

    const trySetDuration = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      } else if (!isFinite(audio.duration)) {
        // Blob/stream Infinity bug — seek far to force real duration
        audio.currentTime = 9999
      }
    }

    const onSeeked = () => {
      if (audio.currentTime > 0 && (!isFinite(audio.duration) || audio.duration === 0)) {
        setDuration(audio.currentTime)
      }
      audio.currentTime = 0
    }

    const onTime = () => setCurrentTime(audio.currentTime)
    const onEnded = () => { setPlaying(false); setCurrentTime(0) }

    audio.addEventListener('loadedmetadata', trySetDuration)
    audio.addEventListener('durationchange', trySetDuration)
    audio.addEventListener('seeked', onSeeked)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    audio.load()

    return () => {
      audio.removeEventListener('loadedmetadata', trySetDuration)
      audio.removeEventListener('durationchange', trySetDuration)
      audio.removeEventListener('seeked', onSeeked)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
    }
  }, [mediaData])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration
  }

  function cycleSpeed() {
    const rates = [1, 1.5, 2]
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length]
    setPlaybackRate(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const bg = outbound ? 'bg-[#d9fdd3] dark:bg-emerald-900/60' : 'bg-white dark:bg-zinc-800'
  const waveColor = outbound ? '#4acd8d' : '#8696a0'
  const progressColor = '#00a884'

  if (!isMediaLoaded(mediaData)) {
    // Sent audio (WABA outbound) — no playback URL available, show duration badge only
    if (error) {
      return (
        <div ref={containerRef}>
          <div className={cn('flex items-center gap-2.5 rounded-2xl px-3 py-2.5', bg)}>
            <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
              <Mic className="h-5 w-5 text-[#00a884]" />
            </div>
            <span className="text-[13px] text-[#667781]">
              {knownDuration ? fmtDurationStatic(knownDuration) : 'Áudio enviado'}
            </span>
          </div>
        </div>
      )
    }

    return (
      <div ref={containerRef}>
        <div className={cn('flex items-center gap-3 rounded-2xl px-3 py-2.5 min-w-[220px]', bg)}>
          <button
            onClick={onFetch}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0 hover:bg-[#008f72] transition-colors disabled:opacity-60"
          >
            {loading
              ? <Loader2 className="h-5 w-5 animate-spin text-white" />
              : <Play className="h-5 w-5 text-white fill-white ml-0.5" />}
          </button>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-[2px] h-6">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-full"
                  style={{
                    height: `${6 + Math.abs(Math.sin(i * 0.8)) * 14}px`,
                    backgroundColor: waveColor,
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-[#667781]">0:00</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <audio ref={audioRef} src={mediaData!} preload="metadata" />
      <div className={cn('flex items-center gap-3 rounded-2xl px-3 py-2.5 min-w-[220px] max-w-[280px]', bg)}>
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0 hover:bg-[#008f72] transition-colors"
        >
          {playing
            ? <Pause className="h-5 w-5 text-white fill-white" />
            : <Play className="h-5 w-5 text-white fill-white ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Waveform / seekbar */}
          <div
            className="relative h-6 flex items-center cursor-pointer"
            onClick={seekTo}
          >
            {/* Static waveform bars */}
            <div className="absolute inset-0 flex items-center gap-[2px]">
              {Array.from({ length: 28 }).map((_, i) => {
                const barH = 6 + Math.abs(Math.sin(i * 0.8)) * 14
                const filled = (i / 28) * 100 <= progress
                return (
                  <div
                    key={i}
                    className="w-[2px] rounded-full flex-shrink-0 transition-colors duration-100"
                    style={{
                      height: `${barH}px`,
                      backgroundColor: filled ? progressColor : waveColor,
                      opacity: filled ? 1 : 0.45,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Time + speed */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#667781] tabular-nums">
              {playing || currentTime > 0 ? fmtAudioTime(currentTime) : fmtAudioTime(duration)}
            </span>
            <button
              onClick={cycleSpeed}
              className="text-[11px] font-semibold text-[#667781] hover:text-[#00a884] transition-colors px-1"
            >
              {playbackRate}×
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Media Component ─────────────────────────────────────────

function isMediaLoaded(data: string | null): boolean {
  return !!data && (data.startsWith('data:') || data.startsWith('http'))
}

function MediaBubble({ msg, outbound, onOpenLightbox }: { msg: WhatsAppMessage; outbound: boolean; onOpenLightbox?: (src: string, type: 'image' | 'video') => void }) {
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
    return <AudioPlayer mediaData={mediaData} outbound={outbound} loading={loading} onFetch={fetchMedia} containerRef={containerRef} knownDuration={knownDuration} error={error} />
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

// ── Component ───────────────────────────────────────────────

export function MessageArea({ contact, connections, organizationId, userId, userName, onContactUpdate, onBack, wabaEnabled = false }: MessageAreaProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.chat')
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [text, setText] = useState('')
  const [conn, setConn] = useState(connections[0]?.id||'')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [showQuickReply, setShowQuickReply] = useState(false)
  const [quickReplyQuery, setQuickReplyQuery] = useState('')
  const [replyingTo, setReplyingTo] = useState<WhatsAppMessage | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [contactData, setContactData] = useState<Contact | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingFilePreview, setPendingFilePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showReactionBar, setShowReactionBar] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ src: string; type: 'image' | 'video' } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [newMsgCount, setNewMsgCount] = useState(0)
  const virtuosoRef = useRef<VirtuosoHandle>(null)

  // Audio recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  const openLightbox = useCallback((src: string, type: 'image' | 'video') => {
    setLightbox({ src, type })
  }, [])

  const taRef = useRef<HTMLTextAreaElement>(null)
  const prevMsgCount = useRef(0)
  // Keep refs so callbacks are never stale
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const atBottomRef = useRef(atBottom)
  atBottomRef.current = atBottom

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    virtuosoRef.current?.scrollToIndex({
      index: 'LAST',
      behavior: behavior === 'instant' ? 'auto' : 'smooth',
    })
    setNewMsgCount(0)
  }, [])

  const scrollToMessage = useCallback((messageId: string) => {
    const index = messagesRef.current.findIndex(m => m.id === messageId)
    if (index >= 0) {
      virtuosoRef.current?.scrollToIndex({ index, behavior: 'smooth', align: 'center' })
      setHighlightedMessageId(messageId)
      setTimeout(() => setHighlightedMessageId(null), 2000)
    }
  }, [])

  const fetchMsgs = useCallback(async (show=false) => {
    if (show) setLoading(true)
    try {
      const r = await fetch(`/api/contact/${contact.id}/interactions?type=WHATSAPP`)
      if (!r.ok) throw new Error()
      const d: WhatsAppMessage[] = await r.json()
      setMessages(prev => {
        // Keep any temp messages that are still being sent
        const tempMsgs = prev.filter(m => m.id.startsWith('temp-'))
        const merged = [...d, ...tempMsgs]
        const newCount = merged.length - prev.length
        if (newCount > 0) {
          if (atBottomRef.current) {
            setTimeout(() => scrollToBottom(), 100)
          } else {
            setNewMsgCount(c => c + newCount)
          }
        }
        return merged
      })
    } catch { if (show) toast.error('Erro ao carregar mensagens') }
    finally { setLoading(false) }
  }, [contact.id, scrollToBottom])

  // Pusher: real-time typing indicator + message/status updates
  const contactPhone = contact.phone
  usePusher({
    organizationId,
    onChatTyping: useCallback((data: ChatTypingEvent) => {
      if (!contactPhone) return
      const jidPhone = data.remoteJid?.replace('@s.whatsapp.net', '').replace('@c.us', '') || ''
      const cleanContactPhone = contactPhone.replace(/\D/g, '')
      if (jidPhone.includes(cleanContactPhone) || cleanContactPhone.includes(jidPhone)) {
        setIsTyping(data.isTyping)
        if (data.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 5000)
        }
      }
    }, [contactPhone]),
    onMessageNew: useCallback((data: MessageNewEvent) => {
      if (data.contactId === contact.id) {
        fetchMsgs()
      }
    }, [contact.id, fetchMsgs]),
    onMessageStatus: useCallback((data: MessageStatusEvent) => {
      setMessages(prev => prev.map(m =>
        m.messageId === data.messageId ? { ...m, status: data.status } : m
      ))
    }, []),
  })

  const fetchContactData = useCallback(async () => {
    try {
      const r = await fetch(`/api/contact/${contact.id}`)
      if (r.ok) {
        const data = await r.json()
        setContactData(data)
      }
    } catch (error) {
      console.error('Error fetching contact data:', error)
    }
  }, [contact.id])

  const toggleSidebar = () => {
    if (!showSidebar && !contactData) {
      fetchContactData()
    }
    setShowSidebar(!showSidebar)
  }

  useEffect(() => { fetchMsgs(true) }, [contact.id, fetchMsgs])

  // Polling: rebusca mensagens a cada 5s (simples, confiável, self-healing)
  useEffect(() => {
    const i = setInterval(() => fetchMsgs(), 5000)
    return () => clearInterval(i)
  }, [fetchMsgs])

  // Buscar usuários da organização
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/whatsapp/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchUsers()
  }, [])

  // Fetch profile picture via proxy (WhatsApp CDN URLs expire)
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null)
  useEffect(() => {
    setProfilePicUrl(null)
    if (contact.phone && !contact.phone.includes('@g.us')) {
      fetch(`/api/whatsapp/profile-pic?contactId=${contact.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.profilePicUrl) setProfilePicUrl(data.profilePicUrl)
        })
        .catch(() => {})
    }
  }, [contact.id, contact.phone])

  // Marcar mensagens como lidas quando a conversa é aberta
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch('/api/whatsapp/messages/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: contact.id }),
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    }
    markAsRead()
  }, [contact.id])

  // Auto-resize textarea
  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = 'auto'
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 120) + 'px'
    }
  }, [text])

  // Quick Reply detection: "/" triggers autocomplete
  useEffect(() => {
    const lastChar = text[text.length - 1]
    const words = text.split(/\s/)
    const lastWord = words[words.length - 1]

    if (lastWord.startsWith('/') && lastWord.length > 1) {
      setShowQuickReply(true)
      setQuickReplyQuery(lastWord.slice(1)) // Remove "/" prefix
    } else if (lastWord === '/') {
      setShowQuickReply(true)
      setQuickReplyQuery('')
    } else {
      setShowQuickReply(false)
      setQuickReplyQuery('')
    }
  }, [text])

  // Scroll to bottom on first load
  useEffect(() => {
    if (messages.length > 0 && prevMsgCount.current === 0) {
      setTimeout(() => scrollToBottom('instant'), 50)
    }
    prevMsgCount.current = messages.length
  }, [messages.length, scrollToBottom])

  // Pre-compute per-item metadata for Virtuoso (avoids re-computing inside render)
  const messageItems = useMemo((): MessageItem[] =>
    messages.map((msg, i) => ({
      msg,
      showDate: needsDateSep(msg, i > 0 ? messages[i - 1] : null),
      pos: getBubblePos(messages, i),
    })),
  [messages])

  const handleQuickReplySelect = (content: string) => {
    // Substituir o "/" + query pelo conteúdo da resposta rápida
    const words = text.split(/\s/)
    words[words.length - 1] = content
    setText(words.join(' '))
    setShowQuickReply(false)
    setQuickReplyQuery('')
    // Focus no textarea
    taRef.current?.focus()
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const r = await fetch(`/api/whatsapp/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (!r.ok) throw new Error('Failed to react')

      // Refresh messages to get updated reactions
      fetchMsgs()
      setShowReactionBar(null)
    } catch (error) {
      console.error('Error reacting:', error)
      toast.error('Erro ao reagir à mensagem')
    }
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!wabaEnabled && !conn) return

    const messageText = text.trim()
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Create optimistic message
    const optimisticMsg: WhatsAppMessage = {
      id: tempId,
      text: messageText,
      direction: 'OUTBOUND',
      sentAt: new Date(),
      deliveredAt: null,
      readAt: null,
      status: 'SENDING',
      mediaUrl: null,
      mediaType: null,
      messageId: undefined,
      replyToId: replyingTo?.id || null,
      replyToText: replyingTo?.text || null,
      reactions: [],
    }

    // Add optimistic message instantly to UI
    setMessages(prev => [...prev, optimisticMsg])
    setText('')
    const replyingToMsg = replyingTo
    setReplyingTo(null)
    setTimeout(() => scrollToBottom(), 50)

    setSending(true)
    try {
      let r: Response
      if (wabaEnabled) {
        const payload: any = { contactId: contact.id, message: messageText }
        if (replyingToMsg) payload.replyToId = replyingToMsg.id
        r = await fetch('/api/whatsapp/send-waba', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        const payload: any = { connectionId: conn, contactId: contact.id, message: messageText }
        if (replyingToMsg) payload.replyToId = replyingToMsg.id
        r = await fetch('/api/whatsapp/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error)
      }
      const confirmedMsg = await r.json()

      // Replace temp message with confirmed one from server
      setMessages(prev => prev.map(m => m.id === tempId ? confirmedMsg : m))
      setTimeout(() => scrollToBottom(), 100)
    } catch(err:any) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(err.message||'Erro ao enviar')
    }
    finally { setSending(false) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 16MB.')
      return
    }
    setPendingFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPendingFilePreview(url)
    } else {
      setPendingFilePreview(null)
    }
  }

  const cancelFile = () => {
    setPendingFile(null)
    if (pendingFilePreview) {
      URL.revokeObjectURL(pendingFilePreview)
      setPendingFilePreview(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMedia = async () => {
    if (!pendingFile || (!wabaEnabled && !conn)) return
    const tempId = `temp-media-${Date.now()}`
    const mediaLabel = pendingFile.type.startsWith('image/') ? '[Imagem]'
      : pendingFile.type.startsWith('video/') ? '[Vídeo]'
      : pendingFile.type.startsWith('audio/') ? '[Áudio]'
      : `[Documento] ${pendingFile.name}`

    const caption = text.trim()
    const messageText = caption ? `${mediaLabel} ${caption}` : mediaLabel

    const optimisticMsg: WhatsAppMessage = {
      id: tempId,
      text: messageText,
      direction: 'OUTBOUND',
      sentAt: new Date(),
      deliveredAt: null,
      readAt: null,
      status: 'SENDING',
      mediaUrl: pendingFilePreview,
      mediaType: pendingFile.type.startsWith('image/') ? 'image'
        : pendingFile.type.startsWith('video/') ? 'video'
        : pendingFile.type.startsWith('audio/') ? 'audio' : 'document',
      messageId: undefined,
      replyToId: null,
      replyToText: null,
      reactions: [],
    }

    setMessages(prev => [...prev, optimisticMsg])
    setText('')
    const fileToSend = pendingFile
    cancelFile()
    setTimeout(() => scrollToBottom(), 50)

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('file', fileToSend)
      formData.append('contactId', contact.id)
      if (caption) formData.append('caption', caption)
      if (!wabaEnabled && conn) formData.append('connectionId', conn)

      const endpoint = wabaEnabled ? '/api/whatsapp/send-waba-media' : '/api/whatsapp/send-media'
      const r = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error)
      }
      const confirmedMsg = await r.json()
      // Replace temp message with confirmed one from server
      setMessages(prev => prev.map(m => m.id === tempId ? confirmedMsg : m))
      setTimeout(() => scrollToBottom(), 100)
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error(err.message || 'Erro ao enviar mídia')
    } finally {
      setSending(false)
    }
  }

  // --- Audio recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      audioChunksRef.current = []

      // Prefer ogg/opus (WhatsApp PTT native format); fallback to webm
      const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        // Cleanup stream tracks
        stream.getTracks().forEach(t => t.stop())
        audioStreamRef.current = null
      }

      recorder.start(100) // collect in 100ms chunks
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err: any) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Seu browser não suporta gravação de áudio')
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        toast.error('Permissão de microfone negada. Clique no cadeado na barra de endereço e permita o microfone.')
      } else if (err?.name === 'NotFoundError') {
        toast.error('Nenhum microfone encontrado no dispositivo')
      } else {
        toast.error('Não foi possível acessar o microfone. Verifique as permissões do browser.')
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    audioChunksRef.current = []
    setIsRecording(false)
    setRecordingTime(0)
  }

  const sendRecording = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    if (!wabaEnabled && !conn) return

    // Stop recording and wait for final data
    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        audioStreamRef.current?.getTracks().forEach(t => t.stop())
        audioStreamRef.current = null

        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
        setIsRecording(false)

        // Use the actual recorded mimetype so WhatsApp gets the right format
        const recordedMime = recorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMime })
        audioChunksRef.current = []

        if (audioBlob.size === 0) {
          setRecordingTime(0)
          resolve()
          return
        }

        const duration = recordingTime
        setRecordingTime(0)

        const localUrl = URL.createObjectURL(audioBlob)
        const tempId = `temp-audio-${Date.now()}`
        const optimisticMsg: WhatsAppMessage = {
          id: tempId,
          text: `[Áudio ${fmtDuration(duration)}]`,
          direction: 'OUTBOUND',
          sentAt: new Date(),
          deliveredAt: null,
          readAt: null,
          status: 'SENDING',
          mediaUrl: localUrl,
          mediaType: 'audio',
          messageId: undefined,
          replyToId: null,
          replyToText: null,
          reactions: [],
        }

        setMessages(prev => [...prev, optimisticMsg])
        setTimeout(() => scrollToBottom(), 50)

        setSending(true)
        try {
          // Pick file extension based on actual mime type
          const ext = recordedMime.includes('ogg') ? 'ogg' : 'webm'
          const formData = new FormData()
          formData.append('file', audioBlob, `audio.${ext}`)
          formData.append('contactId', contact.id)
          formData.append('ptt', 'true')
          formData.append('duration', String(duration))
          if (!wabaEnabled) formData.append('connectionId', conn)

          const endpoint = wabaEnabled ? '/api/whatsapp/send-waba-media' : '/api/whatsapp/send-media'
          const r = await fetch(endpoint, {
            method: 'POST',
            body: formData,
          })
          if (!r.ok) {
            const d = await r.json()
            throw new Error(d.error)
          }
          const confirmedMsg = await r.json()
          URL.revokeObjectURL(localUrl)
          // Preserve the duration text from the optimistic message
          setMessages(prev => prev.map(m =>
            m.id === tempId
              ? { ...confirmedMsg, text: `[Áudio ${fmtDuration(duration)}]` }
              : m
          ))
          setTimeout(() => scrollToBottom(), 100)
        } catch (err: any) {
          URL.revokeObjectURL(localUrl)
          setMessages(prev => prev.filter(m => m.id !== tempId))
          toast.error(err.message || 'Erro ao enviar áudio')
        } finally {
          setSending(false)
        }
        resolve()
      }

      recorder.stop()
    })
  }

  const fmtDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop()
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      audioStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})

  const name = getName(contact)
  const sub = getSub(contact)
  const isGrp = contact.phone?.includes('@g.us')??false
  const clr = colorHash(name)

  const initials = () => {
    if (contact.name && !contact.name.includes('@'))
      return contact.name.split(' ').filter(Boolean).map(w=>w[0]).join('').toUpperCase().slice(0,2)
    return '??'
  }

  // Check if message has media
  const hasMedia = (msg: WhatsAppMessage): boolean => {
    if (msg.mediaType) return true
    return !!getMediaTypeFromText(msg.text)
  }

  // Get display text (remove media prefix for pure media messages)
  const getDisplayText = (msg: WhatsAppMessage): string | null => {
    const caption = getMediaCaption(msg.text)
    // If the text is just a tag like [Imagem], [Áudio], etc., show nothing (media handles it)
    if (!caption || caption === msg.text) {
      // Check if it's a plain text message
      const mType = msg.mediaType || getMediaTypeFromText(msg.text)
      if (mType) return caption || null // media message - return caption or nothing
      return msg.text // plain text
    }
    return null // caption is handled by MediaBubble
  }

  return (
    <div
      className="flex-1 flex min-w-0 overflow-hidden relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) {
          if (file.size > 16 * 1024 * 1024) {
            toast.error('Arquivo muito grande (máx 16MB)')
            return
          }
          setPendingFile(file)
          if (file.type.startsWith('image/')) {
            setPendingFilePreview(URL.createObjectURL(file))
          } else {
            setPendingFilePreview(null)
          }
        }
      }}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-800 rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
            <Paperclip className="h-6 w-6 text-primary" />
            <span className="text-lg font-medium text-foreground">Solte o arquivo aqui</span>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <MediaLightbox
          src={lightbox.src}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Main message area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search bar (conditionally rendered) */}
        {isSearchOpen && (
        <MessageSearch
          messages={messages.map(m => ({ id: m.id, text: m.text }))}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={scrollToMessage}
          containerRef={{ current: null }}
        />
      )}

      {/* Header — hidden on mobile (app bar contextual already shows name + back) */}
      <div className="hidden lg:flex h-[60px] px-4 border-b items-center justify-between bg-[#f0f2f5] whatsapp-header flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile back button */}
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0 md:hidden"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            {profilePicUrl && (
              <AvatarImage src={profilePicUrl} alt={name} />
            )}
            <AvatarFallback className={cn('text-xs font-semibold text-white', clr)}>
              {isGrp ? <Users className="h-4 w-4" /> : initials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-[15px] text-[#111b21] dark:text-zinc-100 leading-tight">{name}</p>
            {isTyping ? (
              <TypingIndicator variant="inline" className="mt-0.5" />
            ) : (
              sub && <p className="text-[12px] text-[#667781] leading-tight mt-0.5">{sub}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Agent Assignment (Fase 3.1) */}
          {users.length > 0 && (
            <AgentAssignment
              contactId={contact.id}
              assignedUserId={contact.chatConversation?.assignedUserId || null}
              users={users}
              onAssignmentChange={onContactUpdate}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            aria-label="Informações do contato"
            aria-pressed={showSidebar}
            className={cn(
              'h-8 w-8 p-0',
              showSidebar && 'bg-[#00a884]/10 text-[#00a884]'
            )}
            title="Informações do contato"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Buscar na conversa"
            aria-pressed={isSearchOpen}
            className="h-8 w-8 p-0"
            title="Buscar na conversa"
          >
            <Search className="h-4 w-4" />
          </Button>
          <ConversationTags
            contactId={contact.id}
            contactTags={contact.tags || []}
            onTagsUpdate={onContactUpdate}
          />
          {connections.length > 1 && (
            <Select value={conn} onValueChange={setConn}>
              <SelectTrigger className="w-auto max-w-[180px] h-8 text-xs border-[#e9edef]">
                <SelectValue placeholder="Conexão" />
              </SelectTrigger>
              <SelectContent>
                {connections.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.displayName || c.phoneNumber || c.instanceName.split('-').pop()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Mobile action bar — shown only on mobile (header is hidden there) */}
      <div className="lg:hidden flex items-center gap-1 px-3 py-1.5 border-b bg-[#f0f2f5] dark:bg-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 flex-1">
          <Avatar className="h-6 w-6 shrink-0">
            {profilePicUrl && <AvatarImage src={profilePicUrl} alt={name} />}
            <AvatarFallback className={cn('text-[9px] font-semibold text-white', clr)}>
              {isGrp ? <Users className="h-3 w-3" /> : initials()}
            </AvatarFallback>
          </Avatar>
          {sub && <span className="truncate">{sub}</span>}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {users.length > 0 && (
            <AgentAssignment
              contactId={contact.id}
              assignedUserId={contact.chatConversation?.assignedUserId || null}
              users={users}
              onAssignmentChange={onContactUpdate}
            />
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="h-8 w-8 p-0" aria-label="Buscar">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleSidebar}
            className={cn('h-8 w-8 p-0', showSidebar && 'bg-[#00a884]/10 text-[#00a884]')}
            aria-label="Informações do contato">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      {loading && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4 whatsapp-bg-pattern">
          <div className="w-full max-w-md space-y-3">
            {[...Array(5)].map((_,i) => (
              <div key={i} className={cn('flex', i%2===0?'justify-start':'justify-end')}>
                <div className={cn(
                  'h-10 rounded-[18px] animate-pulse',
                  i%2===0 ? 'bg-white/60 w-[55%]' : 'bg-[#d9fdd3]/60 w-[45%]'
                )} />
              </div>
            ))}
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center whatsapp-bg-pattern">
          <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-xl px-6 py-5 text-center shadow-[0_1px_3px_rgba(11,20,26,0.08)] max-w-[280px]">
            <div className="w-14 h-14 rounded-full bg-[#00a884]/10 flex items-center justify-center mx-auto mb-3">
              <Send className="h-6 w-6 text-[#00a884]" />
            </div>
            <p className="text-sm font-semibold text-[#111b21] dark:text-zinc-100">{t('noConversations')}</p>
            <p className="text-xs text-[#667781] mt-1">
              Envie a primeira mensagem para iniciar a conversa
            </p>
          </div>
        </div>
      ) : (
        <Virtuoso
          ref={virtuosoRef}
          style={{ flex: 1 }}
          className="whatsapp-bg-pattern overflow-x-hidden"
          role="log"
          aria-live="polite"
          aria-label="Mensagens da conversa"
          data={messageItems}
          followOutput="smooth"
          initialTopMostItemIndex={Math.max(0, messageItems.length - 1)}
          atBottomStateChange={(bottom) => {
            setAtBottom(bottom)
            if (bottom) setNewMsgCount(0)
          }}
          components={{
            Footer: () => (
              <>
                {isTyping && (
                  <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
                    <TypingIndicator variant="bubble" className="mt-2 ml-2" />
                  </div>
                )}
                <div className="h-4" />
              </>
            ),
          }}
          itemContent={(_index, { msg, showDate, pos }) => {
              const out = msg.direction === 'OUTBOUND'
              const isGroupedWithPrev = pos === 'middle' || pos === 'last'
              const media = hasMedia(msg)
              const displayText = getDisplayText(msg)

              return (
                <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
                  {/* Date separator - sticky */}
                  {showDate && (
                    <div className="sticky top-0 z-10 flex justify-center py-2 my-1">
                      <span className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur text-[12.5px] text-[#54656f] px-3 py-1 rounded-lg shadow-[0_1px_1px_rgba(11,20,26,0.13)] font-medium select-none">
                        {fmtDate(msg.sentAt)}
                      </span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={cn(
                      'flex message-bubble-animate group relative w-full',
                      out ? 'justify-end' : 'justify-start',
                      isGroupedWithPrev ? 'mt-[2px]' : 'mt-2'
                    )}
                    onMouseEnter={() => setShowReactionBar(msg.id)}
                    onMouseLeave={() => setShowReactionBar(null)}
                  >
                    {/* Reply button (shows on hover) */}
                    {!out && (
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 self-end mb-1 p-1.5 rounded-full hover:bg-black/5"
                        title="Responder"
                      >
                        <Reply className="h-4 w-4 text-[#667781]" />
                      </button>
                    )}

                    <div
                      role="article"
                      aria-label={`Mensagem ${out ? 'enviada' : 'recebida'} às ${fmtTime(msg.sentAt)}`}
                      className={cn(
                        'max-w-[65%] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] relative overflow-hidden transition-colors',
                        media ? 'p-[3px]' : 'px-[9px] pt-[6px] pb-[7px]',
                        bubbleRadius(pos, out),
                        highlightedMessageId === msg.id
                          ? 'ring-2 ring-[#f59e0b] bg-[#fef3c7]'
                          : out
                            ? 'bg-[#d9fdd3] whatsapp-bubble-outgoing'
                            : 'bg-white whatsapp-bubble-incoming'
                      )}
                    >
                      {/* Quoted message (if replying) */}
                      {msg.replyToId && msg.replyToText && (
                        <div className="mb-1">
                          <QuotedMessage
                            text={msg.replyToText}
                            senderName={msg.direction === 'INBOUND' ? name : 'Você'}
                            outbound={out}
                            onClick={() => {
                              if (msg.replyToId) {
                                scrollToMessage(msg.replyToId)
                              }
                            }}
                          />
                        </div>
                      )}

                      {/* Media content */}
                      {media && (
                        <div className="mb-0.5">
                          <MediaBubble msg={msg} outbound={out} onOpenLightbox={openLightbox} />
                        </div>
                      )}

                      {/* Text content */}
                      {(!media || displayText) && (
                        <div className={cn(media && 'px-[6px] pb-[4px] pt-[2px]')}>
                          <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100 whitespace-pre-wrap break-words">
                            {media ? (displayText || '') : msg.text}
                            {/* Invisible spacer for timestamp */}
                            <span className="inline-block w-[70px]" />
                          </p>
                        </div>
                      )}

                      {/* Timestamp + status */}
                      <span className={cn(
                        'float-right flex items-center gap-1 ml-2 relative',
                        media && !displayText ? 'px-[6px] pb-[4px] -mt-1' : '-mt-4',
                      )}>
                        <span className="text-[10.5px] text-[#667781] leading-none tabular-nums">
                          {fmtTime(msg.sentAt)}
                        </span>
                        {out && (
                          msg.status === 'SENDING'
                            ? <Loader2 className="h-[14px] w-[14px] text-[#8696a0] animate-spin message-status-icon" />
                            : msg.status === 'READ'
                              ? <CheckCheck className="h-[16px] w-[16px] text-[#53bdeb] message-status-icon" />
                              : msg.status === 'DELIVERED'
                                ? <CheckCheck className="h-[16px] w-[16px] text-[#8696a0] message-status-icon" />
                                : <Check className="h-[16px] w-[16px] text-[#8696a0] message-status-icon" />
                        )}
                      </span>
                    </div>

                    {/* Reaction bar (shows on hover) */}
                    {showReactionBar === msg.id && (
                      <div className={cn(
                        'absolute -top-12 z-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-150',
                        out ? 'right-0' : 'left-0'
                      )}>
                        <ReactionBar
                          onReact={(emoji) => handleReaction(msg.id, emoji)}
                        />
                      </div>
                    )}

                    {/* Reaction chips below bubble */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={cn(
                        'absolute -bottom-5',
                        out ? 'right-0' : 'left-0'
                      )}>
                        <ReactionChips
                          reactions={msg.reactions}
                          onToggle={(emoji) => handleReaction(msg.id, emoji)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
          }}
        />
      )}

      {/* Scroll to bottom FAB */}
      {!atBottom && messages.length > 0 && (
        <div className="relative">
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-2 right-4 z-20 h-10 w-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
            title="Rolar para o final"
          >
            <ChevronDown className="h-5 w-5 text-[#54656f]" />
            {newMsgCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full bg-[#00a884] text-white text-[11px] font-bold flex items-center justify-center px-1">
                {newMsgCount > 99 ? '99+' : newMsgCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Reply preview bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white whatsapp-header border-t border-[#e9edef] dark:border-zinc-700 flex items-center gap-2">
          <Reply className="h-4 w-4 text-[#00a884] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#00a884] leading-tight">
              Respondendo a {replyingTo.direction === 'INBOUND' ? name : 'Você'}
            </p>
            <p className="text-[12px] text-[#667781] truncate leading-tight">
              {replyingTo.text}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
            title="Cancelar resposta"
          >
            <X className="h-4 w-4 text-[#667781]" />
          </button>
        </div>
      )}

      {/* File preview bar */}
      {pendingFile && (
        <div className="px-3 py-2 bg-[#e2f7cb] dark:bg-emerald-900/30 border-t border-[#e9edef] dark:border-zinc-700 flex items-center gap-3">
          {pendingFilePreview ? (
            <img src={pendingFilePreview} alt="Preview" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="h-12 w-12 rounded bg-white/50 dark:bg-white/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#54656f]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-[#111b21] dark:text-white">{pendingFile.name}</p>
            <p className="text-xs text-[#667781]">{(pendingFile.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={cancelFile} className="p-1 rounded-full hover:bg-black/5" title={tCommon('buttons.cancel')}>
            <X className="h-4 w-4 text-[#667781]" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-2 bg-[#f0f2f5] whatsapp-header border-t border-[#e9edef] dark:border-zinc-700 flex items-end gap-2">
        {isRecording ? (
          /* Recording UI — replaces the normal input */
          <>
            <button
              type="button"
              onClick={cancelRecording}
              aria-label="Cancelar gravação"
              className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <div className="flex-1 flex items-center gap-3 bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 min-h-[42px] shadow-[0_1px_1px_rgba(11,20,26,0.06)]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium text-[#111b21] dark:text-zinc-100 tabular-nums">
                {fmtDuration(recordingTime)}
              </span>
              <div className="flex-1 flex items-center gap-[2px] overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-[#00a884]/60"
                    style={{
                      height: `${8 + Math.sin((recordingTime * 3 + i) * 0.5) * 8 + Math.random() * 6}px`,
                      transition: 'height 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={sendRecording}
              disabled={sending}
              aria-label="Enviar áudio"
              className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884] hover:bg-[#008f72] text-white transition-all duration-200 active:scale-90"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </>
        ) : (
          /* Normal input */
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              aria-label="Anexar arquivo"
              className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 text-[#54656f] hover:text-[#3b4a54] hover:bg-black/5 transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <div className="flex-1 relative">
              {showQuickReply && taRef.current && (
                <QuickReplyPicker
                  query={quickReplyQuery}
                  onSelect={handleQuickReplySelect}
                  onClose={() => {
                    setShowQuickReply(false)
                    setQuickReplyQuery('')
                  }}
                  position={{
                    top: taRef.current.offsetHeight,
                    left: 0,
                  }}
                  contact={contact}
                  userName={userName}
                />
              )}

              <textarea
                ref={taRef}
                placeholder="Mensagem"
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={sending}
                rows={1}
                aria-label="Campo de mensagem"
                aria-describedby="message-help-text"
                className={cn(
                  'w-full resize-none rounded-lg border-0',
                  'bg-white whatsapp-input px-3 py-[9px] text-[14px] leading-[1.46]',
                  'placeholder:text-[#8696a0]',
                  'focus:outline-none focus:ring-1 focus:ring-[#00a884]/40',
                  'disabled:opacity-50',
                  'min-h-[42px] max-h-[120px]',
                  'shadow-[0_1px_1px_rgba(11,20,26,0.06)]',
                  'whatsapp-text-primary'
                )}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) }
                }}
                onPaste={e => {
                  const items = e.clipboardData?.items
                  if (!items) return
                  for (const item of Array.from(items)) {
                    if (item.type.startsWith('image/')) {
                      e.preventDefault()
                      const file = item.getAsFile()
                      if (file) {
                        setPendingFile(file)
                        setPendingFilePreview(URL.createObjectURL(file))
                      }
                      break
                    }
                  }
                }}
              />
              <span id="message-help-text" className="sr-only">
                Pressione Enter para enviar, Shift+Enter para nova linha
              </span>
            </div>

            {(text.trim() || pendingFile) ? (
              <button
                type="button"
                onClick={pendingFile ? sendMedia : send}
                disabled={sending}
                aria-label={pendingFile ? 'Enviar arquivo' : 'Enviar mensagem'}
                className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884] hover:bg-[#008f72] text-white transition-all duration-200 active:scale-90 focus-visible:ring-2 focus-visible:ring-[#00a884] focus-visible:ring-offset-2"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={sending}
                aria-label="Gravar áudio"
                className="h-[42px] w-[42px] rounded-full flex items-center justify-center flex-shrink-0 bg-[#00a884] hover:bg-[#008f72] text-white transition-all duration-200 active:scale-90 focus-visible:ring-2 focus-visible:ring-[#00a884] focus-visible:ring-offset-2"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>
      </div>

      {/* Contact Sidebar */}
      {showSidebar && contactData && contactData.tags && contactData.deals && contactData.notes && contactData._count && (
        <ContactSidebar
          contact={{
            ...contactData,
            tags: contactData.tags,
            deals: contactData.deals,
            notes: contactData.notes,
            _count: contactData._count,
          }}
          onClose={() => setShowSidebar(false)}
          onChatCleared={() => { setMessages([]); fetchContactData() }}
        />
      )}
    </div>
  )
}
