import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { z } from 'zod'

const updateAutomationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  triggerType: z
    .enum(['DEAL_CREATED', 'DEAL_MOVED', 'DEAL_WON', 'DEAL_LOST', 'DEAL_IDLE'])
    .optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  conditions: z.array(z.record(z.string(), z.unknown())).optional(),
  actions: z.array(z.record(z.string(), z.unknown())).optional()
})

async function resolveUser(session: { user?: { email?: string | null } | null } | null) {
  if (!session?.user?.email) return null
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true }
  })
}

/**
 * GET /api/automations/[id]
 * Fetch a single automation by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await resolveUser(session)
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const automation = await prisma.dealAutomation.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 20
        }
      }
    })

    if (!automation) {
      return NextResponse.json({ error: 'Automação não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ automation })
  } catch (error) {
    logger.error({ error }, 'Error fetching automation')
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * PATCH /api/automations/[id]
 * Partially update an automation.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await resolveUser(session)
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const validation = updateAutomationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Verify ownership
    const existing = await prisma.dealAutomation.findFirst({
      where: { id, organizationId: user.organizationId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Automação não encontrada' }, { status: 404 })
    }

    const data = validation.data

    const automation = await prisma.dealAutomation.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.triggerType !== undefined && { triggerType: data.triggerType as any }),
        ...(data.triggerConfig !== undefined && { triggerConfig: data.triggerConfig as any }),
        ...(data.conditions !== undefined && { conditions: data.conditions as any }),
        ...(data.actions !== undefined && { actions: data.actions as any })
      }
    })

    logger.info({ automationId: id, organizationId: user.organizationId }, 'Automation updated')

    return NextResponse.json({ automation })
  } catch (error) {
    logger.error({ error }, 'Error updating automation')
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * DELETE /api/automations/[id]
 * Delete an automation.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await resolveUser(session)
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Verify ownership
    const existing = await prisma.dealAutomation.findFirst({
      where: { id, organizationId: user.organizationId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Automação não encontrada' }, { status: 404 })
    }

    await prisma.dealAutomation.delete({ where: { id } })

    logger.info({ automationId: id, organizationId: user.organizationId }, 'Automation deleted')

    return NextResponse.json({ deleted: true })
  } catch (error) {
    logger.error({ error }, 'Error deleting automation')
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
