/**
 * AgaaS Agent Trigger
 *
 * Evaluates incoming events (WhatsApp messages, contact creation, deal changes)
 * and creates AgentAction records for enabled agents.
 *
 * This is the bridge between real-time events and the agent action system.
 * Actions are created as NEEDS_APPROVAL so the user reviews them in /IA.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkAgaasQuota, incrementAgaasUsage } from '@/lib/agaas-quota'
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

    // Load org's iaConfig to check which agents are enabled
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { iaConfig: true },
    })

    const config = (org?.iaConfig || {}) as Record<string, { enabled?: boolean }>

    // Find which whatsapp-triggered agents are enabled
    const enabledAgents = WHATSAPP_MESSAGE_AGENTS.filter(
      (agentId) => config[agentId]?.enabled === true
    )

    if (enabledAgents.length === 0) return

    // Check if contact has existing deals (determines which agent is more relevant)
    const existingDeal = await prisma.deal.findFirst({
      where: { organizationId, contactId },
      select: { id: true, title: true, stageId: true },
      orderBy: { updatedAt: 'desc' },
    })

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
        confidence: 0.5,
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
        confidence: 0.5,
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

      await prisma.agentAction.create({
        data: {
          organizationId,
          agentName: action.agentName,
          actionType: action.actionType,
          entityType: action.entityType,
          entityId: action.entityId,
          reasoning: action.reasoning,
          confidence: action.confidence,
          input: action.input,
          status: 'NEEDS_APPROVAL',
        },
      })

      await incrementAgaasUsage(organizationId)

      logger.info({
        organizationId,
        agentName: action.agentName,
        actionType: action.actionType,
        entityId: action.entityId,
      }, '[AgaaS:Trigger] Agent action created from WhatsApp message')
    }
  } catch (error: any) {
    // Never break the webhook — log and move on
    logger.error({ error: error.message, organizationId: ctx.organizationId }, '[AgaaS:Trigger] Error evaluating message')
  }
}
