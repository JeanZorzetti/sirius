/**
 * SSE Broker — in-process pub/sub for real-time events.
 *
 * The webhook handler calls `sseEmitter.emit(orgId, event, data)`.
 * The /api/whatsapp/stream endpoint subscribes per org and streams
 * events to the browser via Server-Sent Events.
 *
 * Works on any Node.js long-lived process (VPS/EasyPanel).
 * No external dependencies, no Pusher, no Redis needed.
 */

import { EventEmitter } from 'events'

// One global emitter — persists for the lifetime of the Node process
const emitter = new EventEmitter()
emitter.setMaxListeners(500) // allow many concurrent SSE clients

export type SSEEventName =
  | 'message:new'
  | 'message:sent'
  | 'message:status'
  | 'connection:ready'
  | 'chat:typing'

export interface SSEPayload {
  event: SSEEventName
  data: Record<string, unknown>
}

/** Publish an event to all SSE clients of an organization */
export function ssePublish(
  organizationId: string,
  event: SSEEventName,
  data: Record<string, unknown>
) {
  emitter.emit(organizationId, { event, data } satisfies SSEPayload)
}

/** Subscribe to events for an organization. Returns unsubscribe fn. */
export function sseSubscribe(
  organizationId: string,
  handler: (payload: SSEPayload) => void
): () => void {
  emitter.on(organizationId, handler)
  return () => emitter.off(organizationId, handler)
}
