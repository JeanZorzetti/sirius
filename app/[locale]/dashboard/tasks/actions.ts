'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkTaskProjectLimit, checkTaskLimit } from '@/lib/feature-gates'
import { notifyTaskAssigned } from '@/lib/task-notifications'
import { triggerTaskEvent } from '@/lib/tasks/realtime'
import { executeTaskAutomations } from '@/lib/automations/task-engine'
import logger from '@/lib/logger'
import type { TaskPriority } from '@prisma/client'
import { ERR } from '@/lib/error-messages'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error(ERR.UNAUTHORIZED)
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, organizationId: true, orgRole: true },
  })
  if (!user?.organizationId) {
    throw new Error('Organização não encontrada')
  }
  return user
}

// -----------------------------------------------------------------------------
// Task Projects
// -----------------------------------------------------------------------------

export async function createTaskProjectAction(input: {
  name: string
  description?: string
  color?: string
  icon?: string
}) {
  const user = await getCurrentUser()

  try {
    await checkTaskProjectLimit(user.organizationId)
  } catch {
    return { ok: false, error: 'Limite de projetos atingido. Faça upgrade do plano.' }
  }

  const maxOrder = await prisma.taskProject.aggregate({
    where: { organizationId: user.organizationId },
    _max: { order: true },
  })

  const project = await prisma.taskProject.create({
    data: {
      name: input.name.trim(),
      description: input.description || null,
      color: input.color || '#6366f1',
      icon: input.icon || null,
      order: (maxOrder._max.order ?? -1) + 1,
      organizationId: user.organizationId,
      statuses: {
        create: [
          { name: 'A Fazer', color: '#94a3b8', type: 'OPEN', order: 0, isDefault: true },
          { name: 'Em Progresso', color: '#3b82f6', type: 'IN_PROGRESS', order: 1 },
          { name: 'Concluído', color: '#22c55e', type: 'DONE', order: 2 },
        ],
      },
    },
    include: { statuses: true },
  })

  revalidatePath('/dashboard/tasks')
  return { ok: true, project }
}

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

export async function createTaskAction(input: {
  projectId: string
  statusId?: string
  title: string
  description?: string
  priority?: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
  dealId?: string | null
  contactId?: string | null
  parentId?: string | null
  labelIds?: string[]
}) {
  const user = await getCurrentUser()

  try {
    await checkTaskLimit(user.organizationId)
  } catch {
    return { ok: false, error: 'Limite de tarefas atingido. Faça upgrade do plano.' }
  }

  const project = await prisma.taskProject.findFirst({
    where: { id: input.projectId, organizationId: user.organizationId },
    include: { statuses: { orderBy: { order: 'asc' } } },
  })

  if (!project) {
    return { ok: false, error: 'Projeto não encontrado' }
  }

  const statusId = input.statusId || project.statuses[0]?.id
  if (!statusId) {
    return { ok: false, error: 'Projeto sem status configurado' }
  }

  const maxOrder = await prisma.task.aggregate({
    where: { projectId: input.projectId, statusId },
    _max: { order: true },
  })

  const task = await prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description || null,
      priority: input.priority || 'MEDIUM',
      order: (maxOrder._max.order ?? -1) + 1,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      projectId: input.projectId,
      statusId,
      assigneeId: input.assigneeId || null,
      creatorId: user.id,
      parentId: input.parentId || null,
      dealId: input.dealId || null,
      contactId: input.contactId || null,
      organizationId: user.organizationId,
      ...(input.labelIds && input.labelIds.length > 0 && {
        labels: { connect: input.labelIds.map((id) => ({ id })) },
      }),
    },
    include: {
      status: true,
      assignee: { select: { id: true, name: true, email: true } },
    },
  })

  await prisma.taskActivity.create({
    data: {
      type: 'CREATED',
      description: 'Criou a tarefa',
      taskId: task.id,
      userId: user.id,
    },
  })

  // Notifications
  if (task.assigneeId && task.assigneeId !== user.id) {
    notifyTaskAssigned({
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: task.assigneeId,
      assignerName: user.name || 'Alguém',
      organizationId: user.organizationId,
      projectId: task.projectId,
    }).catch((err) => logger.error({ err }, 'Error notifying task assigned'))
  }

  // Real-time
  triggerTaskEvent(user.organizationId, 'task:created', {
    taskId: task.id,
    projectId: task.projectId,
    title: task.title,
  }).catch(() => {})

  // Automations
  executeTaskAutomations(task.id, 'TASK_CREATED', {
    userId: user.id,
    organizationId: user.organizationId,
  }).catch((err) => logger.error({ err }, 'Task automation failed'))

  revalidatePath(`/dashboard/tasks/${input.projectId}`)
  return { ok: true, task }
}

export async function moveTaskAction(input: {
  taskId: string
  statusId: string
  order: number
}) {
  const user = await getCurrentUser()

  const existing = await prisma.task.findFirst({
    where: { id: input.taskId, organizationId: user.organizationId },
    select: { id: true, projectId: true, statusId: true },
  })

  if (!existing) {
    return { ok: false, error: 'Tarefa não encontrada' }
  }

  const updated = await prisma.task.update({
    where: { id: input.taskId },
    data: { statusId: input.statusId, order: input.order },
    include: { status: true },
  })

  if (updated.status.type === 'DONE' && existing.statusId !== input.statusId) {
    await prisma.task.update({
      where: { id: input.taskId },
      data: { completedAt: new Date() },
    })
    executeTaskAutomations(input.taskId, 'TASK_COMPLETED', {
      userId: user.id,
      organizationId: user.organizationId,
    }).catch((err) => logger.error({ err }, 'Task completed automation failed'))
  }

  triggerTaskEvent(user.organizationId, 'task:moved', {
    taskId: input.taskId,
    projectId: existing.projectId,
    statusId: input.statusId,
  }).catch(() => {})

  revalidatePath(`/dashboard/tasks/${existing.projectId}`)
  return { ok: true }
}

export async function deleteTaskAction(taskId: string) {
  const user = await getCurrentUser()

  const existing = await prisma.task.findFirst({
    where: { id: taskId, organizationId: user.organizationId },
    select: { id: true, projectId: true },
  })

  if (!existing) {
    return { ok: false, error: 'Tarefa não encontrada' }
  }

  await prisma.task.delete({ where: { id: taskId } })

  triggerTaskEvent(user.organizationId, 'task:deleted', {
    taskId,
    projectId: existing.projectId,
  }).catch(() => {})

  revalidatePath(`/dashboard/tasks/${existing.projectId}`)
  return { ok: true }
}

export async function archiveTaskAction(taskId: string, archived: boolean) {
  const user = await getCurrentUser()

  const existing = await prisma.task.findFirst({
    where: { id: taskId, organizationId: user.organizationId },
    select: { id: true, projectId: true },
  })

  if (!existing) {
    return { ok: false, error: 'Tarefa não encontrada' }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { archived },
  })

  revalidatePath(`/dashboard/tasks/${existing.projectId}`)
  return { ok: true }
}
