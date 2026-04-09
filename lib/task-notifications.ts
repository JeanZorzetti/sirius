import { createNotification } from '@/lib/notifications'

/**
 * Notifica que uma tarefa foi atribuída a um usuário
 */
export async function notifyTaskAssigned({
  taskId,
  taskTitle,
  assigneeId,
  assignerName,
  organizationId,
  projectId,
}: {
  taskId: string
  taskTitle: string
  assigneeId: string
  assignerName: string
  organizationId: string
  projectId: string
}) {
  return createNotification({
    userId: assigneeId,
    organizationId,
    type: 'TASK_ASSIGNED',
    title: 'Tarefa atribuída a você',
    message: `${assignerName} atribuiu a tarefa "${taskTitle}" a você`,
    actionUrl: `/dashboard/tasks/task/${taskId}`,
    metadata: { taskId, assignerName, projectId },
  })
}

/**
 * Notifica que uma tarefa está próxima do vencimento
 */
export async function notifyTaskDueSoon({
  taskId,
  taskTitle,
  assigneeId,
  organizationId,
  dueDate,
}: {
  taskId: string
  taskTitle: string
  assigneeId: string
  organizationId: string
  dueDate: Date
}) {
  return createNotification({
    userId: assigneeId,
    organizationId,
    type: 'TASK_DUE_SOON',
    title: 'Tarefa com prazo próximo',
    message: `A tarefa "${taskTitle}" vence em ${dueDate.toLocaleDateString('pt-BR')}`,
    actionUrl: `/dashboard/tasks/task/${taskId}`,
    metadata: { taskId, dueDate: dueDate.toISOString() },
  })
}

/**
 * Notifica que uma tarefa está atrasada
 */
export async function notifyTaskOverdue({
  taskId,
  taskTitle,
  assigneeId,
  organizationId,
}: {
  taskId: string
  taskTitle: string
  assigneeId: string
  organizationId: string
}) {
  return createNotification({
    userId: assigneeId,
    organizationId,
    type: 'TASK_OVERDUE',
    title: 'Tarefa atrasada',
    message: `A tarefa "${taskTitle}" está atrasada`,
    actionUrl: `/dashboard/tasks/task/${taskId}`,
    metadata: { taskId },
  })
}

/**
 * Notifica que uma tarefa foi concluída
 */
export async function notifyTaskCompleted({
  taskId,
  taskTitle,
  userId,
  completedByName,
  organizationId,
}: {
  taskId: string
  taskTitle: string
  userId: string
  completedByName: string
  organizationId: string
}) {
  return createNotification({
    userId,
    organizationId,
    type: 'TASK_COMPLETED',
    title: 'Tarefa concluída',
    message: `${completedByName} concluiu a tarefa "${taskTitle}"`,
    actionUrl: `/dashboard/tasks/task/${taskId}`,
    metadata: { taskId, completedByName },
  })
}

/**
 * Notifica que uma tarefa recebeu um comentário
 */
export async function notifyTaskCommented({
  taskId,
  taskTitle,
  commenterName,
  assigneeId,
  organizationId,
}: {
  taskId: string
  taskTitle: string
  commenterName: string
  assigneeId: string
  organizationId: string
}) {
  return createNotification({
    userId: assigneeId,
    organizationId,
    type: 'TASK_COMMENTED',
    title: 'Novo comentário em tarefa',
    message: `${commenterName} comentou na tarefa "${taskTitle}"`,
    actionUrl: `/dashboard/tasks/task/${taskId}`,
    metadata: { taskId, commenterName },
  })
}
