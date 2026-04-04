/**
 * AgaaS Agent Trigger
 *
 * Evaluates incoming events (WhatsApp messages, contact creation, deal changes)
 * and creates AgentAction records for enabled agents.
 *
 * Respects iaConfig settings:
 * - confidenceThreshold: actions above threshold auto-execute, below need approval
 * - operatingHoursStart/End + weekendsEnabled: only trigger during business hours
 * - maxActionsPerDay: daily action cap
 * - enabledAgents: which agents are active
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { checkAgaasQuota, incrementAgaasUsage } from '@/lib/agaas-quota'
import { executeAgentAction } from '@/lib/agaas-executor'
import logger from '@/lib/logger'

/** Agent IDs that respond to whatsapp.message.in */
const WHATSAPP_MESSAGE_AGENTS = ['lead-qualifier', 'deal-stage-analyzer']

interface InboundMessageContext {
  organizationId: string
  contactId: string
  messageId: string
  messageText: string
  contactName: string
  contactPhone: string
}

interface IAConfig {
  enabledAgents?: Record<string, boolean>
  confidenceThreshold?: number       // 0-100, default 70
  maxActionsPerDay?: number           // default 100
  operatingHoursStart?: string        // "HH:MM", default "09:00"
  operatingHoursEnd?: string          // "HH:MM", default "18:00"
  weekendsEnabled?: boolean           // default false
  [key: string]: any
}

/**
 * Check if current time is within operating hours.
 */
function isWithinOperatingHours(config: IAConfig): boolean {
  const now = new Date()
  // Use Brazil timezone (UTC-3)
  const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))

  const day = brTime.getDay() // 0=Sun, 6=Sat
  if ((day === 0 || day === 6) && !config.weekendsEnabled) {
    return false
  }

  const start = config.operatingHoursStart || '09:00'
  const end = config.operatingHoursEnd || '18:00'

  const currentMinutes = brTime.getHours() * 60 + brTime.getMinutes()
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

/**
 * Check if daily action limit has been reached.
 */
async function isDailyLimitReached(organizationId: string, maxPerDay: number): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayCount = await prisma.agentAction.count({
    where: { organizationId, createdAt: { gte: today } },
  })

  return todayCount >= maxPerDay
}

/**
 * Evaluate an inbound WhatsApp message and trigger relevant agents.
 * Called from the Evolution webhook after saving an INBOUND message.
 * Non-blocking — catches all errors to never break the webhook.
 */
