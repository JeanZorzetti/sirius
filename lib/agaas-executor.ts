/**
 * AgaaS Agent Executor
 *
 * Executes approved agent actions by calling the LLM and performing
 * the actual CRM operations (create deal, move stage, etc.).
 */

import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { callLLM } from '@/lib/agi/providers'
import { getWhatsAppOfficialClient, normalizePhone } from '@/lib/integrations/whatsapp-official-client'
import { getGoogleCalendarClient } from '@/lib/integrations/google-calendar-client'
import { retrieveContext } from '@/lib/rag/retrieval'
import logger from '@/lib/logger'

/**
 * Check if the contact sent a message in the last 24 hours (Meta conversation window).
 * Outside this window only approved templates can be sent — free-form text is blocked.
 */
async function isWithin24hWindow(contactId: string, organizationId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const lastInbound = await prismaWa.whatsAppMessage.findFirst({
    where: {
      contactId,
      organizationId,
      direction: 'INBOUND',
      sentAt: { gte: cutoff },
    },
    select: { id: true },
  })
  return !!lastInbound
}

interface AgentAction {
  id: string
  organizationId: string
  agentName: string
  actionType: string
  entityType: string
  entityId: string
  reasoning: string
  confidence: number
  input: any
  userId: string
}

function injectRagContext(basePrompt: string, ragContext: string): string {
  if (!ragContext) return basePrompt
  return `${basePrompt}\n\nBASE DE CONHECIMENTO RELEVANTE:\n---\n${ragContext}\n---`
}

/**
 * Execute an approved agent action.
 * Returns the output object to store in the AgentAction record.
 */
const AGENT_NAME_TO_ID: Record<string, string> = {
  LeadQualifier: 'lead-qualifier',
  DealStageAnalyzer: 'deal-stage-analyzer',
  FollowUpCoordinator: 'followup-coordinator',
  MeetingScheduler: 'meeting-scheduler',
  ContactEnricher: 'contact-enricher',
  PropertyMatcher: 'property-matcher',
  VisitScheduler: 'visit-scheduler',
  ProposalFollowUp: 'proposal-followup',
  LeadProfiler: 'lead-profiler',
  NegotiationAssistant: 'negotiation-assistant',
}

export async function executeAgentAction(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  // Retrieve RAG context scoped to this agent (+ global docs) from the knowledge base
  const ragQuery = action.input?.messageText || action.input?.context || action.actionType
  const agentId = AGENT_NAME_TO_ID[action.agentName]
  const ragContext = await retrieveContext(action.organizationId, ragQuery, agentId, 3).catch(() => '')
  const enrichedAction = { ...action, input: { ...action.input, ragContext } }

  switch (enrichedAction.agentName) {
    case 'LeadQualifier':
      return executeLeadQualifier(enrichedAction)
    case 'DealStageAnalyzer':
      return executeDealStageAnalyzer(enrichedAction)
    case 'FollowUpCoordinator':
      return executeFollowUpCoordinator(enrichedAction)
    case 'MeetingScheduler':
      return executeMeetingScheduler(enrichedAction)
    case 'ContactEnricher':
      return executeContactEnricher(enrichedAction)
    case 'PropertyMatcher':
      return executePropertyMatcher(enrichedAction)
    case 'VisitScheduler':
      return executeVisitScheduler(enrichedAction)
    case 'ProposalFollowUp':
      return executeProposalFollowUp(enrichedAction)
    case 'LeadProfiler':
      return executeLeadProfiler(enrichedAction)
    case 'NegotiationAssistant':
      return executeNegotiationAssistant(enrichedAction)
    default:
      return { success: false, output: { error: `Unknown agent: ${enrichedAction.agentName}` } }
  }
}

/**
 * LeadQualifier: Analyze the message, qualify the lead, and create a deal.
 */
