/**
 * Support SSE events broker.
 * Extends the existing SSE infrastructure in lib/sse.ts with support-specific channels.
 *
 * Channel naming:
 *   org-{orgId}      — ticket events for a specific organization (clients subscribe)
 *   staff-tickets    — all ticket events for ROI Labs staff
 *   ticket-{id}      — events for a single ticket (both sides subscribe when open)
 */

import { EventEmitter } from 'events'
import type { TicketStatus } from '@prisma/client'

const emitter = new EventEmitter()
emitter.setMaxListeners(500)

export type SupportSSEEventName =
  | 'ticket:new'
  | 'ticket:message'
  | 'ticket:status'
  | 'ticket:assigned'
  | 'ticket:typing'

export interface SupportSSEPayload {
  event: SupportSSEEventName
  data: Record<string, unknown>
}

export function supportSSEPublish(
  channel: string,
  event: SupportSSEEventName,
  data: Record<string, unknown>
) {
  emitter.emit(channel, { event, data } satisfies SupportSSEPayload)
}

export function supportSSESubscribe(
  channel: string,
  handler: (payload: SupportSSEPayload) => void
): () => void {
  emitter.on(channel, handler)
  return () => emitter.off(channel, handler)
}

/** Publishes a ticket event to all relevant channels. */
export function publishTicketEvent(
  event: SupportSSEEventName,
  data: Record<string, unknown>,
  opts: { orgId: string; ticketId?: string }
) {
  supportSSEPublish(`org-${opts.orgId}`, event, data)
  supportSSEPublish('staff-tickets', event, data)
  if (opts.ticketId) {
    supportSSEPublish(`ticket-${opts.ticketId}`, event, data)
  }
}