export async function triggerAgentsForInboundMessage(ctx: InboundMessageContext) {
  try {
    const { organizationId, contactId, messageId, messageText } = ctx

    // Skip empty messages
    if (!messageText?.trim()) return

    // Check if org has AgaaS enabled and has quota
    const quota = await checkAgaasQuota(organizationId)
    if (!quota.allowed) return

    // Load org's iaConfig
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { iaConfig: true },
    })

    const rawConfig = (org?.iaConfig || {}) as IAConfig

    // Parse config values
    const confidenceThreshold = (rawConfig.confidenceThreshold ?? 70) / 100 // convert to 0-1
    const maxActionsPerDay = rawConfig.maxActionsPerDay ?? 100

    // Check operating hours
    if (!isWithinOperatingHours(rawConfig)) {
      logger.info({ organizationId }, '[AgaaS:Trigger] Outside operating hours, skipping')
      return
    }

    // Check daily limit
    if (await isDailyLimitReached(organizationId, maxActionsPerDay)) {
      logger.info({ organizationId, maxActionsPerDay }, '[AgaaS:Trigger] Daily action limit reached')
      return
    }

    // Determine enabled agents (supports both iaConfig formats)
    const enabledMap = rawConfig.enabledAgents || rawConfig
    const enabledAgents = WHATSAPP_MESSAGE_AGENTS.filter((agentId) => {
      const val = enabledMap[agentId]
      return val === true || val?.enabled === true
    })

    if (enabledAgents.length === 0) return

    // Check if contact has existing deals
    const existingDeal = await prisma.deal.findFirst({
      where: { organizationId, contactId },
      select: { id: true, title: true, stageId: true },
      orderBy: { updatedAt: 'desc' },
    })

    // Count recent messages from this contact to estimate engagement/confidence
    const recentMsgCount = await prismaWa.whatsAppMessage.count({
      where: {
        contactId,
        organizationId,
        direction: 'INBOUND',
        sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // last 7 days
      },
    })

    // Dynamic confidence: more messages = higher confidence the lead is engaged
    const baseConfidence = Math.min(0.9, 0.4 + recentMsgCount * 0.1)

    const actions: Array<{
      agentName: string
      actionType: string
      entityType: string
      entityId: string
      reasoning: string
      confidence: number
      input: Prisma.InputJsonValue
    }> = []

    // LeadQualifier: triggers when contact has NO deal (new lead)
    if (enabledAgents.includes('lead-qualifier') && !existingDeal) {
      actions.push({
        agentName: 'LeadQualifier',
        actionType: 'QUALIFY_LEAD',
        entityType: 'Contact',
        entityId: contactId,
        reasoning: `Nova mensagem de ${ctx.contactName || ctx.contactPhone} sem deal associado. Avaliar qualificação BANT/SPIN e considerar criação de deal.`,
        confidence: baseConfidence,
        input: {
          messageId,
          messageText: messageText.substring(0, 500),
          contactName: ctx.contactName,
          contactPhone: ctx.contactPhone,
          trigger: 'whatsapp.message.in',
        },
      })
    }

    // DealStageAnalyzer: triggers when contact HAS an existing deal
    if (enabledAgents.includes('deal-stage-analyzer') && existingDeal) {
      actions.push({
        agentName: 'DealStageAnalyzer',
        actionType: 'ANALYZE_DEAL',
        entityType: 'Deal',
        entityId: existingDeal.id,
        reasoning: `Nova mensagem de ${ctx.contactName || ctx.contactPhone} com deal "${existingDeal.title}" ativo. Analisar intenção de compra e avaliar movimentação de estágio.`,
        confidence: baseConfidence,
        input: {
          messageId,
          messageText: messageText.substring(0, 500),
          contactId,
          contactName: ctx.contactName,
          dealId: existingDeal.id,
          dealTitle: existingDeal.title,
          trigger: 'whatsapp.message.in',
        },
      })
    }

    // Create all actions (check quota for each)
    for (const action of actions) {
      const currentQuota = await checkAgaasQuota(organizationId)
      if (!currentQuota.allowed) {
        logger.warn({ organizationId }, '[AgaaS:Trigger] Quota exhausted during action creation')
        break
      }

      // Determine status based on confidence vs threshold
      const autoExecute = action.confidence >= confidenceThreshold
      const status = autoExecute ? 'PENDING' : 'NEEDS_APPROVAL'

      const created = await prisma.agentAction.create({
        data: {
          organizationId,
          agentName: action.agentName,
          actionType: action.actionType,
          entityType: action.entityType,
          entityId: action.entityId,
          reasoning: action.reasoning,
          confidence: action.confidence,
          input: action.input,
          status,
        },
      })

      await incrementAgaasUsage(organizationId)

      logger.info({
        organizationId,
        agentName: action.agentName,
        actionType: action.actionType,
        entityId: action.entityId,
        confidence: action.confidence,
        threshold: confidenceThreshold,
        autoExecute,
      }, '[AgaaS:Trigger] Agent action created')

      // Auto-execute if confidence meets threshold
      if (autoExecute) {
        // Find an admin/owner user for the org to assign as deal owner
        const orgUser = await prisma.user.findFirst({
          where: { organizationId, role: 'ADMIN' },
          select: { id: true },
        })

        if (orgUser) {
          try {
            const result = await executeAgentAction({
              id: created.id,
              organizationId,
              agentName: action.agentName,
              actionType: action.actionType,
              entityType: action.entityType,
              entityId: action.entityId,
              reasoning: action.reasoning,
              confidence: action.confidence,
              input: action.input,
              userId: orgUser.id,
            })

            await prisma.agentAction.update({
              where: { id: created.id },
              data: {
                status: result.success ? 'SUCCESS' : 'FAILED',
                output: result.output as Prisma.InputJsonValue,
              },
            })

            logger.info({
              actionId: created.id,
              agentName: action.agentName,
              success: result.success,
            }, '[AgaaS:Trigger] Auto-executed action (above threshold)')
          } catch (execError: any) {
            await prisma.agentAction.update({
              where: { id: created.id },
              data: {
                status: 'FAILED',
                output: { error: execError.message } as Prisma.InputJsonValue,
              },
            })
            logger.error({ actionId: created.id, error: execError.message }, '[AgaaS:Trigger] Auto-execution failed')
          }
        }
      }
    }
  } catch (error: any) {
    // Never break the webhook — log and move on
    logger.error({ error: error.message, organizationId: ctx.organizationId }, '[AgaaS:Trigger] Error evaluating message')
  }
}
