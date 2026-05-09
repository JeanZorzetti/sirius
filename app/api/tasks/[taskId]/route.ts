import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notifyTaskAssigned, notifyTaskCompleted } from '@/lib/task-notifications'
import { triggerTaskEvent } from '@/lib/tasks/realtime'
import { executeTaskAutomations } from '@/lib/automations/task-engine'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const taskInclude = {
  status: true,
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  labels: true,
  project: { select: { id: true, name: true, color: true } },
  checklists: {
    include: { items: { orderBy: { order: 'asc' as const } } },
    orderBy: { order: 'asc' as const },
  },
  subtasks: {
    include: {
      status: true,
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { order: 'asc' as const },
  },
  deal: { select: { id: true, title: true } },
  contact: { select: { id: true, name: true } },
  recurrence: true,
  _count: {
    select: { subtasks: true, comments: true, checklists: true, timeEntries: true },
  },
}

// GET /api/tasks/[taskId]
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, orgRole: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
      include: taskInclude,
    })

    if (!task) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    // Checar acesso por visibilidade (campo pode não existir em deploys antigos)
    const visibility = (task as any).visibility ?? 'PUBLIC'
    if (user.orgRole === 'MEMBER') {
      if (visibility === 'ADMINS_ONLY') {
        return await apiError(ERR.FORBIDDEN, 403)
      }
      if (
        visibility === 'PRIVATE' &&
        task.creatorId !== user.id &&
        task.assigneeId !== user.id
      ) {
        return await apiError(ERR.FORBIDDEN, 403)
      }
    }

    return NextResponse.json(task)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching task')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// PATCH /api/tasks/[taskId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, organizationId: true, orgRole: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    const existing = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
      include: { status: true, assignee: { select: { id: true, name: true } } },
    })

    if (!existing) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    // Checar acesso por visibilidade (campo pode não existir em deploys antigos)
    const taskVisibility = (existing as any).visibility ?? 'PUBLIC'
    if (user.orgRole === 'MEMBER') {
      if (taskVisibility === 'ADMINS_ONLY') {
        return await apiError(ERR.FORBIDDEN, 403)
      }
      if (
        taskVisibility === 'PRIVATE' &&
        existing.creatorId !== user.id &&
        existing.assigneeId !== user.id
      ) {
        return await apiError(ERR.FORBIDDEN, 403)
      }
    }

    const body = await request.json()
    const {
      title, description, priority, statusId, assigneeId,
      dueDate, startDate, estimatedMinutes, order,
      dealId, contactId, labelIds, archived, visibility,
    } = body

    // Preparar dados de update
    const data: any = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description
    if (priority !== undefined) data.priority = priority
    if (statusId !== undefined) data.statusId = statusId
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
    if (estimatedMinutes !== undefined) data.estimatedMinutes = estimatedMinutes
    if (order !== undefined) data.order = order
    if (dealId !== undefined) data.dealId = dealId || null
    if (contactId !== undefined) data.contactId = contactId || null
    if (archived !== undefined) data.archived = archived
    if (visibility !== undefined) data.visibility = visibility

    // Marcar como completado se mudou para status DONE
    if (statusId && statusId !== existing.statusId) {
      const newStatus = await prisma.taskStatus.findUnique({
        where: { id: statusId },
      })
      if (newStatus?.type === 'DONE' && !existing.completedAt) {
        data.completedAt = new Date()
      } else if (newStatus?.type !== 'DONE' && existing.completedAt) {
        data.completedAt = null
      }
    }

    // Labels: reconectar
    if (labelIds !== undefined) {
      data.labels = {
        set: labelIds.map((id: string) => ({ id })),
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: taskInclude,
    })

    // Criar activity logs para mudanças relevantes
    const activities: any[] = []

    if (statusId && statusId !== existing.statusId) {
      activities.push({
        type: 'STATUS_CHANGED',
        description: `Mudou status de "${existing.status.name}" para "${task.status.name}"`,
        metadata: { oldStatusId: existing.statusId, newStatusId: statusId },
        taskId,
        userId: user.id,
      })

      // Notificar se completou
      if (task.status.type === 'DONE' && existing.assigneeId && existing.assigneeId !== user.id) {
        notifyTaskCompleted({
          taskId,
          taskTitle: task.title,
          userId: existing.assigneeId,
          completedByName: user.name || 'Alguém',
          organizationId: user.organizationId,
        }).catch((err) => logger.error({ err }, 'Error notifying task completed'))
      }
    }

    if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
      activities.push({
        type: 'ASSIGNED',
        description: `Atribuiu a tarefa para ${task.assignee?.name || 'ninguém'}`,
        metadata: { oldAssigneeId: existing.assigneeId, newAssigneeId: assigneeId },
        taskId,
        userId: user.id,
      })

      if (assigneeId && assigneeId !== user.id) {
        notifyTaskAssigned({
          taskId,
          taskTitle: task.title,
          assigneeId,
          assignerName: user.name || 'Alguém',
          organizationId: user.organizationId,
          projectId: task.projectId,
        }).catch((err) => logger.error({ err }, 'Error notifying task assigned'))
      }
    }

    if (priority !== undefined && priority !== existing.priority) {
      activities.push({
        type: 'PRIORITY_CHANGED',
        description: `Mudou prioridade de ${existing.priority} para ${priority}`,
        metadata: { oldPriority: existing.priority, newPriority: priority },
        taskId,
        userId: user.id,
      })
    }

    if (dueDate !== undefined) {
      activities.push({
        type: 'DUE_DATE_CHANGED',
        description: dueDate
          ? `Definiu prazo para ${new Date(dueDate).toLocaleDateString('pt-BR')}`
          : 'Removeu o prazo',
        taskId,
        userId: user.id,
      })
    }

    if (activities.length > 0) {
      await prisma.taskActivity.createMany({ data: activities })
    }

    // Real-time event — distinguish move vs generic update
    const eventName: 'task:moved' | 'task:updated' =
      statusId && statusId !== existing.statusId ? 'task:moved' : 'task:updated'
    triggerTaskEvent(user.organizationId, eventName, {
      taskId: task.id,
      projectId: task.projectId,
      statusId: task.statusId,
    }).catch(() => {})

    // Task completed automation
    if (
      statusId &&
      statusId !== existing.statusId &&
      task.status.type === 'DONE'
    ) {
      executeTaskAutomations(task.id, 'TASK_COMPLETED', {
        userId: user.id,
        organizationId: user.organizationId,
      }).catch((err) => logger.error({ err }, 'Task completed automation failed'))
    }

    return NextResponse.json(task)
  } catch (error) {
    logger.error({ err: error }, 'Error updating task')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// DELETE /api/tasks/[taskId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    const existing = await prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
    })

    if (!existing) {
      return await apiError(ERR.NOT_FOUND, 404)
    }

    await prisma.task.delete({ where: { id: taskId } })

    triggerTaskEvent(user.organizationId, 'task:deleted', {
      taskId,
      projectId: existing.projectId,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Error deleting task')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
