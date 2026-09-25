/**
 * AgaaS Agent Executor
 *
 * Two modes (spec 011):
 * - `rascunho` (draft): calls the LLM and returns the proposal. No side effect: nothing is sent, nothing is saved.
 *   The trigger stores it in `AgentAction.output.rascunho` so the human sees what will happen before approving.
 * - `aplicar` (apply): runs after a human approves. Uses the stored draft (or generates one) and performs the action.
 *
 * Every action is bound to its organization: the entity and any contact/deal in the input are loaded by
 * (id, organizationId) before anything else, and an id from another organization fails the action.
 * Profile and company suggestions never overwrite what a person typed: they stay in the action output.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { callLLM } from '@/lib/agi/providers'
import { getWhatsAppOfficialClient, normalizePhone } from '@/lib/integrations/whatsapp-official-client'
import { getGoogleCalendarClient } from '@/lib/integrations/google-calendar-client'
import { retrieveContext } from '@/lib/rag/retrieval'
import logger from '@/lib/logger'

export type ModoExecucao = 'rascunho' | 'aplicar'

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
  /** Who approved (apply mode); empty when the trigger is drafting */
  userId: string
  /** Stored output; `output.rascunho` is the draft made when the action was created */
  output?: any
}

type Resultado = { success: boolean; output: Record<string, any> }

const contatoSelect = { id: true, name: true, phone: true, email: true, company: true, assignedToId: true } as const
type Contato = Prisma.ContactGetPayload<{ select: typeof contatoSelect }>
const negocioInclude = { stage: true, pipeline: { include: { stages: { orderBy: { order: 'asc' as const } } } } } as const
type Negocio = Prisma.DealGetPayload<{ include: typeof negocioInclude }>

type Contexto = {
  modo: ModoExecucao
  rascunho: Record<string, any> | null
  ragContext: string
  contato: Contato | null
  negocio: Negocio | null
}

const ok = (output: Record<string, any>): Resultado => ({ success: true, output })
const falha = (error: string, extra: Record<string, any> = {}): Resultado => ({ success: false, output: { error, ...extra } })

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

function injectRagContext(basePrompt: string, ragContext: string): string {
  if (!ragContext) return basePrompt
  return `${basePrompt}\n\nBASE DE CONHECIMENTO RELEVANTE:\n---\n${ragContext}\n---`
}

const parseJson = (texto: string) => JSON.parse(texto.replace(/```json?\s*/g, '').replace(/```/g, '').trim())

/** Owner of what the AI creates: the contact's assignee, else the account's oldest owner (spec 011, FR-010). */
async function donoDaConta(tx: Prisma.TransactionClient, organizationId: string, contato: Contato | null): Promise<string> {
  if (contato?.assignedToId) return contato.assignedToId
  const dono =
    (await tx.user.findFirst({ where: { organizationId, orgRole: 'OWNER' }, orderBy: { createdAt: 'asc' }, select: { id: true } })) ??
    (await tx.user.findFirst({ where: { organizationId }, orderBy: { createdAt: 'asc' }, select: { id: true } }))
  if (!dono) throw new Error('Organization has no user to own the deal')
  return dono.id
}

/** Loads the action's entity and the contact/deal it names, always inside the action's organization. */
async function carregarAlvo(action: AgentAction): Promise<{ contato: Contato | null; negocio: Negocio | null } | { erro: string }> {
  if (action.entityType !== 'Contact' && action.entityType !== 'Deal') return { erro: `Unsupported entity type: ${action.entityType}` }
  const organizationId = action.organizationId
  const contactId = action.entityType === 'Contact' ? action.entityId : action.input?.contactId
  const dealId = action.entityType === 'Deal' ? action.entityId : action.input?.dealId

  const contato = contactId
    ? await prisma.contact.findFirst({ where: { id: String(contactId), organizationId }, select: contatoSelect })
    : null
  if (contactId && !contato) return { erro: 'Contact not found in this organization' }

  const negocio = dealId
    ? await prisma.deal.findFirst({ where: { id: String(dealId), organizationId }, include: negocioInclude })
    : null
  if (dealId && !negocio) return { erro: 'Deal not found in this organization' }

  return { contato, negocio }
}

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

