import Pusher from 'pusher'

let _pusher: Pusher | null = null

export function getPusher(): Pusher {
  if (!_pusher) {
    _pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  }
  return _pusher
}

/** Channel name for a given organization */
export function orgChannel(organizationId: string) {
  return `private-org-${organizationId}`
}

/** Trigger a Pusher event, swallowing errors to avoid breaking the caller */
export async function triggerEvent(
  organizationId: string,
  event: string,
  data: Record<string, unknown>
) {
  try {
    await getPusher().trigger(orgChannel(organizationId), event, data)
  } catch (error) {
    console.error('[PUSHER] Failed to trigger event:', event, error)
  }
}
