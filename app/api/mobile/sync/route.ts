import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// This endpoint triggers sync notification back to the client
// The actual sync is handled client-side by lib/mobile/offline.ts
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    // Return sync instructions
    return NextResponse.json({
      success: true,
      message: 'Sync initiated',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
