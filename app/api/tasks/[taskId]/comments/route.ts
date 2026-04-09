import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notifyTaskCommented } from '@/lib/task-notifications'
import { triggerTaskEvent } from '@/lib/tasks/realtime'
import logger from '@/lib/logger'

// GET /api/tasks/[taskId]/comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    logger.error({ err: error }, 'Error listing comments')
    return NextResponse.json({ error: 'Erro ao listar comentários' }, { status: 500 })
  }
}

// POST /api/tasks/[taskId]/comments
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Conteúdo é obrigatório' }, { status: 400 })
    }

    const comment = await prisma.taskComment.create({
      data: {
        content: content.trim(),
        taskId,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Activity log
    await prisma.taskActivity.create({
      data: {
        type: 'COMMENT_ADDED',
        description: `${user.name || user.id} comentou`,
        taskId,
        userId: user.id,
      },
    })

    // Notificar assignee (se não for o autor do comentário)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true, assigneeId: true, organizationId: true },
    })

    if (task?.assigneeId && task.assigneeId !== user.id) {
      notifyTaskCommented({
        taskId,
        taskTitle: task.title,
        commenterName: user.name || 'Alguém',
        assigneeId: task.assigneeId,
        organizationId: user.organizationId,
      }).catch((err) => logger.error({ err }, 'Error notifying task commented'))
    }

    triggerTaskEvent(user.organizationId, 'task:commented', {
      taskId,
      commentId: comment.id,
    }).catch(() => {})

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error creating comment')
    return NextResponse.json({ error: 'Erro ao criar comentário' }, { status: 500 })
  }
}
