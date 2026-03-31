/**
 * GET /api/whatsapp/connections/whatsmeow/[id]/qr
 * Proxy SSE para o QR stream do gateway (resolve CORS + auth)
 */

import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || ''
const GATEWAY_API_KEY = process.env.WHATSAPP_GATEWAY_API_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params

  const gatewayRes = await fetch(`${GATEWAY_URL}/api/instances/${id}/qr`, {
    headers: { 'X-API-Key': GATEWAY_API_KEY },
  })

  if (!gatewayRes.ok || !gatewayRes.body) {
    return new Response('Gateway error', { status: gatewayRes.status })
  }

  return new Response(gatewayRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