async function executeLeadQualifier(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, entityId: contactId, input, userId } = action
  const messageText = input?.messageText || ''
  const contactName = input?.contactName || 'Lead'

  // Get contact's recent messages for context
  const recentMessages = await prismaWa.whatsAppMessage.findMany({
    where: { contactId, organizationId },
    orderBy: { sentAt: 'desc' },
    take: 10,
    select: { text: true, direction: true, sentAt: true },
  })

  const conversationContext = recentMessages
    .reverse()
    .map(m => `[${m.direction === 'INBOUND' ? 'Lead' : 'Vendedor'}]: ${m.text}`)
    .join('\n')

  // Call LLM to qualify
  const ragContext = action.input?.ragContext || ''
  const llmResponse = await callLLM([
    {
      role: 'system' as const,
      content: injectRagContext(`Você é um analista de vendas B2B. Analise a conversa e qualifique o lead usando critérios BANT.
Responda APENAS em JSON válido com esta estrutura:
{
  "qualification": "HOT" | "WARM" | "COLD",
  "score": 0-100,
  "reasoning": "explicação curta",
  "suggestedDealTitle": "título sugerido para o deal",
  "suggestedDealValue": 0,
  "nextAction": "ação recomendada"
}`, ragContext),
    },
    {
      role: 'user' as const,
      content: `Conversa com ${contactName}:\n${conversationContext}\n\nÚltima mensagem: "${messageText}"`,
    },
  ], 'PRO')

  let qualification: any
  try {
    const cleaned = llmResponse.content.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
    qualification = JSON.parse(cleaned)
  } catch {
    qualification = {
      qualification: 'WARM',
      score: 50,
      reasoning: llmResponse.content.substring(0, 200),
      suggestedDealTitle: `Oportunidade - ${contactName}`,
      suggestedDealValue: 0,
      nextAction: 'Continuar conversa',
    }
  }

  // Find default pipeline + first stage
  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId },
    include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
  })

  let dealId: string | null = null

  if (pipeline && pipeline.stages.length > 0) {
    const deal = await prisma.deal.create({
      data: {
        organizationId,
        userId,
        contactId,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        title: qualification.suggestedDealTitle || `Oportunidade - ${contactName}`,
        value: qualification.suggestedDealValue || 0,
        status: 'ACTIVE',
      },
    })
    dealId = deal.id

    logger.info({ dealId, contactId, qualification: qualification.qualification }, '[AgaaS:LeadQualifier] Deal created')
  }

  // Delegate to MeetingScheduler if next action suggests a meeting
  if (qualification.nextAction?.toLowerCase().includes('reuni') || qualification.nextAction?.toLowerCase().includes('agendar')) {
    const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { name: true, phone: true } })
    if (contact?.phone) {
      await prisma.agentAction.create({
        data: {
          organizationId,
          agentName: 'MeetingScheduler',
          actionType: 'SCHEDULE_MEETING',
          entityType: 'Contact',
          entityId: contactId,
          reasoning: `LeadQualifier sugeriu: "${qualification.nextAction}". Propor horários de reunião.`,
          confidence: 0.7,
          input: { contactId, contactName: contact.name, contactPhone: contact.phone, context: qualification.nextAction, trigger: 'agent.delegation' },
          status: 'NEEDS_APPROVAL',
        },
      }).catch(() => {})
    }
  }

  return {
    success: true,
    output: {
      qualification: qualification.qualification,
      score: qualification.score,
      reasoning: qualification.reasoning,
      nextAction: qualification.nextAction,
      dealId,
      dealTitle: qualification.suggestedDealTitle,
    },
  }
}

/**
 * DealStageAnalyzer: Analyze conversation and suggest/move deal stage.
 */