const AGENTES: Record<string, (action: AgentAction, ctx: Contexto) => Promise<Resultado>> = {
  LeadQualifier: executeLeadQualifier,
  DealStageAnalyzer: executeDealStageAnalyzer,
  FollowUpCoordinator: executeFollowUpCoordinator,
  MeetingScheduler: executeMeetingScheduler,
  ContactEnricher: executeContactEnricher,
  PropertyMatcher: executePropertyMatcher,
  VisitScheduler: executeVisitScheduler,
  ProposalFollowUp: executeProposalFollowUp,
  LeadProfiler: executeLeadProfiler,
  NegotiationAssistant: executeNegotiationAssistant,
}

/**
 * Drafts (`rascunho`) or applies (`aplicar`, after human approval) an agent action.
 */
export async function executeAgentAction(action: AgentAction, modo: ModoExecucao = 'aplicar'): Promise<Resultado> {
  const agente = AGENTES[action.agentName]
  if (!agente) return falha(`Unknown agent: ${action.agentName}`)

  const alvo = await carregarAlvo(action)
  if ('erro' in alvo) return falha(alvo.erro)

  const rascunho = modo === 'aplicar' && action.output?.rascunho ? (action.output.rascunho as Record<string, any>) : null
  // RAG context only matters when the LLM is going to write something
  const ragContext = rascunho
    ? ''
    : await retrieveContext(
        action.organizationId,
        action.input?.messageText || action.input?.context || action.actionType,
        AGENT_NAME_TO_ID[action.agentName],
        3,
      ).catch(() => '')

  return agente(action, { modo, rascunho, ragContext, ...alvo })
}

async function historicoDaConversa(contactId: string, organizationId: string, take: number, rotulos: [string, string]) {
  const recentes = await prismaWa.whatsAppMessage.findMany({
    where: { contactId, organizationId },
    orderBy: { sentAt: 'desc' },
    take,
    select: { text: true, direction: true },
  })
  return recentes
    .reverse()
    .map((m) => `[${m.direction === 'INBOUND' ? rotulos[0] : rotulos[1]}]: ${m.text}`)
    .join('\n')
}

/** Sends the approved text through the account's WhatsApp (Cloud API) and records it in the chat. */
async function enviarPeloWhatsApp(organizationId: string, contato: Contato, texto: string, prefixo: string): Promise<string | null> {
  if (!contato.phone) return 'Contact has no phone'
  if (!(await isWithin24hWindow(contato.id, organizationId))) {
    return 'Meta 24h window closed — contact must send a message first before free-form text can be sent'
  }
  const client = await getWhatsAppOfficialClient(organizationId)
  if (!client) return 'WABA not configured'

  const telefone = normalizePhone(contato.phone)
  await client.sendTextMessage(telefone, texto)
  await prismaWa.$executeRaw`
    INSERT INTO "WhatsAppMessage"
      (id, "contactId", "organizationId", "connectionId", "remoteJid",
       "messageId", text, direction, status, "sentAt", "isRead",
       "mediaType", "mediaUrl", "replyToId", "replyToText")
    VALUES (
      ${`agaas_${prefixo}_${Date.now()}`}, ${contato.id}, ${organizationId}, ${null},
      ${telefone}, ${null},
      ${texto}, 'OUTBOUND', 'SENT', ${new Date()}, true,
      ${null}, ${null}, ${null}, ${null}
    )
    ON CONFLICT ("organizationId", "messageId") DO NOTHING
  `
  return null
}

/** Message agents: draft the text; on approval, send exactly the approved draft. */
async function mensagemAprovada(
  action: AgentAction,
  ctx: Contexto,
  prefixo: string,
  gerar: (contato: Contato) => Promise<Record<string, any>>,
): Promise<Resultado> {
  const contato = ctx.contato
  if (!contato?.phone) return falha('Contact not found or has no phone')
  const rascunho = ctx.rascunho ?? (await gerar(contato))
  if (ctx.modo === 'rascunho') return ok(rascunho)
  if (!rascunho.message) return falha('Draft has no message', rascunho)

  const erro = await enviarPeloWhatsApp(action.organizationId, contato, String(rascunho.message), prefixo)
  if (erro) return falha(erro, rascunho)
  logger.info({ organizationId: action.organizationId, contactId: contato.id, agent: action.agentName }, '[AgaaS] Approved message sent')
  return ok({ ...rascunho, enviado: true })
}

/**
 * LeadQualifier: qualifies the lead; on approval opens one deal (never a second one for a contact with an open deal).
 */
