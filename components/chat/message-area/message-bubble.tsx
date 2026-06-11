'use client'

import { Check, CheckCheck, Copy, Forward as ForwardIcon, Loader2, Reply, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuotedMessage } from '../quoted-message'
import { ReactionBar } from '../reaction-bar'
import { ReactionChips } from '../reaction-chips'
import { LinkPreviewCard, extractFirstUrl } from '../link-preview-card'
import type { ContextMenuItem } from '../context-menu'
import type { MessageItem, WhatsAppMessage } from './types'
import { bubbleRadius, fmtDate, fmtTime, getDisplayText, hasMedia, parseInteractiveReply } from './utils'
import { MediaBubble } from './media-bubble'

export interface MessageBubbleProps {
  item: MessageItem
  contactName: string
  highlighted: boolean
  reactionBarVisible: boolean
  onHoverChange: (msgId: string | null) => void
  onContextMenu: (msg: WhatsAppMessage, x: number, y: number) => void
  onReply: (msg: WhatsAppMessage) => void
  onForward: (msg: WhatsAppMessage) => void
  onReact: (messageId: string, emoji: string) => void
  onScrollToMessage: (messageId: string) => void
  onOpenLightbox: (src: string, type: 'image' | 'video') => void
}

export function MessageBubble({
  item: { msg, showDate, pos },
  contactName,
  highlighted,
  reactionBarVisible,
  onHoverChange,
  onContextMenu,
  onReply,
  onForward,
  onReact,
  onScrollToMessage,
  onOpenLightbox,
}: MessageBubbleProps) {
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
        onMouseEnter={() => onHoverChange(msg.id)}
        onMouseLeave={() => onHoverChange(null)}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(msg, e.clientX, e.clientY)
        }}
      >
        {/* Action buttons (shows on hover) */}
        {!out && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 self-end mb-1 flex items-center gap-0.5">
            <button
              onClick={() => onReply(msg)}
              className="p-1.5 rounded-full hover:bg-black/5"
              title="Responder"
            >
              <Reply className="h-4 w-4 text-[#667781]" />
            </button>
            <button
              onClick={() => onForward(msg)}
              className="p-1.5 rounded-full hover:bg-black/5"
              title="Encaminhar"
            >
              <ForwardIcon className="h-4 w-4 text-[#667781]" />
            </button>
          </div>
        )}

        <div
          role="article"
          aria-label={`Mensagem ${out ? 'enviada' : 'recebida'} às ${fmtTime(msg.sentAt)}`}
          className={cn(
            'max-w-[65%] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] relative overflow-hidden transition-colors',
            media ? 'p-[3px]' : 'px-[9px] pt-[6px] pb-[7px]',
            bubbleRadius(pos, out),
            highlighted
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

          {/* Media content */}
          {media && (
            <div className="mb-0.5">
              <MediaBubble msg={msg} outbound={out} onOpenLightbox={onOpenLightbox} />
            </div>
          )}

          {/* Link preview (Open Graph) — only for text-only messages with a URL */}
          {!media && (() => {
            const url = extractFirstUrl(msg.text)
            return url ? (
              <div className="mt-0.5 mb-1">
                <LinkPreviewCard url={url} outbound={out} />
              </div>
            ) : null
          })()}

          {/* Text content */}
          {(!media || displayText) && (() => {
            const rawText = media ? (displayText || '') : msg.text
            const reply = parseInteractiveReply(rawText)
            return (
              <div className={cn(media && 'px-[6px] pb-[4px] pt-[2px]')}>
                {reply && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded mb-1 bg-[#00a884]/15 text-[#00a884] text-[10px] font-mono font-medium">
                    <span className="opacity-70">↩</span> {reply.btnId}
                  </div>
                )}
                <p className="text-[14.2px] leading-[1.46] text-[#111b21] dark:text-zinc-100 whitespace-pre-wrap break-words">
                  {reply ? reply.label : rawText}
                  {/* Invisible spacer for timestamp */}
                  <span className="inline-block w-[70px]" />
                </p>
              </div>
            )
          })()}

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

        {/* Forward button for outbound messages */}
        {out && (
          <button
            onClick={() => onForward(msg)}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 self-end mb-1 p-1.5 rounded-full hover:bg-black/5"
            title="Encaminhar"
          >
            <ForwardIcon className="h-4 w-4 text-[#667781]" />
          </button>
        )}

        {/* Reaction bar (shows on hover) */}
        {reactionBarVisible && (
          <div className={cn(
            'absolute -top-12 z-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-150',
            out ? 'right-0' : 'left-0'
          )}>
            <ReactionBar
              onReact={(emoji) => onReact(msg.id, emoji)}
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
              onToggle={(emoji) => onReact(msg.id, emoji)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function buildMessageMenuItems(
  msg: WhatsAppMessage,
  handlers: {
    onReply: () => void
    onForward: () => void
    onCopy: () => void
    onScrollToOriginal: (() => void) | null
  }
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [
    { id: 'reply', label: 'Responder', icon: Reply, onSelect: handlers.onReply },
    { id: 'forward', label: 'Encaminhar', icon: ForwardIcon, onSelect: handlers.onForward },
    { id: 'copy', label: 'Copiar texto', icon: Copy, onSelect: handlers.onCopy },
  ]
  if (handlers.onScrollToOriginal) {
    items.push({ id: 'sep1', label: '', onSelect: () => {}, separator: true })
    items.push({
      id: 'scroll-original',
      label: 'Ir para mensagem original',
      icon: Star,
      onSelect: handlers.onScrollToOriginal,
    })
  }
  return items
}
