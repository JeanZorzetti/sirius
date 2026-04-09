/**
 * Automation Actions Executor
 *
 * Supported action types:
 * - SEND_EMAIL: Send email to the deal owner
 * - NOTIFY_USER: Create an in-app Notification for the deal owner
 * - CREATE_TASK: Create a Note on the deal (used as a task)
 * - ADD_TAG: Create or connect a Tag to the deal's contact
 * - SEND_WEBHOOK: POST to a webhook URL with deal context
 */

import { prisma } from '@/lib/prisma'
import { sendHtmlEmail } from '@/lib/email'
import logger from '@/lib/logger'

export interface AutomationAction {
  type: 'SEND_EMAIL' | 'NOTIFY_USER' | 'CREATE_TASK' | 'ADD_TAG' | 'SEND_WEBHOOK'
  config: Record<string, unknown>
}

/**
 * Replace template variables in a string with values from context.
 * Supported: {{dealTitle}}, {{dealValue}}, {{dealId}}, {{triggerType}}
 */
function resolveTemplate(template: string, context: Record<string, unknown>): string {
  const formattedValue = context.value !== undefined
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(context.value))
    : ''

  return template
    .replace(/\{\{dealTitle\}\}/g, String(context.title || ''))
    .replace(/\{\{dealValue\}\}/g, formattedValue)
    .replace(/\{\{dealId\}\}/g, String(context.dealId || ''))
    .replace(/\{\{triggerType\}\}/g, String(context.triggerType || ''))
}

export interface ActionsResult {
  actionsRun: number
  errors: string[]
}

/**
 * Execute all actions from an automation definition.
 * Returns a summary with actionsRun count and any errors that occurred.
 */
export async function executeActions(
  actions: AutomationAction[],
  context: Record<string, unknown>
): Promise<ActionsResult> {
  const errors: string[] = []
  let actionsRun = 0

  if (!actions || actions.length === 0) {
    return { actionsRun, errors }
  }

  for (const action of actions) {
    try {
      await executeSingleAction(action, context)
      actionsRun++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`${action.type}: ${message}`)
      logger.error({ err, actionType: action.type, context }, 'Automation action failed')
    }
  }

  return { actionsRun, errors }
}

async function executeSingleAction(
  action: AutomationAction,
  context: Record<string, unknown>
): Promise<void> {
  const { type, config } = action

  switch (type) {
    case 'SEND_EMAIL': {
      await handleSendEmail(config, context)
      break
    }

    case 'NOTIFY_USER': {
      await handleNotifyUser(config, context)
      break
    }

    case 'CREATE_TASK': {
      await handleCreateTask(config, context)
      break
    }

    case 'ADD_TAG': {
      await handleAddTag(config, context)
      break
    }

    case 'SEND_WEBHOOK': {
      await handleSendWebhook(config, context)
      break
    }

    default: {
      logger.warn({ type }, 'Unknown automation action type — skipping')
    }
  }
}

// ---------------------------------------------------------------------------
// SEND_EMAIL
// ---------------------------------------------------------------------------
async function handleSendEmail(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<void> {
  const subject = resolveTemplate(String(config.subject || 'Notificação do CRM'), context)
  const body = resolveTemplate(String(config.body || ''), context)
  const userId = context.userId as string | undefined

  if (!userId) {
    throw new Error('No userId in context for SEND_EMAIL action')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  })

  if (!user?.email) {
    throw new Error(`User ${userId} has no email`)
  }

  const html = `<div style="font-family: sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>`

  const result = await sendHtmlEmail({ to: user.email, subject, html })

  if (!result.success) {
    throw new Error(`Failed to send email: ${JSON.stringify(result.error)}`)
  }
}