async function executeLeadQualifier(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  const contato = ctx.contato
  if (!contato) return falha('LeadQualifier needs a contact')
  const contactName = contato.name || input?.contactName || 'Lead'

  let qualification = ctx.rascunho
  if (!qualification) {
    const conversationContext = await historicoDaConversa(contato.id, organizationId, 10, ['Lead', 'Vendedor'])
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
}`, ctx.ragContext),
      },
      {
        role: 'user' as const,
        content: `Conversa com ${contactName}:\n${conversationContext}\n\nÚltima mensagem: "${input?.messageText || ''}"`,
      },
    ], 'PRO')

    try {
      qualification = parseJson(llmResponse.content)
    } catch {
      qualification = {
        qualification: 'WARM',
        score: 50,
        reasoning: llmResponse.content.substring(0, 200),
        suggestedDealTitle: `Oportunidade - ${contactName}`,
        suggestedDealValue: null,
        nextAction: 'Continuar conversa',
      }
    }
  }
  if (ctx.modo === 'rascunho') return ok(qualification!)

  const q = qualification!
  const valor = Number(q.suggestedDealValue) > 0 ? Number(q.suggestedDealValue) : null // no suggestion = no value, never 0
  const aberto = await prisma.$transaction(async (tx) => {
    // One AI deal per contact even if approvals race: serialize on the contact
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`negocio-ia:${contato.id}`}))`
    const existente = await tx.deal.findFirst({
      where: { organizationId, contactId: contato.id, status: 'ACTIVE', archived: false },
      select: { id: true },
    })
    if (existente) return { dealId: existente.id, jaExistia: true }

    const pipeline = await tx.pipeline.findFirst({
      where: { organizationId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
    })
    if (!pipeline?.stages[0]) return { dealId: null, jaExistia: false }

    // isolamento: contact, pipeline and stage were all loaded with this organizationId above
    const deal = await tx.deal.create({
      data: {
        organizationId,
        userId: await donoDaConta(tx, organizationId, contato),
        contactId: contato.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        title: q.suggestedDealTitle || `Oportunidade - ${contactName}`,
        value: valor,
        status: 'ACTIVE',
      },
    })
    return { dealId: deal.id, jaExistia: false }
  })

  logger.info({ organizationId, contactId: contato.id, ...aberto }, '[AgaaS:LeadQualifier] Approved')

  // A suggested meeting becomes another proposal for approval, never an automatic message
  const proxima = String(q.nextAction ?? '').toLowerCase()
  if (contato.phone && (proxima.includes('reuni') || proxima.includes('agendar'))) {
    await prisma.agentAction.create({
      data: {
        organizationId,
        agentName: 'MeetingScheduler',
        actionType: 'SCHEDULE_MEETING',
        entityType: 'Contact',
        entityId: contato.id,
        reasoning: `LeadQualifier sugeriu: "${q.nextAction}". Propor horários de reunião.`,
        confidence: 0.7,
        input: { contactId: contato.id, contactName: contato.name, context: q.nextAction, trigger: 'agent.delegation' },
        status: 'NEEDS_APPROVAL',
      },
    }).catch(() => {})
  }

  return ok({ ...q, ...aberto, dealTitle: q.suggestedDealTitle })
}

/**
 * DealStageAnalyzer: suggests a stage; on approval moves the deal and records the move with the approver.
 */
