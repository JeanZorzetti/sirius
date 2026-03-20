import { NextRequest, NextResponse } from 'next/server'
import { triggerEvent } from '@/lib/pusher'

export async function GET() {
  const evolutionKey = process.env.EVOLUTION_API_KEY || 'NOT SET'
  const evolutionUrl = process.env.EVOLUTION_API_URL || 'NOT SET'

  const config = {
    pusher: {
      appId: process.env.PUSHER_APP_ID || 'NOT SET',
      key: process.env.PUSHER_KEY ? 'SET' : 'NOT SET',
      secret: process.env.PUSHER_SECRET ? 'SET' : 'NOT SET',
      host: process.env.PUSHER_HOST || 'NOT SET',
      cluster: process.env.PUSHER_CLUSTER || 'NOT SET',
    },
    evolution: {
      url: evolutionUrl,
      key: evolutionKey.substring(0, 4) + '...' + evolutionKey.substring(evolutionKey.length - 4),
      keyLength: evolutionKey.length,
    },
  }

  try {
    await triggerEvent('test-org', 'test:ping', { ts: Date.now() })
    return NextResponse.json({ status: 'ok', config })
  } catch (error: any) {
    return NextResponse.json({ status: 'error', error: error.message, config }, { status: 500 })
  }
}

// POST: simula o que o webhook recebe — mostra se o apikey bate
export async function POST(request: NextRequest) {
  const body = await request.json()
  const expected = process.env.EVOLUTION_API_KEY || ''
  const received = body.apikey || ''

  return NextResponse.json({
    match: received === expected,
    received: received.substring(0, 4) + '...' + received.substring(received.length - 4),
    expected: expected.substring(0, 4) + '...' + expected.substring(expected.length - 4),
  })
}
