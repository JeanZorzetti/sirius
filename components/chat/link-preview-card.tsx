'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

const URL_REGEX = /https?:\/\/[^\s<>"']+/i

export function extractFirstUrl(text: string): string | null {
  if (!text) return null
  const m = text.match(URL_REGEX)
  return m ? m[0].replace(/[.,;:!?)\]}>]+$/, '') : null
}

// Module-level cache so different bubbles for the same url share one fetch
const inflight = new Map<string, Promise<LinkPreview | null>>()
const resultCache = new Map<string, LinkPreview | null>()

async function fetchPreview(url: string): Promise<LinkPreview | null> {
  if (resultCache.has(url)) return resultCache.get(url) ?? null
  if (inflight.has(url)) return inflight.get(url)!

  const p = (async () => {
    try {
      const res = await fetch(`/api/whatsapp/link-preview?url=${encodeURIComponent(url)}`)
      if (res.status === 204 || !res.ok) {
        resultCache.set(url, null)
        return null
      }
      const data = (await res.json()) as LinkPreview
      resultCache.set(url, data)
      return data
    } catch {
      resultCache.set(url, null)
      return null
    } finally {
      inflight.delete(url)
    }
  })()

  inflight.set(url, p)
  return p
}

interface LinkPreviewCardProps {
  url: string
  outbound?: boolean
}

export function LinkPreviewCard({ url, outbound = false }: LinkPreviewCardProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null)
  const [loaded, setLoaded] = useState(false)
  const elRef = useRef<HTMLDivElement>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const el = elRef.current
    if (!el || triggered.current) return

    // If already cached, fetch immediately without observer
    if (resultCache.has(url)) {
      const cached = resultCache.get(url) ?? null
      setPreview(cached)
      setLoaded(true)
      triggered.current = true
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true
          fetchPreview(url).then(data => {
            setPreview(data)
            setLoaded(true)
          })
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [url])

  // Reserve no space until we know there is a preview
  if (!loaded) return <div ref={elRef} className="h-px" />
  if (!preview) return null

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block rounded-lg overflow-hidden border mb-1.5 max-w-[280px] transition-colors',
        outbound
          ? 'bg-black/5 border-black/10 hover:bg-black/10'
          : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      )}
    >
      {preview.image && (
        <div className="relative w-full h-32 bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.image}
            alt={preview.title || ''}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}
      <div className="p-2.5 space-y-1">
        {preview.siteName && (
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#667781] font-medium">
            <ExternalLink className="h-2.5 w-2.5" />
            <span className="truncate">{preview.siteName}</span>
          </div>
        )}
        {preview.title && (
          <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
            {preview.title}
          </p>
        )}
        {preview.description && (
          <p className="text-[11px] text-[#667781] line-clamp-2 leading-snug">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  )
}