async function executeDealStageAnalyzer(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  const deal = ctx.negocio
  if (!deal) return falha('Deal not found in this organization')

  let analysis = ctx.rascunho
  if (!analysis) {
    const conversationContext = ctx.contato
      ? await historicoDaConversa(ctx.contato.id, organizationId, 10, ['Lead', 'Vendedor'])
      : ''
    const stageNames = deal.pipeline.stages.map((s, i) => `${i + 1}. ${s.name}`).join('\n')
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
}`, ctx.ragContext),
      },
      {
        role: 'user' as const,
        content: `Deal: "${deal.title}"\nConversa recente:\n${conversationContext}\n\nÚltima mensagem: "${input?.messageText || ''}"`,
      },
    ], 'PRO')

    try {
      analysis = parseJson(llmResponse.content)
    } catch {
      analysis = { shouldMove: false, suggestedStage: deal.stage.name, reasoning: llmResponse.content.substring(0, 200), buyingSignals: [], confidence: 30 }
    }
  }
  if (ctx.modo === 'rascunho') return ok({ ...analysis!, previousStage: deal.stage.name })

  const a = analysis!
  let movedTo: string | null = null
  const targetStage = a.shouldMove && a.suggestedStage
    ? deal.pipeline.stages.find((s) => s.name.toLowerCase() === String(a.suggestedStage).toLowerCase())
    : undefined

  if (targetStage && targetStage.id !== deal.stageId) {
    const autor = action.userId || (await donoDaConta(prisma, organizationId, ctx.contato))
    await prisma.$transaction([
      prisma.deal.update({ where: { id: deal.id, organizationId }, data: { stageId: targetStage.id } }),
      prisma.activity.create({
        data: {
          type: 'STAGE_CHANGE',
          description: `Moveu de "${deal.stage.name}" para "${targetStage.name}" (sugestão da IA aprovada)`,
          dealId: deal.id,
          userId: autor,
        },
      }),
    ])
    movedTo = targetStage.name
    logger.info({ dealId: deal.id, from: deal.stage.name, to: movedTo }, '[AgaaS:DealStageAnalyzer] Approved move')
  }

  return ok({ ...a, previousStage: deal.stage.name, movedTo })
}

/**
 * FollowUpCoordinator: drafts a follow-up; on approval sends that exact text.
 */
async function executeFollowUpCoordinator(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  return mensagemAprovada(action, ctx, 'followup', async (contato) => {
    const conversationContext = await historicoDaConversa(contato.id, organizationId, 10, [contato.name || 'Lead', 'Vendedor'])
    const llmResponse = await callLLM([
      {
        role: 'system' as const,
        content: injectRagContext(`Você é um vendedor B2B experiente. Escreva uma mensagem de follow-up natural, curta (máx 3 linhas) e personalizada para retomar o contato com um prospect.
Não use templates genéricos. Baseie-se no contexto da conversa.
Responda APENAS com o texto da mensagem, sem aspas, sem explicações.`, ctx.ragContext),
      },
      {
        role: 'user' as const,
        content: `Prospect: ${contato.name || contato.phone}
Deal: "${ctx.negocio?.title ?? input?.dealTitle ?? ''}"
Dias sem contato: ${input?.idleDays}
Última conversa:\n${conversationContext || 'Sem histórico de conversa.'}`,
      },
    ], 'PRO')
    return { message: llmResponse.content.trim(), contactName: contato.name, dealTitle: ctx.negocio?.title, idleDays: input?.idleDays }
  })
}

/** Free 1-hour slots on weekdays 9–17h over the next 7 days, from the account's Google Calendar. */
async function horariosLivres(organizationId: string, quantos: number): Promise<string[] | null> {
  const calendarClient = await getGoogleCalendarClient(organizationId)
  if (!calendarClient) return null
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const events = await calendarClient.listEvents({ timeMin: now.toISOString(), timeMax: weekLater.toISOString(), maxResults: 50 })
  const busy = events.map((e: any) => ({
    start: new Date(e.start?.dateTime || e.start?.date),
    end: new Date(e.end?.dateTime || e.end?.date),
  }))
  const livres: string[] = []
  const d = new Date(now)
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  while (livres.length < quantos && d < weekLater) {
    const day = d.getDay()
    const hour = d.getHours()
    if (day !== 0 && day !== 6 && hour >= 9 && hour < 17) {
      const end = new Date(d.getTime() + 60 * 60 * 1000)
      if (!busy.some((b: { start: Date; end: Date }) => d < b.end && end > b.start)) {
        livres.push(d.toLocaleString('pt-BR', {
          weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
        }))
      }
    }
    d.setHours(d.getHours() + 1)
  }
  return livres
}

/**
 * MeetingScheduler: drafts a message with free calendar slots; on approval sends it to the contact's own phone.
 */
async function executeMeetingScheduler(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  if (!ctx.rascunho && !(await getGoogleCalendarClient(organizationId))) {
    return falha('Google Calendar not configured for this organization')
  }
  return mensagemAprovada(action, ctx, 'meeting', async (contato) => {
    const slots = (await horariosLivres(organizationId, 6)) ?? []
    if (slots.length === 0) throw new Error('No free slots found in the next 7 days')
    const llmResponse = await callLLM([
      {
        role: 'system' as const,
        content: injectRagContext(`Você é um assistente de vendas. Escreva uma mensagem curta e profissional propondo horários de reunião para um prospect. Use os horários disponíveis fornecidos. Máx 5 linhas. Responda APENAS com o texto da mensagem.`, ctx.ragContext),
      },
      {
        role: 'user' as const,
        content: `Prospect: ${contato.name || contato.phone}
Contexto: ${input?.context || 'Agendamento de reunião de apresentação'}
Horários disponíveis:\n${slots.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      },
    ], 'PRO')
    return { message: llmResponse.content.trim(), slots, slotsCount: slots.length }
  })
}