async function executeDealStageAnalyzer(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, entityId: dealId, input } = action
  const messageText = input?.messageText || ''
  const contactId = input?.contactId

  // Load deal with pipeline stages
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      stage: true,
      pipeline: {
        include: { stages: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!deal) {
    return { success: false, output: { error: 'Deal not found' } }
  }

  // Get recent messages
  const recentMessages = contactId
    ? await prismaWa.whatsAppMessage.findMany({
        where: { contactId, organizationId },
        orderBy: { sentAt: 'desc' },
        take: 10,
        select: { text: true, direction: true },
      })
    : []

  const conversationContext = recentMessages
    .reverse()
    .map(m => `[${m.direction === 'INBOUND' ? 'Lead' : 'Vendedor'}]: ${m.text}`)
    .join('\n')

  const stageNames = deal.pipeline.stages.map((s, i) => `${i + 1}. ${s.name}`).join('\n')
  const ragContext = action.input?.ragContext || ''

  const llmResponse = await callLLM([
    {
      role: 'system' as const,
      content: injectRagContext(`Você é um analista de pipeline de vendas B2B. Analise a conversa e determine se o deal deve avançar de estágio.

Estágios do pipeline (em ordem):
${stageNames}

Estágio atual: "${deal.stage.name}"

Responda APENAS em JSON válido:
{
  "shouldMove": true | false,
  "suggestedStage": "nome do estágio sugerido",
  "reasoning": "por que mover ou manter",
  "buyingSignals": ["sinal 1", "sinal 2"],
  "confidence": 0-100
}`, ragContext),
    },
    {
      role: 'user' as const,
      content: `Deal: "${deal.title}"\nConversa recente:\n${conversationContext}\n\nÚltima mensagem: "${messageText}"`,
    },
  ], 'PRO')

  let analysis: any
  try {
    const cleaned = llmResponse.content.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
    analysis = JSON.parse(cleaned)
  } catch {
    analysis = {
      shouldMove: false,
      suggestedStage: deal.stage.name,
      reasoning: llmResponse.content.substring(0, 200),
      buyingSignals: [],
      confidence: 30,
    }
  }

  let movedTo: string | null = null

  // Move stage if LLM suggests and confidence is reasonable
  if (analysis.shouldMove && analysis.suggestedStage) {
    const targetStage = deal.pipeline.stages.find(
      s => s.name.toLowerCase() === analysis.suggestedStage.toLowerCase()
    )

    if (targetStage && targetStage.id !== deal.stageId) {
      await prisma.deal.update({
        where: { id: dealId },
        data: { stageId: targetStage.id },
      })
      movedTo = targetStage.name

      logger.info({ dealId, from: deal.stage.name, to: movedTo }, '[AgaaS:DealStageAnalyzer] Deal stage moved')
    }
  }

  return {
    success: true,
    output: {
      shouldMove: analysis.shouldMove,
      previousStage: deal.stage.name,
      movedTo,
      reasoning: analysis.reasoning,
      buyingSignals: analysis.buyingSignals,
      confidence: analysis.confidence,
    },
  }
}

/**
 * FollowUpCoordinator: Generate a personalized follow-up message and send via WABA.
 */
async function executeFollowUpCoordinator(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, input } = action
  const { contactId, dealId, dealTitle, idleDays } = input

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, name: true, phone: true },
  })

  if (!contact?.phone) {
    return { success: false, output: { error: 'Contact not found or has no phone' } }
  }

  // Meta rule: free-form messages only allowed within 24h of last inbound message
  const windowOpen = await isWithin24hWindow(contactId, organizationId)
  if (!windowOpen) {
    return {
      success: false,
      output: { error: 'Meta 24h window closed — contact must send a message first before free-form text can be sent', contactId },
    }
  }

  const recentMessages = await prismaWa.whatsAppMessage.findMany({
    where: { contactId, organizationId },
    orderBy: { sentAt: 'desc' },
    take: 10,
    select: { text: true, direction: true, sentAt: true },
  })

  const conversationContext = recentMessages
    .reverse()
    .map(m => `[${m.direction === 'INBOUND' ? contact.name || 'Lead' : 'Vendedor'}]: ${m.text}`)
    .join('\n')

  const ragContext = action.input?.ragContext || ''
  const llmResponse = await callLLM([
    {
      role: 'system' as const,
      content: injectRagContext(`Você é um vendedor B2B experiente. Escreva uma mensagem de follow-up natural, curta (máx 3 linhas) e personalizada para retomar o contato com um prospect.
Não use templates genéricos. Baseie-se no contexto da conversa.
Responda APENAS com o texto da mensagem, sem aspas, sem explicações.`, ragContext),
    },
    {
      role: 'user' as const,
      content: `Prospect: ${contact.name || contact.phone}
Deal: "${dealTitle}"
Dias sem contato: ${idleDays}
Última conversa:\n${conversationContext || 'Sem histórico de conversa.'}`,
    },
  ], 'PRO')

  const message = llmResponse.content.trim()

  // Send via WABA
  const client = await getWhatsAppOfficialClient(organizationId)
  if (!client) {
    return { success: false, output: { error: 'WABA not configured', message } }
  }

  await client.sendTextMessage(normalizePhone(contact.phone), message)

  // Save to WA DB
  const msgId = `agaas_followup_${Date.now()}`
  await prismaWa.$executeRaw`
    INSERT INTO "WhatsAppMessage"
      (id, "contactId", "organizationId", "connectionId", "remoteJid",
       "messageId", text, direction, status, "sentAt", "isRead",
       "mediaType", "mediaUrl", "replyToId", "replyToText")
    VALUES (
      ${msgId}, ${contactId}, ${organizationId}, ${null},
      ${normalizePhone(contact.phone)}, ${null},
      ${message}, 'OUTBOUND', 'SENT', ${new Date()}, true,
      ${null}, ${null}, ${null}, ${null}
    )
    ON CONFLICT ("organizationId", "messageId") DO NOTHING
  `

  logger.info({ organizationId, contactId, dealId }, '[AgaaS:FollowUpCoordinator] Follow-up sent')

  return {
    success: true,
    output: { message, contactName: contact.name, dealTitle, idleDays },
  }
}

