'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { VirtuosoHandle } from 'react-virtuoso'
import { toast } from 'sonner'
import { usePusher } from '@/hooks/use-pusher'
import type { ChatTypingEvent, MessageNewEvent, MessageStatusEvent } from '@/hooks/use-pusher'
import type { MessageItem, WhatsAppMessage } from './types'
import { getBubblePos, needsDateSep } from './utils'

interface UseChatMessagesArgs {
  contactId: string
  contactPhone: string | null
  organizationId: string
}

/**
 * Message list state: fetch + 5s polling, Pusher real-time events
 * (typing / new message / status), Virtuoso scroll position and the
 * unread-while-scrolled-up counter.
 */
export function useChatMessages({ contactId, contactPhone, organizationId }: UseChatMessagesArgs) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  const [newMsgCount, setNewMsgCount] = useState(0)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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
      const r = await fetch(`/api/contact/${contactId}/interactions?type=WHATSAPP`)
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
  }, [contactId, scrollToBottom])

  // Pusher: real-time typing indicator + message/status updates
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
      if (data.contactId === contactId) {
        fetchMsgs()
      }
    }, [contactId, fetchMsgs]),
    onMessageStatus: useCallback((data: MessageStatusEvent) => {
      setMessages(prev => prev.map(m =>
        m.messageId === data.messageId ? { ...m, status: data.status } : m
      ))
    }, []),
  })

  useEffect(() => { fetchMsgs(true) }, [contactId, fetchMsgs])

  // Polling: rebusca mensagens a cada 5s (simples, confiável, self-healing)
  useEffect(() => {
    const i = setInterval(() => fetchMsgs(), 5000)
    return () => clearInterval(i)
  }, [fetchMsgs])

  // Marcar mensagens como lidas quando a conversa é aberta
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch('/api/whatsapp/messages/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId }),
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    }
    markAsRead()
  }, [contactId])

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

  const handleAtBottomChange = useCallback((bottom: boolean) => {
    setAtBottom(bottom)
    if (bottom) setNewMsgCount(0)
  }, [])

  return {
    messages, setMessages, messageItems, loading, fetchMsgs,
    isTyping, highlightedMessageId,
    virtuosoRef, atBottom, newMsgCount, handleAtBottomChange,
    scrollToBottom, scrollToMessage,
  }
}
