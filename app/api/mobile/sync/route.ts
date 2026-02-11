import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// This endpoint triggers sync notification back to the client
// The actual sync is handled client-side by lib/mobile/offline.ts
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Return sync instructions
    return NextResponse.json({
      success: true,
      message: 'Sync initiated',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