/**
 * MeetingScheduler: Check Google Calendar availability and propose meeting slots via WABA.
 */
async function executeMeetingScheduler(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, input } = action
  const { contactId, contactName, contactPhone, context } = input

  const calendarClient = await getGoogleCalendarClient(organizationId)
  if (!calendarClient) {
    return { success: false, output: { error: 'Google Calendar not configured for this organization' } }
  }

  // Get next 7 days of events to find free slots
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const events = await calendarClient.listEvents({
    timeMin: now.toISOString(),
    timeMax: weekLater.toISOString(),
    maxResults: 50,
  })

  // Build busy intervals
  const busySlots = events.map((e: any) => ({
    start: new Date(e.start?.dateTime || e.start?.date),
    end: new Date(e.end?.dateTime || e.end?.date),
  }))

  // Generate candidate slots: weekdays 9-18h, 1h blocks
  const candidates: Array<{ start: Date; end: Date; label: string }> = []
  const d = new Date(now)
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)

  while (candidates.length < 6 && d < weekLater) {
    const day = d.getDay()
    const hour = d.getHours()
    if (day !== 0 && day !== 6 && hour >= 9 && hour < 17) {
      const end = new Date(d.getTime() + 60 * 60 * 1000)
      const isBusy = busySlots.some(b => d < b.end && end > b.start)
      if (!isBusy) {
        const label = d.toLocaleString('pt-BR', {
          weekday: 'short', day: '2-digit', month: '2-digit',
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
        })
        candidates.push({ start: new Date(d), end, label })
      }
    }
    d.setHours(d.getHours() + 1)
  }

  if (candidates.length === 0) {
    return { success: false, output: { error: 'No free slots found in the next 7 days' } }
  }

  const slotLines = candidates.map((s, i) => `${i + 1}. ${s.label}`).join('\n')

  const ragContext = action.input?.ragContext || ''
  const llmResponse = await callLLM([
    {
      role: 'system' as const,
      content: injectRagContext(`Você é um assistente de vendas. Escreva uma mensagem curta e profissional propondo horários de reunião para um prospect. Use os horários disponíveis fornecidos. Máx 5 linhas. Responda APENAS com o texto da mensagem.`, ragContext),
    },
    {
      role: 'user' as const,
      content: `Prospect: ${contactName || contactPhone}
Contexto: ${context || 'Agendamento de reunião de apresentação'}
Horários disponíveis:\n${slotLines}`,
    },
  ], 'PRO')

  const message = llmResponse.content.trim()

  const phone = contactPhone || (await prisma.contact.findUnique({
    where: { id: contactId },
    select: { phone: true },
  }))?.phone

  if (!phone) {
    return { success: false, output: { error: 'Contact phone not found', message, slots: candidates.map(s => s.label) } }
  }

  // Meta rule: free-form messages only allowed within 24h of last inbound message
  const windowOpen = await isWithin24hWindow(contactId, organizationId)
  if (!windowOpen) {
    return {
      success: false,
      output: { error: 'Meta 24h window closed — contact must send a message first before meeting proposal can be sent', slots: candidates.map(s => s.label) },
    }
  }

  const wabaClient = await getWhatsAppOfficialClient(organizationId)
  if (!wabaClient) {
    return { success: false, output: { error: 'WABA not configured', message, slots: candidates.map(s => s.label) } }
  }

  await wabaClient.sendTextMessage(normalizePhone(typeof phone === 'string' ? phone : ''), message)

  const msgId = `agaas_meeting_${Date.now()}`
  await prismaWa.$executeRaw`
    INSERT INTO "WhatsAppMessage"
      (id, "contactId", "organizationId", "connectionId", "remoteJid",
       "messageId", text, direction, status, "sentAt", "isRead",
       "mediaType", "mediaUrl", "replyToId", "replyToText")
    VALUES (
      ${msgId}, ${contactId}, ${organizationId}, ${null},
      ${normalizePhone(typeof phone === 'string' ? phone : '')}, ${null},
      ${message}, 'OUTBOUND', 'SENT', ${new Date()}, true,
      ${null}, ${null}, ${null}, ${null}
    )
    ON CONFLICT ("organizationId", "messageId") DO NOTHING
  `

  logger.info({ organizationId, contactId, slots: candidates.length }, '[AgaaS:MeetingScheduler] Meeting proposal sent')

  return {
    success: true,
    output: { message, slots: candidates.map(s => s.label), slotsCount: candidates.length },
  }
}

