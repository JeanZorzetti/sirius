import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supportSSESubscribe, type SupportSSEPayload } from '@/lib/support-events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true, isRoiLabsStaff: true },
  })

  if (!user) {
    return new Response('User not found', { status: 404 })
  }

  const { organizationId, isRoiLabsStaff } = user

  const stream = new ReadableStream({
    start(controller) {
      const ping = `event: ping\ndata: {}\n\n`
      controller.enqueue(new TextEncoder().encode(ping))

      const enqueue = (payload: SupportSSEPayload) => {
        const line = `event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`
        try {
          controller.enqueue(new TextEncoder().encode(line))
        } catch { /* closed */ }
      }

      // Clients subscribe to their org channel
      const unsub1 = supportSSESubscribe(`org-${organizationId}`, enqueue)
      // Staff also subscribes to global staff channel
      const unsub2 = isRoiLabsStaff ? supportSSESubscribe('staff-tickets', enqueue) : null

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: keepalive\n\n`))
        } catch {
          clearInterval(keepAlive)
        }
      }, 25_000)

      request.signal.addEventListener('abort', () => {
        unsub1()
        unsub2?.()
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
      'X-Accel-Buffering': 'no',
    },
  })
}
