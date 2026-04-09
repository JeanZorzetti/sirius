/**
 * Task real-time events via Pusher
 *
 * Channel: private-org-{organizationId}
 * Events:
 * - task:created
 * - task:updated
 * - task:deleted
 * - task:moved
 * - task:commented
 * - task:timer
 */

import { triggerEvent } from '@/lib/pusher'

export type TaskPusherEvent =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'task:moved'
  | 'task:commented'
  | 'task:timer'

export async function triggerTaskEvent(
  organizationId: string,
  event: TaskPusherEvent,
  data: Record<string, unknown>
): Promise<void> {
  await triggerEvent(organizationId, event, data)
}
