'use client'

import { useEffect, useRef } from 'react'
import PusherClient from 'pusher-js'
import type { Channel } from 'pusher-js'

// --- Event shapes ---

export interface TaskCreatedEvent {
  taskId: string
  projectId: string
  statusId: string
  title: string
}

export interface TaskUpdatedEvent {
  taskId: string
  projectId: string
  statusId: string
}

export interface TaskDeletedEvent {
  taskId: string
  projectId: string
}

export interface TaskMovedEvent {
  taskId: string
  projectId: string
  statusId: string
}

export interface TaskCommentedEvent {
  taskId: string
  commentId: string
}

export interface TaskTimerEvent {
  taskId: string
  userId: string
  action: 'start' | 'stop'
}

// --- Singleton client reuse ---

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
    ...(host
      ? {
          wsHost: host,
          wsPort: 443,
          wssPort: 443,
          forceTLS: true,
          disableStats: true,
          enabledTransports: ['ws', 'wss'] as ('ws' | 'wss')[],
        }
      : {}),
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

export interface UseTaskPusherOptions {
  organizationId: string
  enabled?: boolean
  onTaskCreated?: (data: TaskCreatedEvent) => void
  onTaskUpdated?: (data: TaskUpdatedEvent) => void
  onTaskDeleted?: (data: TaskDeletedEvent) => void
  onTaskMoved?: (data: TaskMovedEvent) => void
  onTaskCommented?: (data: TaskCommentedEvent) => void
  onTaskTimer?: (data: TaskTimerEvent) => void
}

export function useTaskPusher({
  organizationId,
  enabled = true,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskMoved,
  onTaskCommented,
  onTaskTimer,
}: UseTaskPusherOptions) {
  const createdRef = useRef(onTaskCreated)
  const updatedRef = useRef(onTaskUpdated)
  const deletedRef = useRef(onTaskDeleted)
  const movedRef = useRef(onTaskMoved)
  const commentedRef = useRef(onTaskCommented)
  const timerRef = useRef(onTaskTimer)

  createdRef.current = onTaskCreated
  updatedRef.current = onTaskUpdated
  deletedRef.current = onTaskDeleted
  movedRef.current = onTaskMoved
  commentedRef.current = onTaskCommented
  timerRef.current = onTaskTimer

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!enabled || !key || !organizationId) return

    const entry = getOrCreateClient(organizationId)
    const { channel } = entry

    const h1 = (d: TaskCreatedEvent) => createdRef.current?.(d)
    const h2 = (d: TaskUpdatedEvent) => updatedRef.current?.(d)
    const h3 = (d: TaskDeletedEvent) => deletedRef.current?.(d)
    const h4 = (d: TaskMovedEvent) => movedRef.current?.(d)
    const h5 = (d: TaskCommentedEvent) => commentedRef.current?.(d)
    const h6 = (d: TaskTimerEvent) => timerRef.current?.(d)

    channel.bind('task:created', h1)
    channel.bind('task:updated', h2)
    channel.bind('task:deleted', h3)
    channel.bind('task:moved', h4)
    channel.bind('task:commented', h5)
    channel.bind('task:timer', h6)

    return () => {
      channel.unbind('task:created', h1)
      channel.unbind('task:updated', h2)
      channel.unbind('task:deleted', h3)
      channel.unbind('task:moved', h4)
      channel.unbind('task:commented', h5)
      channel.unbind('task:timer', h6)
      releaseClient(organizationId)
    }
  }, [organizationId, enabled])
}
