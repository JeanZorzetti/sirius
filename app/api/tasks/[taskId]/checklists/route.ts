import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// GET /api/tasks/[taskId]/checklists
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const checklists = await prisma.taskChecklist.findMany({
      where: { taskId },
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
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

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
    await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    const body = await request.json()
    const { action, itemId, checklistId, title } = body

    if (action === 'toggle' && itemId) {
      const item = await prisma.taskChecklistItem.findUnique({
        where: { id: itemId },
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
      await prisma.taskChecklistItem.delete({ where: { id: itemId } })
      return NextResponse.json({ success: true })
    }

    if (action === 'deleteChecklist' && checklistId) {
      await prisma.taskChecklist.delete({ where: { id: checklistId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    logger.error({ err: error }, 'Error updating checklist')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