/**
 * ContactEnricher: Search web for contact info and update CRM record.
 */
async function executeContactEnricher(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, entityId: contactId, input } = action
  const { contactName, contactPhone, contactEmail } = input

  if (!contactName || contactName.length < 3) {
    return { success: false, output: { error: 'Contact name too short to enrich' } }
  }

  const ragContext = action.input?.ragContext || ''
  const llmResponse = await callLLM([
    {
      role: 'system' as const,
      content: injectRagContext(`Você é um analista de inteligência comercial. Com base no nome, telefone e email fornecidos, infira o perfil profissional mais provável deste contato.
Se o nome for genérico ou insuficiente, retorne campos vazios.
Responda APENAS em JSON válido:
{
  "jobTitle": "cargo inferido ou vazio",
  "company": "empresa inferida ou vazio",
  "industry": "setor inferido ou vazio",
  "linkedinUrl": "url do linkedin se puder inferir ou vazio",
  "notes": "insights úteis para o vendedor (max 2 frases)",
  "confidence": 0-100
}`, ragContext),
    },
    {
      role: 'user' as const,
      content: `Nome: ${contactName}
Telefone: ${contactPhone || 'não informado'}
Email: ${contactEmail || 'não informado'}`,
    },
  ], 'PRO')

  let enriched: any
  try {
    const cleaned = llmResponse.content.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
    enriched = JSON.parse(cleaned)
  } catch {
    return { success: false, output: { error: 'Failed to parse LLM enrichment response' } }
  }

  if (enriched.confidence < 30) {
    return { success: false, output: { error: 'Confidence too low to update contact', confidence: enriched.confidence } }
  }

  // Build update — only set fields that exist in the Contact model
  const updateData: Record<string, string> = {}
  if (enriched.company) updateData.company = enriched.company

  if (Object.keys(updateData).length > 0) {
    await prisma.contact.update({
      where: { id: contactId },
      data: updateData,
    })
  }

  logger.info({ organizationId, contactId, confidence: enriched.confidence }, '[AgaaS:ContactEnricher] Contact enriched')

  return {
    success: true,
    output: {
      jobTitle: enriched.jobTitle,
      company: enriched.company,
      industry: enriched.industry,
      linkedinUrl: enriched.linkedinUrl,
      notes: enriched.notes,
      confidence: enriched.confidence,
      fieldsUpdated: Object.keys(updateData),
    },
  }
}

// ─── Real Estate Vertical ─────────────────────────────────────────────────────

/**
 * PropertyMatcher: Extract search criteria from conversation and suggest matching deals/properties.
 */
