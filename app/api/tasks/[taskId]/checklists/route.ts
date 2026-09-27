import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { tarefaDoPedido } from '@/lib/visibilidade'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// GET /api/tasks/[taskId]/checklists
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const pedido = await tarefaDoPedido((await params).taskId)
    if (pedido instanceof Response) return pedido

    const checklists = await prisma.taskChecklist.findMany({
      where: { taskId: pedido.taskId },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(checklists)
  } catch (error) {
    logger.error({ err: error }, 'Error listing checklists')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// POST /api/tasks/[taskId]/checklists
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const pedido = await tarefaDoPedido((await params).taskId)
    if (pedido instanceof Response) return pedido
    const { taskId } = pedido

    const body = await request.json()
    const { title, items } = body

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

    const maxOrder = await prisma.taskChecklist.aggregate({
      where: { taskId },
      _max: { order: true },
    })

    const checklist = await prisma.taskChecklist.create({
      data: {
        title: title.trim(),
        order: (maxOrder._max.order ?? -1) + 1,
        taskId,
        ...(items?.length && {
          items: {
            create: items.map((item: { title: string }, index: number) => ({
              title: item.title,
              order: index,
            })),
          },
        }),
      },
      include: { items: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(checklist, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error creating checklist')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// PATCH /api/tasks/[taskId]/checklists - Toggle item ou adicionar item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const pedido = await tarefaDoPedido((await params).taskId)
    if (pedido instanceof Response) return pedido
    const { taskId, acesso } = pedido
    const organizationId = acesso.organizationId

    const body = await request.json()
    const { action, itemId, checklistId, title } = body

    // Items and checklists are only reachable through the task in the URL
    if (action === 'toggle' && itemId) {
      const item = await prisma.taskChecklistItem.findFirst({
        where: { id: itemId, checklist: { taskId, task: { organizationId } } },
      })

      if (!item) {
        return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
      }

      const updated = await prisma.taskChecklistItem.update({
        where: { id: itemId },
        data: {
          completed: !item.completed,
          completedAt: !item.completed ? new Date() : null,
        },
      })

      return NextResponse.json(updated)
    }

    if (action === 'addItem' && checklistId && title) {
      const checklist = await prisma.taskChecklist.findFirst({
        where: { id: checklistId, taskId, task: { organizationId } },
        select: { id: true },
      })
      if (!checklist) {
        return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })
      }

      const maxOrder = await prisma.taskChecklistItem.aggregate({
        where: { checklistId },
        _max: { order: true },
      })

      const item = await prisma.taskChecklistItem.create({
        data: {
          title: title.trim(),
          order: (maxOrder._max.order ?? -1) + 1,
          checklistId,
        },
      })

      return NextResponse.json(item, { status: 201 })
    }

    if (action === 'deleteItem' && itemId) {
      const apagados = await prisma.taskChecklistItem.deleteMany({
        where: { id: itemId, checklist: { taskId, task: { organizationId } } },
      })
      if (apagados.count === 0) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    if (action === 'deleteChecklist' && checklistId) {
      const apagados = await prisma.taskChecklist.deleteMany({
        where: { id: checklistId, taskId, task: { organizationId } },
      })
      if (apagados.count === 0) return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    logger.error({ err: error }, 'Error updating checklist')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
