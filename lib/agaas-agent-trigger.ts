/**
 * AgaaS Agent Trigger
 *
 * Evaluates incoming events (WhatsApp messages, contact creation, idle deals) and creates AgentAction proposals for
 * the enabled agents. Nothing runs on its own (spec 011): every proposal is created waiting for human approval, with
 * the draft already written, so the person reads exactly what would be sent or changed before approving.
 *
 * Respects iaConfig settings:
 * - operatingHoursStart/End + weekendsEnabled: only trigger during business hours
 * - maxActionsPerDay: daily proposal cap
 * - enabledAgents: which agents are active
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { checkAgaasQuota, incrementAgaasUsage } from '@/lib/agaas-quota'
import { executeAgentAction } from '@/lib/agaas-executor'
import type { IAConfig } from '@/lib/agaas-types'
import logger from '@/lib/logger'

interface InboundMessageContext {
  organizationId: string
  contactId: string
  messageId: string
  messageText: string
  contactName: string
  contactPhone: string
}

type Proposta = {
  organizationId: string
  agentName: string
  actionType: string
  entityType: 'Contact' | 'Deal'
  entityId: string
  reasoning: string
  confidence: number
  input: Prisma.InputJsonValue
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

const agenteLigado = (config: IAConfig, agentId: string) => {
  const mapa = (config.enabledAgents || config) as Record<string, unknown>
  const valor = mapa[agentId]
  return valor === true || (typeof valor === 'object' && valor !== null && (valor as { enabled?: boolean }).enabled === true)
}

/**
 * Creates the proposal waiting for approval, unless the same agent already has one pending for the same entity
 * (a burst of messages must not become a burst of proposals). The check and the insert are serialized per
 * agent+entity, so concurrent webhooks cannot both pass. Then writes the draft into the proposal.
 */
