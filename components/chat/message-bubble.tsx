'use client'

import { memo, useCallback } from 'react'
import { Reply, Check, CheckCheck, Loader2, ImageIcon, Video, FileText, Download, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuotedMessage } from './quoted-message'
import { ReactionBar } from './reaction-bar'
import { ReactionChips } from './reaction-chips'

interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

interface WhatsAppMessage {
  id: string
  text: string
  direction: string
  sentAt: Date
  deliveredAt: Date | null
  readAt: Date | null
  status: string
  mediaUrl: string | null
  mediaType: string | null
  messageId?: string
  replyToId?: string | null
  replyToText?: string | null
  reactions?: Reaction[]
}

interface MessageBubbleProps {
  message: WhatsAppMessage
  prevMessage: WhatsAppMessage | null
  contactName: string
  showReactionBar: boolean
  highlightedMessageId: string | null
  onReply: () => void
  onReact: (emoji: string) => void
  onScrollToMessage: (messageId: string) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  setMessageRef: (el: HTMLDivElement | null) => void
}

// Helper functions
function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(d: Date): string {
  const now = new Date(), msg = new Date(d)
  const days = Math.floor((now.getTime() - msg.getTime()) / 86400000)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  return msg.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function needsDateSep(cur: WhatsAppMessage, prev: WhatsAppMessage | null): boolean {
  if (!prev) return true
  return new Date(cur.sentAt).toDateString() !== new Date(prev.sentAt).toDateString()
}

type BubblePos = 'single' | 'first' | 'middle' | 'last'
function getBubblePos(msg: WhatsAppMessage, prev: WhatsAppMessage | null): BubblePos {
  if (!prev) return 'single'
  const sameAsPrev = prev.direction === msg.direction &&
    new Date(msg.sentAt).getTime() - new Date(prev.sentAt).getTime() < 60000
  if (!sameAsPrev) return 'single'
  return 'first' // Simplified - would need next message for full logic
}

function bubbleRadius(pos: BubblePos, outbound: boolean): string {
  if (outbound) {
    switch (pos) {
      case 'single': return 'rounded-[18px]'
      case 'first': return 'rounded-tl-[18px] rounded-tr-[18px] rounded-br-[4px] rounded-bl-[18px]'
      case 'middle': return 'rounded-tl-[18px] rounded-tr-[4px] rounded-br-[4px] rounded-bl-[18px]'
      case 'last': return 'rounded-tl-[18px] rounded-tr-[4px] rounded-br-[18px] rounded-bl-[18px]'
    }
  } else {
    switch (pos) {
      case 'single': return 'rounded-[18px]'
      case 'first': return 'rounded-tl-[18px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]'
      case 'middle': return 'rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[4px]'
      case 'last': return 'rounded-tl-[4px] rounded-tr-[18px] rounded-br-[18px] rounded-bl-[18px]'
    }
  }
}

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
    .trim()
}

function hasMedia(msg: WhatsAppMessage): boolean {
  if (msg.mediaType) return true
  return !!getMediaTypeFromText(msg.text)
}

function getDisplayText(msg: WhatsAppMessage): string | null {
  const caption = getMediaCaption(msg.text)
  if (!caption || caption === msg.text) {
    const mType = msg.mediaType || getMediaTypeFromText(msg.text)
    if (mType) return caption || null
    return msg.text
  }
  return null
}

/**
 * Memoized Message Bubble Component (Fase 4.3)
 * Optimized for virtualization with react-virtuoso
 */
export const MessageBubble = memo(function MessageBubble({
  message: msg,
  prevMessage: prev,
  contactName,
  showReactionBar,
  highlightedMessageId,
  onReply,
  onReact,
  onScrollToMessage,
  onMouseEnter,
  onMouseLeave,
  setMessageRef
}: MessageBubbleProps) {
  const out = msg.direction === 'OUTBOUND'
  const showDate = needsDateSep(msg, prev)
  const pos = getBubblePos(msg, prev)
  const isGroupedWithPrev = pos === 'middle' || pos === 'last'
  const media = hasMedia(msg)
  const displayText = getDisplayText(msg)
  const isSticker = (msg.mediaType === 'sticker') || getMediaTypeFromText(msg.text) === 'sticker'

  return (
    <div>
      {/* Date separator */}
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
          'flex animate-in fade-in-0 slide-in-from-bottom-2 duration-200 group relative',
          out ? 'justify-end' : 'justify-start',
          isGroupedWithPrev ? 'mt-[2px]' : 'mt-2'
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Reply button */}
        {!out && (
          <button
            onClick={onReply}
            className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 self-end mb-1 p-1.5 rounded-full hover:bg-black/5"
            title="Responder"
          >
            <Reply className="h-4 w-4 text-[#667781]" />
          </button>
        )}

        <div
          ref={setMessageRef}
          className={cn(
            'max-w-[65%] relative overflow-hidden transition-colors',
            isSticker
              ? 'bg-transparent shadow-none p-0'
              : cn(
                  'shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]',
                  media ? 'p-[3px]' : 'px-[9px] pt-[6px] pb-[7px]',
                  bubbleRadius(pos, out),
                  highlightedMessageId === msg.id
                    ? 'ring-2 ring-[#f59e0b] bg-[#fef3c7]'
                    : out
                      ? 'bg-[#d9fdd3] dark:bg-emerald-900/60'
                      : 'bg-white dark:bg-zinc-800'
                )
          )}
        >
          {/* Quoted message */}
          {msg.replyToId && msg.replyToText && (
            <div className="mb-1">
              <QuotedMessage
                text={msg.replyToText}
                senderName={msg.direction === 'INBOUND' ? contactName : 'Você'}
                outbound={out}
                onClick={() => {
                  if (msg.replyToId) {
                    onScrollToMessage(msg.replyToId)
                  }
                }}
              />
            </div>
          )}

          {/* Text content */}
          {(!media || displayText) && (
            <div className={cn(media && 'px-[6px] pb-[4px] pt-[2px]')}>
              <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100 whitespace-pre-wrap break-words">
                {media ? (displayText || '') : msg.text}
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
              msg.status === 'READ'
                ? <CheckCheck className="h-[16px] w-[16px] text-[#53bdeb]" />
                : msg.status === 'DELIVERED'
                  ? <CheckCheck className="h-[16px] w-[16px] text-[#8696a0]" />
                  : <Check className="h-[16px] w-[16px] text-[#8696a0]" />
            )}
          </span>
        </div>

        {/* Reaction bar */}
        {showReactionBar && (
          <div className={cn(
            'absolute -top-12 z-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-150',
            out ? 'right-0' : 'left-0'
          )}>
            <ReactionBar onReact={onReact} />
          </div>
        )}

        {/* Reaction chips */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className={cn(
            'absolute -bottom-5',
            out ? 'right-0' : 'left-0'
          )}>
            <ReactionChips
              reactions={msg.reactions}
              onToggle={onReact}
            />
          </div>
        )}
      </div>
    </div>
  )
})