// ---------------------------------------------------------------------------
// NOTIFY_USER
// ---------------------------------------------------------------------------
async function handleNotifyUser(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<void> {
  const message = resolveTemplate(String(config.message || 'Automação disparada no seu negócio.'), context)
  const userId = context.userId as string | undefined
  const organizationId = context.organizationId as string | undefined
  const dealId = context.dealId as string | undefined

  if (!userId || !organizationId) {
    throw new Error('No userId or organizationId in context for NOTIFY_USER action')
  }

  await prisma.notification.create({
    data: {
      type: 'SYSTEM',
      title: 'Automação de Negócio',
      message,
      userId,
      organizationId,
      metadata: dealId ? { dealId } : undefined
    }
  })
}

// ---------------------------------------------------------------------------
// CREATE_TASK
// ---------------------------------------------------------------------------
async function handleCreateTask(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<void> {
  const taskTitle = resolveTemplate(String(config.taskTitle || 'Tarefa criada pela automação'), context)
  const taskDescription = config.taskDescription
    ? resolveTemplate(String(config.taskDescription), context)
    : null
  const priority = (config.priority as string) || 'MEDIUM'
  const dueInDays = config.dueInDays ? Number(config.dueInDays) : null
  const taskProjectId = config.taskProjectId as string | undefined
  const dealId = context.dealId as string | undefined
  const contactId = context.contactId as string | undefined
  const userId = context.userId as string | undefined
  const organizationId = context.organizationId as string | undefined

  if (!userId) {
    throw new Error('No userId in context for CREATE_TASK action')
  }

  // If a taskProjectId is configured, create a real Task in the task manager
  if (taskProjectId && organizationId) {
    const project = await prisma.taskProject.findFirst({
      where: { id: taskProjectId, organizationId },
      include: {
        statuses: { orderBy: { order: 'asc' }, take: 1 },
      },
    })

    if (!project) {
      throw new Error(`TaskProject ${taskProjectId} not found in organization`)
    }

    const firstStatus = project.statuses[0]
    if (!firstStatus) {
      throw new Error(`TaskProject ${taskProjectId} has no statuses`)
    }

    const dueDate = dueInDays !== null && !Number.isNaN(dueInDays)
      ? new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000)
      : null

    const maxOrder = await prisma.task.aggregate({
      where: { projectId: taskProjectId, statusId: firstStatus.id },
      _max: { order: true },
    })

    await prisma.task.create({
      data: {
        title: taskTitle,
        description: taskDescription,
        priority: priority as 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        order: (maxOrder._max.order ?? -1) + 1,
        dueDate,
        projectId: taskProjectId,
        statusId: firstStatus.id,
        creatorId: userId,
        assigneeId: userId,
        organizationId,
        dealId: dealId || null,
        contactId: contactId || null,
      },
    })
    return
  }

  // Legacy fallback: create a Note on the deal
  if (!dealId) {
    throw new Error('No dealId in context for legacy CREATE_TASK action (and no taskProjectId configured)')
  }

  await prisma.note.create({
    data: {
      content: `[TAREFA] ${taskTitle}`,
      dealId,
      userId,
    },
  })
}

// ---------------------------------------------------------------------------
// ADD_TAG
// ---------------------------------------------------------------------------
async function handleAddTag(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<void> {
  const tagName = String(config.tagName || '').trim()
  const organizationId = context.organizationId as string | undefined
  const dealId = context.dealId as string | undefined

  if (!tagName) {
    throw new Error('tagName is required for ADD_TAG action')
  }

  if (!organizationId || !dealId) {
    throw new Error('No organizationId or dealId in context for ADD_TAG action')
  }

  // Fetch the deal to find the contactId
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { contactId: true }
  })

  // Upsert the tag (find or create by name within org)
  const tag = await prisma.tag.upsert({
    where: {
      // There is no unique on name+organizationId — we do a findFirst then create
      id: 'non-existent-will-never-match'
    },
    update: {},
    create: {
      name: tagName,
      color: '#6366f1',
      organizationId
    }
  }).catch(async () => {
    // Fallback: findFirst then create
    const existing = await prisma.tag.findFirst({
      where: { name: tagName, organizationId }
    })
    if (existing) return existing
    return prisma.tag.create({
      data: { name: tagName, color: '#6366f1', organizationId }
    })
  })

  // Connect tag to contact if deal has a contact
  if (deal?.contactId) {
    await prisma.contact.update({
      where: { id: deal.contactId },
      data: {
        tags: {
          connect: { id: tag.id }
        }
      }
    })
  }

  // Also connect tag to the deal
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      tags: {
        connect: { id: tag.id }
      }
    }
  })
}

// ---------------------------------------------------------------------------
// SEND_WEBHOOK
// ---------------------------------------------------------------------------
async function handleSendWebhook(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<void> {
  const webhookUrl = String(config.webhookUrl || '')

  if (!webhookUrl) {
    throw new Error('webhookUrl is required for SEND_WEBHOOK action')
  }

  const payload = {
    dealId: context.dealId,
    trigger: context.triggerType,
    context
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000) // 10s timeout
  })

  if (!response.ok) {
    throw new Error(`Webhook returned HTTP ${response.status}`)
  }
}
