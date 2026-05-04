import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { IAConfig, AgentOverride } from '@/lib/agaas-types'

/**
 * PATCH /api/ia/agent-config
 * Body: { agentId: string, override: AgentOverride | null }
 * - override null = restore defaults (removes override)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const { agentId, override } = body as { agentId: string; override: AgentOverride | null }

    if (!agentId || typeof agentId !== 'string') {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { iaConfig: true },
    })

    const current = (org?.iaConfig || {}) as IAConfig
    const overrides = { ...(current.agentOverrides || {}) }

    if (override === null) {
      delete overrides[agentId]
    } else {
      overrides[agentId] = override
    }

    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { iaConfig: { ...current, agentOverrides: overrides } as any },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
