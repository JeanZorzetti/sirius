'use client'

import type { RefObject } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { ChevronDown, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { TypingIndicator } from '../typing-indicator'
import type { MessageItem, WhatsAppMessage } from './types'
import { MessageBubble } from './message-bubble'

export interface MessageListProps {
  messageItems: MessageItem[]
  loading: boolean
  isTyping: boolean
  virtuosoRef: RefObject<VirtuosoHandle | null>
  atBottom: boolean
  newMsgCount: number
  onAtBottomChange: (bottom: boolean) => void
  onScrollToBottom: () => void
  // Bubble interactions
  contactName: string
  highlightedMessageId: string | null
  reactionBarMsgId: string | null
  onHoverChange: (msgId: string | null) => void
  onContextMenu: (msg: WhatsAppMessage, x: number, y: number) => void
  onReply: (msg: WhatsAppMessage) => void
  onForward: (msg: WhatsAppMessage) => void
  onReact: (messageId: string, emoji: string) => void
  onScrollToMessage: (messageId: string) => void
  onOpenLightbox: (src: string, type: 'image' | 'video') => void
}

export function MessageList({
  messageItems, loading, isTyping, virtuosoRef,
  atBottom, newMsgCount, onAtBottomChange, onScrollToBottom,
  contactName, highlightedMessageId, reactionBarMsgId,
  onHoverChange, onContextMenu, onReply, onForward, onReact,
  onScrollToMessage, onOpenLightbox,
}: MessageListProps) {
  const t = useTranslations('components.chat')

  if (loading && messageItems.length === 0) {
    return (
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
    )
  }

  if (messageItems.length === 0) {
    return (
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
    )
  }

  return (
    <>
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
        atBottomStateChange={onAtBottomChange}
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
        itemContent={(_index, item) => (
          <MessageBubble
            item={item}
            contactName={contactName}
            highlighted={highlightedMessageId === item.msg.id}
            reactionBarVisible={reactionBarMsgId === item.msg.id}
            onHoverChange={onHoverChange}
            onContextMenu={onContextMenu}
            onReply={onReply}
            onForward={onForward}
            onReact={onReact}
            onScrollToMessage={onScrollToMessage}
            onOpenLightbox={onOpenLightbox}
          />
        )}
      />

      {/* Scroll to bottom FAB */}
      {!atBottom && messageItems.length > 0 && (
        <div className="relative">
          <button
            onClick={onScrollToBottom}
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
    </>
  )
}
