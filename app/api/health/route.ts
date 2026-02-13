import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const blocked = await publicRateLimit(req)
  if (blocked) return blocked

  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
      latency_ms: Date.now() - start,
      version: process.env.npm_package_version ?? 'unknown',
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        db: 'disconnected',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
