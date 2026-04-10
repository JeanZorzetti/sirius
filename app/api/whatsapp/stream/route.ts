/**
 * GET /api/whatsapp/stream
 *
 * Server-Sent Events endpoint. Browser connects once and receives
 * real-time WhatsApp events (new messages, status updates, etc.)
 * without polling or external services.
 *
 * The connection stays open until the client disconnects.
 */

import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sseSubscribe, type SSEPayload } from '@/lib/sse'

export const dynamic = 'force-dynamic'
// Disable response buffering so events are flushed immediately
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return new Response('Organization not found', { status: 404 })
  }

  const { organizationId } = user

  const stream = new ReadableStream({
    start(controller) {
      // Send initial ping so the browser knows the connection is alive
      const ping = `event: ping\ndata: {}\n\n`
      controller.enqueue(new TextEncoder().encode(ping))

      const handler = (payload: SSEPayload) => {
        const line = `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`
        try {
          controller.enqueue(new TextEncoder().encode(line))
        } catch {
          // Controller already closed — unsubscribe will clean up
        }
      }

      const unsubscribe = sseSubscribe(organizationId, handler)

      // Keep-alive ping every 25s to prevent proxy/browser timeouts
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: keepalive\n\n`))
        } catch {
          clearInterval(keepAlive)
        }
      }, 25_000)

      // Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        unsubscribe()
        clearInterval(keepAlive)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })
}