async function proporAcao(proposta: Proposta): Promise<boolean> {
  const criada = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`agaas:${proposta.agentName}:${proposta.entityId}`}))`
    const pendente = await tx.agentAction.findFirst({
      where: {
        organizationId: proposta.organizationId,
        agentName: proposta.agentName,
        entityId: proposta.entityId,
        status: { in: ['NEEDS_APPROVAL', 'PENDING'] },
      },
      select: { id: true },
    })
    if (pendente) return null
    return tx.agentAction.create({ data: { ...proposta, status: 'NEEDS_APPROVAL' } })
  })
  if (!criada) return false

  await incrementAgaasUsage(proposta.organizationId)

  try {
    const rascunho = await executeAgentAction({ ...criada, input: criada.input as any, userId: '' }, 'rascunho')
    await prisma.agentAction.update({
      where: { id: criada.id, organizationId: criada.organizationId },
      data: {
        output: (rascunho.success
          ? { rascunho: rascunho.output }
          : { erroRascunho: rascunho.output?.error ?? 'draft failed' }) as Prisma.InputJsonValue,
      },
    })
  } catch (erro: any) {
    await prisma.agentAction.update({
      where: { id: criada.id, organizationId: criada.organizationId },
      data: { output: { erroRascunho: erro.message } as Prisma.InputJsonValue },
    }).catch(() => {})
  }

  logger.info({ organizationId: proposta.organizationId, agentName: proposta.agentName, actionId: criada.id }, '[AgaaS:Trigger] Proposal waiting for approval')
  return true
}

/**
 * Evaluate an inbound WhatsApp message and propose actions from the enabled agents.
 * Called from the WABA webhook after saving an INBOUND message.
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

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { iaConfig: true },
    })
    const rawConfig = (org?.iaConfig || {}) as IAConfig
    const maxActionsPerDay = rawConfig.maxActionsPerDay ?? 100

    if (!isWithinOperatingHours(rawConfig)) {
      logger.info({ organizationId }, '[AgaaS:Trigger] Outside operating hours, skipping')
      return
    }

    if (await isDailyLimitReached(organizationId, maxActionsPerDay)) {
      logger.info({ organizationId, maxActionsPerDay }, '[AgaaS:Trigger] Daily action limit reached')
      return
    }

    const ligado = (agentId: string) => agenteLigado(rawConfig, agentId)
    const prompt = (agentId: string) => {
      const override = rawConfig.agentOverrides?.[agentId]
      return override?.systemPrompt ? { systemPromptOverride: override.systemPrompt } : {}
    }

    // Check if contact has existing deals
    const existingDeal = await prisma.deal.findFirst({
      where: { organizationId, contactId },
      select: { id: true, title: true, stageId: true },
      orderBy: { updatedAt: 'desc' },
    })

    // Count recent messages from this contact (engagement label shown with the proposal; it decides nothing)
    const recentMsgCount = await prismaWa.whatsAppMessage.count({
      where: {
        contactId,
        organizationId,
        direction: 'INBOUND',
        sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // last 7 days
      },
    })
    const baseConfidence = Math.min(0.9, 0.4 + recentMsgCount * 0.1)
    const texto = messageText.toLowerCase()
    const trecho = messageText.substring(0, 500)
    const quem = ctx.contactName || ctx.contactPhone

    const propostas: Proposta[] = []

    // LeadQualifier: contact has no deal yet (new lead)
    if (ligado('lead-qualifier') && !existingDeal) {
      propostas.push({
        organizationId, agentName: 'LeadQualifier', actionType: 'QUALIFY_LEAD', entityType: 'Contact', entityId: contactId,
        reasoning: `Nova mensagem de ${quem} sem deal associado. Avaliar qualificação BANT/SPIN e considerar criação de deal.`,
        confidence: baseConfidence,
        input: { messageId, messageText: trecho, contactName: ctx.contactName, trigger: 'whatsapp.message.in' },
      })
    }

    // DealStageAnalyzer: contact has an existing deal
    if (ligado('deal-stage-analyzer') && existingDeal) {
      propostas.push({
        organizationId, agentName: 'DealStageAnalyzer', actionType: 'ANALYZE_DEAL', entityType: 'Deal', entityId: existingDeal.id,
        reasoning: `Nova mensagem de ${quem} com deal "${existingDeal.title}" ativo. Analisar intenção de compra e avaliar movimentação de estágio.`,
        confidence: baseConfidence,
        input: { messageId, messageText: trecho, contactId, contactName: ctx.contactName, dealId: existingDeal.id, dealTitle: existingDeal.title, trigger: 'whatsapp.message.in' },
      })
    }

    // LeadProfiler: classify lead profile on first messages
    if (ligado('lead-profiler') && recentMsgCount <= 5) {
      propostas.push({
        organizationId, agentName: 'LeadProfiler', actionType: 'PROFILE_LEAD', entityType: 'Contact', entityId: contactId,
        reasoning: `${recentMsgCount} mensagens de ${quem}. Classificar perfil: COMPRADOR/VENDEDOR/LOCATARIO/INVESTIDOR.`,
        confidence: Math.min(0.85, 0.5 + recentMsgCount * 0.07),
        input: { messageId, messageText: trecho, contactName: ctx.contactName, trigger: 'whatsapp.message.in', ...prompt('lead-profiler') },
      })
    }

    // PropertyMatcher: lead mentions search criteria
    const propertyKeywords = ['quarto', 'dormitório', 'bairro', 'comprar', 'alugar', 'imóvel', 'apartamento', 'casa', 'studio', 'm²', 'metro', 'condomínio']
    if (ligado('property-matcher') && propertyKeywords.some((k) => texto.includes(k))) {
      propostas.push({
        organizationId, agentName: 'PropertyMatcher', actionType: 'MATCH_PROPERTIES', entityType: 'Contact', entityId: contactId,
        reasoning: `${quem} mencionou critérios de busca imobiliária. Sugerir imóveis compatíveis do catálogo.`,
        confidence: 0.82,
        input: { messageId, messageText: trecho, contactName: ctx.contactName, trigger: 'whatsapp.message.in', ...prompt('property-matcher') },
      })
    }

    // VisitScheduler: visit intent
    const visitKeywords = ['visitar', 'visita', 'conhecer', 'ver o imóvel', 'posso ver', 'quero ver', 'agendar visita']
    if (ligado('visit-scheduler') && visitKeywords.some((k) => texto.includes(k))) {
      propostas.push({
        organizationId, agentName: 'VisitScheduler', actionType: 'SCHEDULE_VISIT', entityType: 'Contact', entityId: contactId,
        reasoning: `${quem} demonstrou intenção de visitar um imóvel. Propor horários disponíveis.`,
        confidence: 0.8,
        input: { messageId, messageText: trecho, contactName: ctx.contactName, trigger: 'whatsapp.message.in', ...prompt('visit-scheduler') },
      })
    }

    // NegotiationAssistant: price/condition objections
    const objectionKeywords = ['muito caro', 'caro demais', 'não tenho', 'consigo', 'abaixar', 'desconto', 'negociar', 'valor alto', 'acima do']
    if (ligado('negotiation-assistant') && objectionKeywords.some((k) => texto.includes(k))) {
      propostas.push({
        organizationId, agentName: 'NegotiationAssistant', actionType: 'HANDLE_OBJECTION', entityType: 'Contact', entityId: contactId,
        reasoning: `${quem} apresentou objeção de preço/condição. Sugerir contra-proposta estratégica.`,
        confidence: 0.6,
        input: { messageId, messageText: trecho, contactName: ctx.contactName, trigger: 'whatsapp.message.in', ...prompt('negotiation-assistant') },
      })
    }

    for (const proposta of propostas) {
      const currentQuota = await checkAgaasQuota(organizationId)
      if (!currentQuota.allowed) {
        logger.warn({ organizationId }, '[AgaaS:Trigger] Quota exhausted during proposal creation')
        break
      }
      await proporAcao(proposta)
    }
  } catch (error: any) {
    // Never break the webhook — log and move on
    logger.error({ error: error.message, organizationId: ctx.organizationId }, '[AgaaS:Trigger] Error evaluating message')
  }
}

// ─── Contact created ──────────────────────────────────────────────────────────

interface ContactCreatedContext {
  organizationId: string
  contactId: string
  contactName: string
  contactPhone?: string
  contactEmail?: string
}

/**
 * Propose ContactEnricher / LeadProfiler suggestions when a new contact is created.
 * Non-blocking — call with .catch() from contact creation routes.
 */
export async function triggerAgentsForContactCreated(ctx: ContactCreatedContext) {
  try {
    const { organizationId, contactId, contactName } = ctx

    const quota = await checkAgaasQuota(organizationId)
    if (!quota.allowed) return

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { iaConfig: true },
    })
    const rawConfig = (org?.iaConfig || {}) as IAConfig

    if (agenteLigado(rawConfig, 'lead-profiler')) {
      const override = rawConfig.agentOverrides?.['lead-profiler']
      await proporAcao({
        organizationId, agentName: 'LeadProfiler', actionType: 'PROFILE_LEAD', entityType: 'Contact', entityId: contactId,
        reasoning: `Novo contato criado: ${contactName}. Classificar perfil imobiliário.`,
        confidence: 0.65,
        input: { contactName, trigger: 'contact.created', ...(override?.systemPrompt ? { systemPromptOverride: override.systemPrompt } : {}) },
      })
    }

    if (agenteLigado(rawConfig, 'contact-enricher')) {
      await proporAcao({
        organizationId, agentName: 'ContactEnricher', actionType: 'ENRICH_CONTACT', entityType: 'Contact', entityId: contactId,
        reasoning: `Novo contato criado: ${contactName}. Sugerir cargo, empresa e insights.`,
        confidence: 0.75,
        input: { contactName, trigger: 'contact.created' },
      })
    }
  } catch (error: any) {
    logger.error({ error: error.message, organizationId: ctx.organizationId }, '[AgaaS:Trigger] ContactEnricher error')
  }
}

// ─── FollowUpCoordinator trigger (called by cron) ─────────────────────────────

/**
 * Scan all orgs for idle deals and propose follow-ups (waiting for approval).
 * Called by GET /api/cron/agaas-idle-deals
 */
export async function triggerFollowUpForIdleDeals() {
  const IDLE_DAYS = 3

  // isolamento: cron without session — every query below is scoped by the org of this loop
  const orgs = await prisma.organization.findMany({
    where: { agaasEnabled: true },
    select: { id: true, iaConfig: true },
  })

  let triggered = 0

  for (const org of orgs) {
    try {
      const quota = await checkAgaasQuota(org.id)
      if (!quota.allowed) continue

      const rawConfig = (org.iaConfig || {}) as IAConfig
      const followUpEnabled = agenteLigado(rawConfig, 'followup-coordinator')
      const proposalFollowUpEnabled = agenteLigado(rawConfig, 'proposal-followup')
      if (!followUpEnabled && !proposalFollowUpEnabled) continue
      if (!isWithinOperatingHours(rawConfig)) continue

      const maxActionsPerDay = rawConfig.maxActionsPerDay ?? 100
      if (await isDailyLimitReached(org.id, maxActionsPerDay)) continue

      const idleCutoff = new Date(Date.now() - IDLE_DAYS * 24 * 60 * 60 * 1000)
      const idleDeals = await prisma.deal.findMany({
        where: { organizationId: org.id, status: 'ACTIVE', updatedAt: { lte: idleCutoff } },
        select: { id: true, title: true, contactId: true, updatedAt: true, stage: { select: { name: true } } },
        take: 10,
        orderBy: { updatedAt: 'asc' },
      })

      for (const deal of idleDeals) {
        if (!deal.contactId) continue
        const contact = await prisma.contact.findFirst({
          where: { id: deal.contactId, organizationId: org.id },
          select: { id: true, name: true, phone: true },
        })
        if (!contact?.phone) continue

        const idleDays = Math.floor((Date.now() - deal.updatedAt.getTime()) / (24 * 60 * 60 * 1000))
        const isProposalStage = deal.stage?.name?.toLowerCase().includes('proposta')
        const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000)

        // ProposalFollowUp: deals in a "Proposta" stage (a draft; never sent by approval)
        if (proposalFollowUpEnabled && isProposalStage) {
          const recente = await prisma.agentAction.findFirst({
            where: { organizationId: org.id, agentName: 'ProposalFollowUp', entityId: deal.id, createdAt: { gte: umDiaAtras } },
            select: { id: true },
          })
          if (!recente) {
            const override = rawConfig.agentOverrides?.['proposal-followup']
            const criada = await proporAcao({
              organizationId: org.id, agentName: 'ProposalFollowUp', actionType: 'PROPOSAL_FOLLOWUP', entityType: 'Deal', entityId: deal.id,
              reasoning: `Deal "${deal.title}" em Proposta, parado há ${idleDays} dias. Rascunho de follow-up para aprovação.`,
              confidence: 0.6,
              input: {
                contactId: contact.id, contactName: contact.name, dealId: deal.id, dealTitle: deal.title, idleDays,
                trigger: 'deal.idle', ...(override?.systemPrompt ? { systemPromptOverride: override.systemPrompt } : {}),
              },
            })
            if (criada) triggered++
          }
        }

        // FollowUpCoordinator: any idle deal (sent only after approval)
        if (followUpEnabled) {
          const recente = await prisma.agentAction.findFirst({
            where: { organizationId: org.id, agentName: 'FollowUpCoordinator', entityId: deal.id, createdAt: { gte: umDiaAtras } },
            select: { id: true },
          })
          if (recente) continue
          const criada = await proporAcao({
            organizationId: org.id, agentName: 'FollowUpCoordinator', actionType: 'SEND_FOLLOWUP', entityType: 'Deal', entityId: deal.id,
            reasoning: `Deal "${deal.title}" parado há ${idleDays} dias. Follow-up personalizado para ${contact.name || contact.phone}, aguardando aprovação.`,
            confidence: 0.8,
            input: { contactId: contact.id, contactName: contact.name, dealId: deal.id, dealTitle: deal.title, idleDays, trigger: 'deal.idle' },
          })
          if (criada) triggered++
        }
      }
    } catch (e: any) {
      logger.error({ error: e.message, orgId: org.id }, '[AgaaS:FollowUp] Error processing org')
    }
  }

  logger.info({ triggered }, '[AgaaS:FollowUp] Idle deal scan complete')
  return triggered
}
