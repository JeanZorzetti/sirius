import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { projetoDoPedido } from '@/lib/visibilidade'
import { checkTaskStatusLimit } from '@/lib/entitlements'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// GET /api/task-projects/[projectId]/statuses
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const pedido = await projetoDoPedido((await params).projectId)
    if (pedido instanceof Response) return pedido
    const { projectId } = pedido

    const statuses = await prisma.taskStatus.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { tasks: true } } },
    })

    return NextResponse.json(statuses)
  } catch (error) {
    logger.error({ err: error }, 'Error listing statuses')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// POST /api/task-projects/[projectId]/statuses
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const pedido = await projetoDoPedido((await params).projectId)
    if (pedido instanceof Response) return pedido
    const { projectId } = pedido

    // Verificar limite
    try {
      await checkTaskStatusLimit(projectId)
    } catch (err: any) {
      if (err.name === 'LimitReachedError') {
        return NextResponse.json(
          { error: 'Limite de statuses atingido. Faça upgrade do plano.' },
          { status: 403 }
        )
      }
      throw err
    }

    const body = await request.json()
    const { name, color, type } = body

    if (!name || !color) {
      return NextResponse.json({ error: 'Nome e cor são obrigatórios' }, { status: 400 })
    }

    // Obter o maior order existente
    const maxOrder = await prisma.taskStatus.aggregate({
      where: { projectId },
      _max: { order: true },
    })

    const status = await prisma.taskStatus.create({
      data: {
        name: name.trim(),
        color,
        type: type || 'OPEN',
        order: (maxOrder._max.order ?? -1) + 1,
        projectId,
      },
    })

    return NextResponse.json(status, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error creating status')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// PATCH /api/task-projects/[projectId]/statuses - Reordenar
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const pedido = await projetoDoPedido((await params).projectId)
    if (pedido instanceof Response) return pedido
    const { projectId, acesso } = pedido

    const body = await request.json()
    const { orderedIds } = body as { orderedIds: string[] }

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds é obrigatório' }, { status: 400 })
    }

    // Every status in the list must be a column of this project, or nothing is reordered
    const ids = [...new Set(orderedIds)]
    const doProjeto = await prisma.taskStatus.count({
      where: { id: { in: ids }, projectId, project: { organizationId: acesso.organizationId } },
    })
    if (doProjeto !== ids.length) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    // Atualizar order em batch
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.taskStatus.updateMany({
          where: { id, projectId, project: { organizationId: acesso.organizationId } },
          data: { order: index },
        })
      )
    )

    const statuses = await prisma.taskStatus.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(statuses)
  } catch (error) {
    logger.error({ err: error }, 'Error reordering statuses')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
