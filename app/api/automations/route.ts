import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const THIRTY_DAYS_AGO = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d
}

const createAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  enabled: z.boolean().optional().default(true),
  triggerType: z.enum(['DEAL_CREATED', 'DEAL_MOVED', 'DEAL_WON', 'DEAL_LOST', 'DEAL_IDLE']),
  triggerConfig: z.record(z.string(), z.unknown()).optional().default({}),
  conditions: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  actions: z.array(z.record(z.string(), z.unknown())).optional().default([])
})

/**
 * GET /api/automations
 * List all automations for the authenticated organization,
 * with execution count for the last 30 days.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req: request })
    }

    const automations = await prisma.dealAutomation.findMany({
      where: { organizationId: user.organizationId },
      include: {
        _count: {
          select: { executions: true }
        },
        executions: {
          where: {
            executedAt: { gte: THIRTY_DAYS_AGO() }
          },
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const result = automations.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      enabled: a.enabled,
      triggerType: a.triggerType,
      triggerConfig: a.triggerConfig,
      conditions: a.conditions,
      actions: a.actions,
      executionCount: a.executionCount,
      lastExecutedAt: a.lastExecutedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      recentExecutions: a.executions.length,
      recentSuccesses: a.executions.filter(e => e.status === 'SUCCESS').length,
      recentFailures: a.executions.filter(e => e.status === 'FAILED').length
    }))

    return NextResponse.json({ automations: result })
  } catch (error) {
    logger.error({ error }, 'Error listing automations')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

/**
 * POST /api/automations
 * Create a new automation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req: request })
    }

    const body = await request.json()
    const validation = createAutomationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    const automation = await prisma.dealAutomation.create({
      data: {
        organizationId: user.organizationId,
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        triggerType: data.triggerType as any,
        triggerConfig: data.triggerConfig as any,
        conditions: data.conditions as any,
        actions: data.actions as any
      }
    })

    logger.info({ automationId: automation.id, organizationId: user.organizationId }, 'Automation created')

    return NextResponse.json({ automation }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Error creating automation')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