/**
 * ContactEnricher: suggests company and profile from name/phone/email. A suggestion only — the contact is never changed.
 */
async function executeContactEnricher(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const contato = ctx.contato
  if (!contato) return falha('ContactEnricher needs a contact')
  if (ctx.rascunho) return ok({ ...ctx.rascunho, sugestao: true })
  if (!contato.name || contato.name.length < 3) return falha('Contact name too short to enrich')

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
}`, ctx.ragContext),
    },
    {
      role: 'user' as const,
      content: `Nome: ${contato.name}
Telefone: ${contato.phone || 'não informado'}
Email: ${contato.email || 'não informado'}`,
    },
  ], 'PRO')

  let enriched: any
  try {
    enriched = parseJson(llmResponse.content)
  } catch {
    return falha('Failed to parse LLM enrichment response')
  }
  if (enriched.confidence < 30) return falha('Confidence too low to suggest anything', { confidence: enriched.confidence })

  // A guess from the model never replaces what a person typed: it stays here for a human to read
  return ok({ ...enriched, empresaAtual: contato.company, sugestao: true })
}

// ─── Real Estate Vertical ─────────────────────────────────────────────────────

/**
 * PropertyMatcher: drafts suggestions from the account's product catalog; on approval sends them.
 * Only the catalog feeds the message — never other deals or other clients' data.
 */
async function executePropertyMatcher(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  return mensagemAprovada(action, ctx, 'propmatch', async (contato) => {
    const conversationContext = await historicoDaConversa(contato.id, organizationId, 15, ['Cliente', 'Corretor'])
    const catalogo = await prisma.product.findMany({
      where: { organizationId, isActive: true },
      select: { name: true, price: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })
    const portfolioList = catalogo.map((p) => `- ${p.name} (R$ ${Number(p.price).toLocaleString('pt-BR')})`).join('\n')
    const defaultPrompt = `Você é um corretor de imóveis experiente. Analise a conversa e extraia os critérios de busca do cliente (tipo de imóvel, bairro, dormitórios, faixa de preço, objetivo: compra/aluguel). Compare com o portfólio disponível e sugira os 2-3 imóveis mais compatíveis. Escreva uma mensagem natural e personalizada para o cliente. Máx 6 linhas. Responda APENAS com o texto da mensagem.`
    const llmResponse = await callLLM([
      { role: 'system' as const, content: injectRagContext((input?.systemPromptOverride as string | undefined) || defaultPrompt, ctx.ragContext) },
      {
        role: 'user' as const,
        content: `Conversa com ${contato.name || contato.phone}:\n${conversationContext}\n\nPortfólio disponível:\n${portfolioList || 'Nenhum imóvel cadastrado ainda.'}`,
      },
    ], 'PRO')
    return { message: llmResponse.content.trim(), portfolioMatched: catalogo.length }
  })
}

/**
 * VisitScheduler: drafts a visit proposal (with calendar slots when available); on approval sends it.
 */
async function executeVisitScheduler(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  return mensagemAprovada(action, ctx, 'visit', async (contato) => {
    let slotLines = ''
    try {
      const slots = await horariosLivres(organizationId, 3)
      if (slots) slotLines = slots.map((s, i) => `${i + 1}. ${s}`).join('\n')
    } catch {}
    const defaultPrompt = `Você é um corretor de imóveis. O cliente demonstrou interesse em visitar um imóvel. Proponha horários para visita de forma simpática e profissional. Se houver horários disponíveis, use-os. Máx 5 linhas. Responda APENAS com o texto da mensagem.`
    const llmResponse = await callLLM([
      { role: 'system' as const, content: injectRagContext((input?.systemPromptOverride as string | undefined) || defaultPrompt, ctx.ragContext) },
      {
        role: 'user' as const,
        content: `Cliente: ${contato.name || contato.phone}\n${slotLines ? `Horários disponíveis:\n${slotLines}` : 'Sem horários de agenda disponíveis — ofereça para combinar por mensagem.'}`,
      },
    ], 'PRO')
    return { message: llmResponse.content.trim(), slotsOffered: slotLines }
  })
}

/**
 * ProposalFollowUp: drafts a follow-up for a stalled proposal. Always a draft — approving does not send it.
 */
async function executeProposalFollowUp(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  const contato = ctx.contato
  if (!contato?.phone) return falha('Contact not found or has no phone')
  if (ctx.rascunho) return ok({ ...ctx.rascunho, requiresApproval: true })

  const conversationContext = await historicoDaConversa(contato.id, organizationId, 8, [contato.name || 'Cliente', 'Corretor'])
  const defaultPrompt = `Você é um corretor de imóveis. Escreva um follow-up elegante e não insistente para retomar contato com um cliente que está avaliando uma proposta. Seja natural, curto (máx 3 linhas) e personalize com base na conversa. Responda APENAS com o texto da mensagem.`
  const llmResponse = await callLLM([
    { role: 'system' as const, content: injectRagContext((input?.systemPromptOverride as string | undefined) || defaultPrompt, ctx.ragContext) },
    {
      role: 'user' as const,
      content: `Cliente: ${contato.name || contato.phone}\nDeal: "${ctx.negocio?.title ?? input?.dealTitle ?? ''}"\nDias sem resposta: ${input?.idleDays}\nÚltima conversa:\n${conversationContext || 'Sem histórico.'}`,
    },
  ], 'PRO')

  return ok({ message: llmResponse.content.trim(), contactName: contato.name, dealTitle: ctx.negocio?.title, idleDays: input?.idleDays, requiresApproval: true })
}

/**
 * LeadProfiler: classifies the lead (buyer, seller, tenant, investor). A suggestion only — the contact is never changed.
 */
async function executeLeadProfiler(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  const contato = ctx.contato
  if (!contato) return falha('LeadProfiler needs a contact')
  if (ctx.rascunho) return ok({ ...ctx.rascunho, sugestao: true })

  const conversationContext = await historicoDaConversa(contato.id, organizationId, 20, ['Cliente', 'Corretor'])
  if (!conversationContext) return falha('No messages to analyze')

  const defaultPrompt = `Você é um especialista em perfil de clientes imobiliários. Analise a conversa e classifique o lead.
