'use client'

import { useEffect, useRef, useState } from 'react'
import PusherClient from 'pusher-js'
import type { Channel } from 'pusher-js'

// --- Event types (match server-side shapes from lib/pusher.ts triggers) ---

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

// --- Singleton client management ---

interface ClientEntry {
  client: PusherClient
  channel: Channel
  refCount: number
}

const clients = new Map<string, ClientEntry>()

function getOrCreateClient(organizationId: string): ClientEntry {
  const existing = clients.get(organizationId)
  if (existing) {
    existing.refCount++
    return existing
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY!
  const host = process.env.NEXT_PUBLIC_PUSHER_HOST
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  const client = new PusherClient(key, {
    cluster: cluster || 'mt1',
    authEndpoint: '/api/pusher/auth',
    ...(host ? {
      wsHost: host,
      wsPort: 443,
      wssPort: 443,
      forceTLS: true,
      disableStats: true,
      enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
    } : {}),
  })

  const channelName = `private-org-${organizationId}`
  const channel = client.subscribe(channelName)

  const entry: ClientEntry = { client, channel, refCount: 1 }
  clients.set(organizationId, entry)
  return entry
}

function releaseClient(organizationId: string) {
  const entry = clients.get(organizationId)
  if (!entry) return

  entry.refCount--
  if (entry.refCount <= 0) {
    entry.channel.unbind_all()
    entry.client.unsubscribe(`private-org-${organizationId}`)
    entry.client.disconnect()
    clients.delete(organizationId)
  }
}

// --- Hook ---

export interface UsePusherOptions {
  organizationId: string
  enabled?: boolean
  onMessageNew?: (data: MessageNewEvent) => void
  onMessageSent?: (data: MessageSentEvent) => void
  onMessageStatus?: (data: MessageStatusEvent) => void
  onConnectionReady?: (data: ConnectionReadyEvent) => void
}

export function usePusher({
  organizationId,
  enabled = true,
  onMessageNew,
  onMessageSent,
  onMessageStatus,
  onConnectionReady,
}: UsePusherOptions) {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')

  // Store callbacks in refs so effect doesn't re-run when they change
  const onMessageNewRef = useRef(onMessageNew)
  const onMessageSentRef = useRef(onMessageSent)
  const onMessageStatusRef = useRef(onMessageStatus)
  const onConnectionReadyRef = useRef(onConnectionReady)

  onMessageNewRef.current = onMessageNew
  onMessageSentRef.current = onMessageSent
  onMessageStatusRef.current = onMessageStatus
  onConnectionReadyRef.current = onConnectionReady

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!enabled || !key) return

    const entry = getOrCreateClient(organizationId)
    const { client, channel } = entry

    // Connection state
    const onConnected = () => setConnectionStatus('connected')
    const onDisconnected = () => setConnectionStatus('disconnected')
    const onConnecting = () => setConnectionStatus('connecting')

    client.connection.bind('connected', onConnected)
    client.connection.bind('disconnected', onDisconnected)
    client.connection.bind('connecting', onConnecting)

    // Set initial state
    const state = client.connection.state
    if (state === 'connected') setConnectionStatus('connected')
    else if (state === 'connecting') setConnectionStatus('connecting')
    else setConnectionStatus('disconnected')

    // Event bindings — call through refs
    const handleMessageNew = (data: MessageNewEvent) => onMessageNewRef.current?.(data)
    const handleMessageSent = (data: MessageSentEvent) => onMessageSentRef.current?.(data)
    const handleMessageStatus = (data: MessageStatusEvent) => onMessageStatusRef.current?.(data)
    const handleConnectionReady = (data: ConnectionReadyEvent) => onConnectionReadyRef.current?.(data)

    channel.bind('message:new', handleMessageNew)
    channel.bind('message:sent', handleMessageSent)
    channel.bind('message:status', handleMessageStatus)
    channel.bind('connection:ready', handleConnectionReady)

    return () => {
      channel.unbind('message:new', handleMessageNew)
      channel.unbind('message:sent', handleMessageSent)
      channel.unbind('message:status', handleMessageStatus)
      channel.unbind('connection:ready', handleConnectionReady)

      client.connection.unbind('connected', onConnected)
      client.connection.unbind('disconnected', onDisconnected)
      client.connection.unbind('connecting', onConnecting)

      releaseClient(organizationId)
    }
  }, [organizationId, enabled])

  return { connectionStatus }
}
