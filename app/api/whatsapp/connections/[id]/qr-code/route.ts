/**
 * GET /api/whatsapp/connections/[id]/qr-code
 *
 * SSE proxy — connects to the gateway's QR stream on behalf of the browser.
 * This avoids CORS issues and keeps the API key server-side.
 *
 * The browser opens an EventSource to this URL and receives the same
 * qr / connected / timeout events the gateway emits.
 */

import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || ''
const GATEWAY_API_KEY = process.env.WHATSAPP_GATEWAY_API_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  const connection = await prismaWa.whatsAppConnection.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!connection) {
    return new Response('Connection not found', { status: 404 })
  }

  const gatewayStreamUrl = `${GATEWAY_URL}/api/instances/${connection.instanceName}/qr`

  logger.info({ connectionId: id, instanceName: connection.instanceName }, 'QR SSE proxy starting')

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let closed = false

      const close = () => {
        if (closed) return
        closed = true
        try { controller.close() } catch { /* already closed */ }
      }

      request.signal.addEventListener('abort', close)

      try {
        const upstreamRes = await fetch(gatewayStreamUrl, {
          headers: {
            'X-API-Key': GATEWAY_API_KEY,
            Accept: 'text/event-stream',
          },
          signal: request.signal,
        })

        if (!upstreamRes.ok) {
          const body = await upstreamRes.text()
          logger.warn({ status: upstreamRes.status, body }, 'Gateway QR stream error')
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: `Gateway ${upstreamRes.status}: ${body}` })}\n\n`))
          close()
          return
        }

        if (!upstreamRes.body) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'No response body from gateway' })}\n\n`))
          close()
          return
        }

        const reader = upstreamRes.body.getReader()
        const decoder = new TextDecoder()

        while (!closed) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          logger.error({ error: err.message }, 'QR SSE proxy error')
          try {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`))
          } catch { /* controller closed */ }
        }
      } finally {
        close()
      }
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
