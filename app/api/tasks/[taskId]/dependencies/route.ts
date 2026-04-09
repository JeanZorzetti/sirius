import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { requireFeature } from '@/lib/feature-gates'
import logger from '@/lib/logger'

// GET /api/tasks/[taskId]/dependencies
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
      select: { id: true },
    })
    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [from, to] = await Promise.all([
      prisma.taskDependency.findMany({
        where: { fromTaskId: taskId },
        include: {
          toTask: {
            select: {
              id: true,
              title: true,
              priority: true,
              status: { select: { id: true, name: true, color: true } },
              completedAt: true,
            },
          },
        },
      }),
      prisma.taskDependency.findMany({
        where: { toTaskId: taskId },
        include: {
          fromTask: {
            select: {
              id: true,
              title: true,
              priority: true,
              status: { select: { id: true, name: true, color: true } },
              completedAt: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({ outgoing: from, incoming: to })
  } catch (err) {
    logger.error({ err }, 'GET dependencies error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/tasks/[taskId]/dependencies
// Body: { toTaskId, type }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      await requireFeature(user.organizationId, 'taskDependencies')
    } catch {
      return NextResponse.json(
        { error: 'Dependências de tarefas requerem o plano PRO ou superior.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { toTaskId, type = 'BLOCKS' } = body

    if (!toTaskId || toTaskId === taskId) {
      return NextResponse.json({ error: 'Invalid target task' }, { status: 400 })
    }

    // Verify both tasks belong to same organization
    const [fromTask, toTask] = await Promise.all([
      prisma.task.findFirst({
        where: { id: taskId, organizationId: user.organizationId },
        select: { id: true },
      }),
      prisma.task.findFirst({
        where: { id: toTaskId, organizationId: user.organizationId },
        select: { id: true },
      }),
    ])

    if (!fromTask || !toTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const dep = await prisma.taskDependency.create({
      data: {
        fromTaskId: taskId,
        toTaskId,
        type,
      },
      include: {
        toTask: {
          select: {
            id: true,
            title: true,
            priority: true,
            status: { select: { id: true, name: true, color: true } },
            completedAt: true,
          },
        },
      },
    })

    return NextResponse.json(dep, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Esta dependência já existe' },
        { status: 409 }
      )
    }
    logger.error({ err }, 'POST dependencies error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
