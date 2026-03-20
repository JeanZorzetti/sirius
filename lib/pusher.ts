import Pusher from 'pusher'

let _pusher: Pusher | null = null

export function getPusher(): Pusher {
  if (!_pusher) {
    _pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      ...(process.env.PUSHER_HOST
        ? { host: process.env.PUSHER_HOST, port: '443', useTLS: true }
        : { cluster: process.env.PUSHER_CLUSTER!, useTLS: true }
      ),
    })
  }
  return _pusher
}

/** Channel name for a given organization */
export function orgChannel(organizationId: string) {
  return `private-org-${organizationId}`
}

/** Trigger a Pusher event, logging errors for diagnosis */
export async function triggerEvent(
  organizationId: string,
  event: string,
  data: Record<string, unknown>
) {
  const channel = orgChannel(organizationId)
  const hasConfig = !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET)

  console.log(`[PUSHER] Triggering ${event} on ${channel} (configured: ${hasConfig})`)

  if (!hasConfig) {
    console.warn('[PUSHER] Missing env vars — skipping trigger')
    return
  }

  try {
    await getPusher().trigger(channel, event, data)
    console.log(`[PUSHER] ✅ Event ${event} triggered successfully`)
  } catch (error) {
    console.error('[PUSHER] ❌ Failed to trigger event:', event, error)
  }
}
