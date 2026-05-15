'use client'

import { cn } from '@/lib/utils'
import { Image as ImageIcon, Video, Mic, FileText, MapPin, Sticker } from 'lucide-react'

interface QuotedMessageProps {
  text: string
  senderName: string
  outbound?: boolean
  onClick?: () => void
}

function detectMediaKind(text: string): { Icon: typeof ImageIcon; label: string } | null {
  const t = text.trim().toLowerCase()
  if (t.startsWith('[imagem') || t.startsWith('[image')) return { Icon: ImageIcon, label: 'Imagem' }
  if (t.startsWith('[vídeo') || t.startsWith('[video')) return { Icon: Video, label: 'Vídeo' }
  if (t.startsWith('[áudio') || t.startsWith('[audio')) return { Icon: Mic, label: 'Áudio' }
  if (t.startsWith('[documento') || t.startsWith('[document') || t.startsWith('[arquivo')) return { Icon: FileText, label: 'Documento' }
  if (t.startsWith('[localização') || t.startsWith('[location')) return { Icon: MapPin, label: 'Localização' }
  if (t.startsWith('[sticker') || t.startsWith('[figurinha')) return { Icon: Sticker, label: 'Figurinha' }
  return null
}

function stripMediaTag(text: string): string {
  // remove leading [TYPE] or [TYPE 0:04] tags so we show the caption / fallback only
  return text.replace(/^\[[^\]]+\]\s*/i, '').trim()
}

export function QuotedMessage({ text, senderName, outbound = false, onClick }: QuotedMessageProps) {
  const media = detectMediaKind(text)
  const displayText = media ? (stripMediaTag(text) || media.label) : text
  const Icon = media?.Icon

  return (
    <button
      onClick={onClick}
      title="Ir para mensagem"
      className={cn(
        'group w-full text-left rounded-md px-2.5 py-1.5 mb-1 border-l-4 transition-all',
        'hover:bg-black/10 active:scale-[0.99] cursor-pointer',
        outbound
          ? 'bg-black/5 border-l-[#00a884]'
          : 'bg-white/50 border-l-[#00a884]'
      )}
    >
      <p className="text-[11px] font-semibold text-[#00a884] leading-tight truncate">
        {senderName}
      </p>
      <div className="flex items-start gap-1.5 mt-0.5">
        {Icon && (
          <Icon className="h-3 w-3 text-[#667781] shrink-0 mt-[3px]" />
        )}
        <p className="text-[12px] text-[#667781] line-clamp-2 leading-tight flex-1 min-w-0">
          {displayText}
        </p>
      </div>
    </button>
  )
}
