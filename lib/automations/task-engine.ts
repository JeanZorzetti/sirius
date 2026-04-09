/**
 * Task Automation Engine
 *
 * Parallel to the deal automation engine, but triggered by task events:
 * - TASK_CREATED
 * - TASK_COMPLETED
 * - TASK_OVERDUE
 *
 * NOTE: The current DealAutomation schema only supports deal triggers. Until
 * a dedicated TaskAutomation model exists, this engine reads from the same
 * DealAutomation table but filters by a `triggerType` stored inside the
 * `triggerConfig` JSON field (key: `taskTriggerType`). This allows users to
 * configure task-based automations today without a schema migration.
 *
 * To create a task-triggered automation, set:
 *   triggerType: 'DEAL_CREATED' (any placeholder)
 *   triggerConfig: { taskTriggerType: 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_OVERDUE', projectId?: string }
 */

import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { evaluateConditions, type AutomationCondition } from './conditions'
import { executeActions, type AutomationAction } from './actions'

export type TaskTriggerType = 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_OVERDUE'

export async function executeTaskAutomations(
  taskId: string,
  triggerType: TaskTriggerType,
  context: Record<string, unknown>
): Promise<void> {
  try {
    const organizationId = context.organizationId as string | undefined
    if (!organizationId) {
      logger.warn({ taskId, triggerType }, 'executeTaskAutomations called without organizationId')
      return
    }

    // Load the task with its context
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
      include: {
        status: true,
        assignee: { select: { id: true, email: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    })

    if (!task) {
      logger.warn({ taskId }, 'Task not found for automation')
      return
    }

    const enrichedContext: Record<string, unknown> = {
      ...context,
      taskId,
      triggerType,
      title: task.title,
      priority: task.priority,
      projectId: task.projectId,
      statusName: task.status?.name,
      assigneeId: task.assigneeId,
      assigneeName: task.assignee?.name,
      dealId: task.dealId || undefined,
      contactId: task.contactId || undefined,
    }

    // Fetch all enabled automations for this org — filter by taskTriggerType in config
    const automations = await prisma.dealAutomation.findMany({
      where: {
        organizationId,
        enabled: true,
      },
    })

    const matching = automations.filter((a) => {
      const cfg = (a.triggerConfig as Record<string, unknown>) || {}
      if (cfg.taskTriggerType !== triggerType) return false
      // Optional: filter by projectId
      if (cfg.projectId && cfg.projectId !== task.projectId) return false
      return true
    })

    if (matching.length === 0) return

    for (const automation of matching) {
      try {
        const conditions = automation.conditions as unknown as AutomationCondition[]
        const conditionsMet = evaluateConditions(conditions, enrichedContext)

        if (!conditionsMet) continue

        const actions = automation.actions as unknown as AutomationAction[]
        const { actionsRun, errors } = await executeActions(actions, enrichedContext)

        await prisma.dealAutomation.update({
          where: { id: automation.id },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date(),
          },
        })

        logger.info(
          {
            automationId: automation.id,
            taskId,
            triggerType,
            actionsRun,
            errors: errors.length,
          },
          'Task automation executed'
        )
      } catch (automationErr) {
        logger.error(
          { automationErr, automationId: automation.id, taskId, triggerType },
          'Error executing task automation'
        )
      }
    }
  } catch (err) {
    logger.error({ err, taskId, triggerType }, 'Unhandled error in executeTaskAutomations')
  }
}
