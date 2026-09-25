import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { assinaturaMetaValida } from '@/lib/meta-assinatura'

export const runtime = 'nodejs'

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN!

// Meta webhook verification handshake
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Receive Instagram webhook events
export async function POST(request: NextRequest) {
  try {
    const corpoCru = await request.text()
    if (!assinaturaMetaValida(corpoCru, request.headers.get('x-hub-signature-256'), process.env.INSTAGRAM_APP_SECRET)) {
      logger.warn('[IG:WEBHOOK] notice refused: invalid or missing signature')
      return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 })
    }
    const body = JSON.parse(corpoCru)
    logger.info({ body }, '[IG:WEBHOOK] event received')
    // TODO: handle specific events (comments, mentions, etc.)
    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
