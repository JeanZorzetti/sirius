import { NextResponse } from 'next/server'
import { triggerEvent } from '@/lib/pusher'

export async function GET() {
  const config = {
    appId: process.env.PUSHER_APP_ID || 'NOT SET',
    key: process.env.PUSHER_KEY ? 'SET' : 'NOT SET',
    secret: process.env.PUSHER_SECRET ? 'SET' : 'NOT SET',
    host: process.env.PUSHER_HOST || 'NOT SET',
    cluster: process.env.PUSHER_CLUSTER || 'NOT SET',
  }

  try {
    await triggerEvent('test-org', 'test:ping', { ts: Date.now() })
    return NextResponse.json({ status: 'ok', config })
  } catch (error: any) {
    return NextResponse.json({ status: 'error', error: error.message, config }, { status: 500 })
  }
}