Responda APENAS em JSON válido:
{
  "profile": "COMPRADOR" | "VENDEDOR" | "LOCATARIO" | "INVESTIDOR",
  "confidence": 0-100,
  "reasoning": "justificativa curta",
  "profileNotes": "detalhes úteis para o corretor (max 2 frases)"
}`
  const llmResponse = await callLLM([
    { role: 'system' as const, content: injectRagContext((input?.systemPromptOverride as string | undefined) || defaultPrompt, ctx.ragContext) },
    { role: 'user' as const, content: `Conversa:\n${conversationContext}` },
  ], 'PRO')

  let result: any
  try {
    result = parseJson(llmResponse.content)
  } catch {
    return falha('Failed to parse LLM response')
  }
  if (result.confidence < 40) return falha('Confidence too low', { confidence: result.confidence })

  return ok({ profile: result.profile, confidence: result.confidence, reasoning: result.reasoning, profileNotes: result.profileNotes, sugestao: true })
}

/**
 * NegotiationAssistant: drafts a counter-proposal. Always a draft — approving does not send it.
 */
async function executeNegotiationAssistant(action: AgentAction, ctx: Contexto): Promise<Resultado> {
  const { organizationId, input } = action
  const contato = ctx.contato
  if (!contato) return falha('NegotiationAssistant needs a contact')
  if (ctx.rascunho) return ok({ ...ctx.rascunho, requiresApproval: true })

  const conversationContext = await historicoDaConversa(contato.id, organizationId, 10, ['Cliente', 'Corretor'])
  const defaultPrompt = `Você é um especialista em negociação imobiliária. Analise a objeção de preço/condição do cliente e sugira uma contra-proposta respeitosa e estratégica. Não faça concessões precipitadas. Escreva uma mensagem natural de resposta (máx 4 linhas). Responda APENAS com o texto da mensagem.`
  const llmResponse = await callLLM([
    { role: 'system' as const, content: injectRagContext((input?.systemPromptOverride as string | undefined) || defaultPrompt, ctx.ragContext) },
    {
      role: 'user' as const,
      content: `Cliente: ${contato.name || 'Lead'}\nConversa:\n${conversationContext}\nÚltima mensagem de objeção: "${input?.messageText || ''}"`,
    },
  ], 'PRO')

  return ok({ message: llmResponse.content.trim(), contactName: contato.name, requiresApproval: true })
}