async function executePropertyMatcher(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, entityId: contactId, input } = action
  const systemPromptOverride = input?.systemPromptOverride as string | undefined

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, name: true, phone: true },
  })
  if (!contact?.phone) {
    return { success: false, output: { error: 'Contact not found or has no phone' } }
  }

  const windowOpen = await isWithin24hWindow(contactId, organizationId)
  if (!windowOpen) {
    return { success: false, output: { error: 'Meta 24h window closed' } }
  }

  const recentMessages = await prismaWa.whatsAppMessage.findMany({
    where: { contactId, organizationId },
    orderBy: { sentAt: 'desc' },
    take: 15,
    select: { text: true, direction: true },
  })

  const conversationContext = recentMessages
    .reverse()
    .map(m => `[${m.direction === 'INBOUND' ? 'Cliente' : 'Corretor'}]: ${m.text}`)
    .join('\n')

  // Fetch portfolio deals to match against
  const portfolioDeals = await prisma.deal.findMany({
    where: { organizationId, status: 'ACTIVE' },
    select: { id: true, title: true, value: true },
    take: 20,
    orderBy: { updatedAt: 'desc' },
  })

  const portfolioList = portfolioDeals.map(d => `- ${d.title} (R$ ${Number(d.value).toLocaleString('pt-BR')})`).join('\n')

  const defaultPrompt = `Você é um corretor de imóveis experiente. Analise a conversa e extraia os critérios de busca do cliente (tipo de imóvel, bairro, dormitórios, faixa de preço, objetivo: compra/aluguel). Compare com o portfólio disponível e sugira os 2-3 imóveis mais compatíveis. Escreva uma mensagem natural e personalizada para o cliente. Máx 6 linhas. Responda APENAS com o texto da mensagem.`
  const ragContext = action.input?.ragContext || ''

  const llmResponse = await callLLM([
    { role: 'system' as const, content: injectRagContext(systemPromptOverride || defaultPrompt, ragContext) },
    {
      role: 'user' as const,
      content: `Conversa com ${contact.name || contact.phone}:\n${conversationContext}\n\nPortfólio disponível:\n${portfolioList || 'Nenhum imóvel cadastrado ainda.'}`,
    },
  ], 'PRO')

  const message = llmResponse.content.trim()

  const wabaClient = await getWhatsAppOfficialClient(organizationId)
  if (!wabaClient) {
    return { success: false, output: { error: 'WABA not configured', message } }
  }

  await wabaClient.sendTextMessage(normalizePhone(contact.phone), message)

  const msgId = `agaas_propmatch_${Date.now()}`
  await prismaWa.$executeRaw`
    INSERT INTO "WhatsAppMessage"
      (id, "contactId", "organizationId", "connectionId", "remoteJid",
       "messageId", text, direction, status, "sentAt", "isRead",
       "mediaType", "mediaUrl", "replyToId", "replyToText")
    VALUES (
      ${msgId}, ${contactId}, ${organizationId}, ${null},
      ${normalizePhone(contact.phone)}, ${null},
      ${message}, 'OUTBOUND', 'SENT', ${new Date()}, true,
      ${null}, ${null}, ${null}, ${null}
    )
    ON CONFLICT ("organizationId", "messageId") DO NOTHING
  `

  logger.info({ organizationId, contactId, portfolioCount: portfolioDeals.length }, '[AgaaS:PropertyMatcher] Suggestions sent')

  return { success: true, output: { message, portfolioMatched: portfolioDeals.length } }
}

/**
 * VisitScheduler: Detect visit intent and offer calendar slots via WABA.
 */
