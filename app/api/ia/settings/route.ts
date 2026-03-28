import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/ia/settings
 * Load IA config for the user's organization.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { iaConfig: true }
    })

    return NextResponse.json({ config: org?.iaConfig || null })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/ia/settings
 * Save IA config for the user's organization.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'config must be an object' }, { status: 400 })
    }

    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { iaConfig: config }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
