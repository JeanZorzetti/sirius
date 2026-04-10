'use client'

/**
 * useSSE (exported as usePusher for backwards compatibility)
 *
 * Connects to /api/whatsapp/stream via EventSource and dispatches
 * real-time WhatsApp events to the chat UI.
 *
 * Replaces Pusher — zero external dependencies.
 * Auto-reconnects on disconnect with exponential backoff.
 */

import { useEffect, useRef, useState } from 'react'

// --- Event types (same shape as before) ---

export interface MessageNewEvent {
  contactId: string
  message: {
    id: string
    text: string
    direction: string
    status: string
    sentAt: string
    mediaUrl: string | null
    mediaType: string | null
  }
  contactName: string
  contactPhone: string
}

export interface MessageSentEvent {
  contactId: string
  message: {
    id: string
    text: string
    direction: string
    sentAt: string
    deliveredAt: string | null
    readAt: string | null
    status: string
    replyToId: string | null
    replyToText: string | null
  }
}

export interface MessageStatusEvent {
  messageId: string
  status: 'DELIVERED' | 'READ'
}

export interface ConnectionReadyEvent {
  connectionId: string
  instanceName: string
}

export interface ChatTypingEvent {
  remoteJid: string
  isTyping: boolean
}

// --- Hook ---

export interface UsePusherOptions {
  organizationId: string
  enabled?: boolean
  onMessageNew?: (data: MessageNewEvent) => void
  onMessageSent?: (data: MessageSentEvent) => void
  onMessageStatus?: (data: MessageStatusEvent) => void
  onConnectionReady?: (data: ConnectionReadyEvent) => void
  onChatTyping?: (data: ChatTypingEvent) => void
}

export function usePusher({
  organizationId,
  enabled = true,
  onMessageNew,
  onMessageSent,
  onMessageStatus,
  onConnectionReady,
  onChatTyping,
}: UsePusherOptions) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')

  // Stable refs so the effect never needs to re-run when callbacks change
  const onMessageNewRef = useRef(onMessageNew)
  const onMessageSentRef = useRef(onMessageSent)
  const onMessageStatusRef = useRef(onMessageStatus)
  const onConnectionReadyRef = useRef(onConnectionReady)
  const onChatTypingRef = useRef(onChatTyping)

  onMessageNewRef.current = onMessageNew
  onMessageSentRef.current = onMessageSent
  onMessageStatusRef.current = onMessageStatus
  onConnectionReadyRef.current = onConnectionReady
  onChatTypingRef.current = onChatTyping

  useEffect(() => {
    if (!enabled || !organizationId) return

    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0
    let destroyed = false

    function connect() {
      if (destroyed) return
      setConnectionStatus('connecting')

      es = new EventSource('/api/whatsapp/stream')

      es.addEventListener('ping', () => {
        attempt = 0
        setConnectionStatus('connected')
      })

      es.addEventListener('message:new', (e) => {
        try { onMessageNewRef.current?.(JSON.parse(e.data)) } catch { /* ignore */ }
      })

      es.addEventListener('message:sent', (e) => {
        try { onMessageSentRef.current?.(JSON.parse(e.data)) } catch { /* ignore */ }
      })

      es.addEventListener('message:status', (e) => {
        try { onMessageStatusRef.current?.(JSON.parse(e.data)) } catch { /* ignore */ }
      })

      es.addEventListener('connection:ready', (e) => {
        try { onConnectionReadyRef.current?.(JSON.parse(e.data)) } catch { /* ignore */ }
      })

      es.addEventListener('chat:typing', (e) => {
        try { onChatTypingRef.current?.(JSON.parse(e.data)) } catch { /* ignore */ }
      })

      es.onerror = () => {
        es?.close()
        es = null
        if (destroyed) return
        setConnectionStatus('disconnected')

        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, attempt), 30_000)
        attempt++
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      destroyed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      es?.close()
      setConnectionStatus('disconnected')
    }
  }, [organizationId, enabled])

  return { connectionStatus }
}