async function executeVisitScheduler(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, entityId: contactId, input } = action
  const systemPromptOverride = input?.systemPromptOverride as string | undefined

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, name: true, phone: true },
  })
  if (!contact?.phone) {
    return { success: false, output: { error: 'Contact not found or has no phone' } }
  }

  const windowOpen = await isWithin24hWindow(contactId, organizationId)
  if (!windowOpen) {
    return { success: false, output: { error: 'Meta 24h window closed' } }
  }

  // Try to get calendar slots
  let slotLines = ''
  try {
    const calendarClient = await getGoogleCalendarClient(organizationId)
    if (calendarClient) {
      const now = new Date()
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const events = await calendarClient.listEvents({ timeMin: now.toISOString(), timeMax: weekLater.toISOString(), maxResults: 50 })
      const busy = events.map((e: any) => ({ start: new Date(e.start?.dateTime || e.start?.date), end: new Date(e.end?.dateTime || e.end?.date) }))
      const candidates: string[] = []
      const d = new Date(now)
      d.setMinutes(0, 0, 0)
      d.setHours(d.getHours() + 1)
      while (candidates.length < 3 && d < weekLater) {
        const day = d.getDay()
        const hour = d.getHours()
        if (day !== 0 && day !== 6 && hour >= 9 && hour < 17) {
          const end = new Date(d.getTime() + 60 * 60 * 1000)
          const isBusy = busy.some((b: any) => d < b.end && end > b.start)
          if (!isBusy) {
            candidates.push(d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }))
          }
        }
        d.setHours(d.getHours() + 1)
      }
      slotLines = candidates.map((s, i) => `${i + 1}. ${s}`).join('\n')
    }
  } catch {}

  const defaultPrompt = `Você é um corretor de imóveis. O cliente demonstrou interesse em visitar um imóvel. Proponha horários para visita de forma simpática e profissional. Se houver horários disponíveis, use-os. Máx 5 linhas. Responda APENAS com o texto da mensagem.`
  const ragContext = action.input?.ragContext || ''

  const llmResponse = await callLLM([
    { role: 'system' as const, content: injectRagContext(systemPromptOverride || defaultPrompt, ragContext) },
    {
      role: 'user' as const,
      content: `Cliente: ${contact.name || contact.phone}\n${slotLines ? `Horários disponíveis:\n${slotLines}` : 'Sem horários de agenda disponíveis — ofereça para combinar por mensagem.'}`,
    },
  ], 'PRO')

  const message = llmResponse.content.trim()

  const wabaClient = await getWhatsAppOfficialClient(organizationId)
  if (!wabaClient) {
    return { success: false, output: { error: 'WABA not configured', message } }
  }

  await wabaClient.sendTextMessage(normalizePhone(contact.phone), message)

  const msgId = `agaas_visit_${Date.now()}`
  await prismaWa.$executeRaw`
    INSERT INTO "WhatsAppMessage"
      (id, "contactId", "organizationId", "connectionId", "remoteJid",
       "messageId", text, direction, status, "sentAt", "isRead",
       "mediaType", "mediaUrl", "replyToId", "replyToText")
    VALUES (
      ${msgId}, ${contactId}, ${organizationId}, ${null},
      ${normalizePhone(contact.phone)}, ${null},
      ${message}, 'OUTBOUND', 'SENT', ${new Date()}, true,
      ${null}, ${null}, ${null}, ${null}
    )
    ON CONFLICT ("organizationId", "messageId") DO NOTHING
  `

  logger.info({ organizationId, contactId }, '[AgaaS:VisitScheduler] Visit proposal sent')

  return { success: true, output: { message, slotsOffered: slotLines } }
}

/**
 * ProposalFollowUp: Follow up on stalled deals in proposal stage. Always NEEDS_APPROVAL.
 */
async function executeProposalFollowUp(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, input } = action
  const { contactId, dealId, dealTitle, idleDays } = input
  const systemPromptOverride = input?.systemPromptOverride as string | undefined

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, name: true, phone: true },
  })
  if (!contact?.phone) {
    return { success: false, output: { error: 'Contact not found or has no phone' } }
  }

  const recentMessages = await prismaWa.whatsAppMessage.findMany({
    where: { contactId, organizationId },
    orderBy: { sentAt: 'desc' },
    take: 8,
    select: { text: true, direction: true },
  })

  const conversationContext = recentMessages
    .reverse()
    .map(m => `[${m.direction === 'INBOUND' ? contact.name || 'Cliente' : 'Corretor'}]: ${m.text}`)
    .join('\n')

  const defaultPrompt = `Você é um corretor de imóveis. Escreva um follow-up elegante e não insistente para retomar contato com um cliente que está avaliando uma proposta. Seja natural, curto (máx 3 linhas) e personalize com base na conversa. Responda APENAS com o texto da mensagem.`
  const ragContext = action.input?.ragContext || ''

  const llmResponse = await callLLM([
    { role: 'system' as const, content: injectRagContext(systemPromptOverride || defaultPrompt, ragContext) },
    {
      role: 'user' as const,
      content: `Cliente: ${contact.name || contact.phone}\nDeal: "${dealTitle}"\nDias sem resposta: ${idleDays}\nÚltima conversa:\n${conversationContext || 'Sem histórico.'}`,
    },
  ], 'PRO')

  const message = llmResponse.content.trim()

  logger.info({ organizationId, contactId, dealId, idleDays }, '[AgaaS:ProposalFollowUp] Draft generated (NEEDS_APPROVAL)')

  // Never auto-send — always returns draft for human review
  return {
    success: true,
    output: { message, contactName: contact.name, dealTitle, idleDays, requiresApproval: true },
  }
}

/**
 * LeadProfiler: Classify lead as COMPRADOR/VENDEDOR/LOCATARIO/INVESTIDOR.
 */
async function executeLeadProfiler(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, entityId: contactId, input } = action
  const systemPromptOverride = input?.systemPromptOverride as string | undefined

  const recentMessages = await prismaWa.whatsAppMessage.findMany({
    where: { contactId, organizationId },
    orderBy: { sentAt: 'desc' },
    take: 20,
    select: { text: true, direction: true },
  })

  if (recentMessages.length === 0) {
    return { success: false, output: { error: 'No messages to analyze' } }
  }

  const conversationContext = recentMessages
    .reverse()
    .map(m => `[${m.direction === 'INBOUND' ? 'Cliente' : 'Corretor'}]: ${m.text}`)
    .join('\n')

  const defaultPrompt = `Você é um especialista em perfil de clientes imobiliários. Analise a conversa e classifique o lead.
Responda APENAS em JSON válido:
{
  "profile": "COMPRADOR" | "VENDEDOR" | "LOCATARIO" | "INVESTIDOR",
  "confidence": 0-100,
  "reasoning": "justificativa curta",
  "profileNotes": "detalhes úteis para o corretor (max 2 frases)"
}`
  const ragContext = action.input?.ragContext || ''

  const llmResponse = await callLLM([
    { role: 'system' as const, content: injectRagContext(systemPromptOverride || defaultPrompt, ragContext) },
    { role: 'user' as const, content: `Conversa:\n${conversationContext}` },
  ], 'PRO')

  let result: any
  try {
    const cleaned = llmResponse.content.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
    result = JSON.parse(cleaned)
  } catch {
    return { success: false, output: { error: 'Failed to parse LLM response' } }
  }

  if (result.confidence < 40) {
    return { success: false, output: { error: 'Confidence too low', confidence: result.confidence } }
  }

  // Store profile in contact.company field (repurposed as type-of-lead in RE vertical)
  await prisma.contact.update({
    where: { id: contactId },
    data: { company: `[${result.profile}] ${result.profileNotes || ''}`.trim() },
  })

  logger.info({ organizationId, contactId, profile: result.profile, confidence: result.confidence }, '[AgaaS:LeadProfiler] Profile saved')

  return {
    success: true,
    output: { profile: result.profile, confidence: result.confidence, reasoning: result.reasoning, profileNotes: result.profileNotes },
  }
}

/**
 * NegotiationAssistant: Detect price objections and suggest counter-proposals. Always NEEDS_APPROVAL.
 */
async function executeNegotiationAssistant(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  const { organizationId, entityId: contactId, input } = action
  const systemPromptOverride = input?.systemPromptOverride as string | undefined

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, name: true, phone: true },
  })

  const recentMessages = await prismaWa.whatsAppMessage.findMany({
    where: { contactId, organizationId },
    orderBy: { sentAt: 'desc' },
    take: 10,
    select: { text: true, direction: true },
  })

  const conversationContext = recentMessages
    .reverse()
    .map(m => `[${m.direction === 'INBOUND' ? 'Cliente' : 'Corretor'}]: ${m.text}`)
    .join('\n')

  const defaultPrompt = `Você é um especialista em negociação imobiliária. Analise a objeção de preço/condição do cliente e sugira uma contra-proposta respeitosa e estratégica. Não faça concessões precipitadas. Escreva uma mensagem natural de resposta (máx 4 linhas). Responda APENAS com o texto da mensagem.`
  const ragContext = action.input?.ragContext || ''

  const llmResponse = await callLLM([
    { role: 'system' as const, content: injectRagContext(systemPromptOverride || defaultPrompt, ragContext) },
    {
      role: 'user' as const,
      content: `Cliente: ${contact?.name || 'Lead'}\nConversa:\n${conversationContext}\nÚltima mensagem de objeção: "${input?.messageText || ''}"`,
    },
  ], 'PRO')

  const message = llmResponse.content.trim()

  logger.info({ organizationId, contactId }, '[AgaaS:NegotiationAssistant] Counter-proposal drafted (NEEDS_APPROVAL)')

  // Confidence is fixed at 0.6 — always goes to NEEDS_APPROVAL
  return {
    success: true,
    output: { message, contactName: contact?.name, requiresApproval: true },
  }
}
