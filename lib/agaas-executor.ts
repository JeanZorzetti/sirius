/**
 * AgaaS Agent Executor
 *
 * Executes approved agent actions by calling the LLM and performing
 * the actual CRM operations (create deal, move stage, etc.).
 */

import { prisma } from '@/lib/prisma'
import { callLLM } from '@/lib/agi/providers'
import logger from '@/lib/logger'

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

/**
 * Execute an approved agent action.
 * Returns the output object to store in the AgentAction record.
 */
export async function executeAgentAction(action: AgentAction): Promise<{ success: boolean; output: Record<string, any> }> {
  switch (action.agentName) {
    case 'LeadQualifier':
      return executeLeadQualifier(action)
    case 'DealStageAnalyzer':
      return executeDealStageAnalyzer(action)
    default:
      return { success: false, output: { error: `Unknown agent: ${action.agentName}` } }
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
  const recentMessages = await prisma.whatsAppMessage.findMany({
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
  const llmResponse = await callLLM([
    {
      role: 'system' as const,
      content: `Você é um analista de vendas B2B. Analise a conversa e qualifique o lead usando critérios BANT.
Responda APENAS em JSON válido com esta estrutura:
{
  "qualification": "HOT" | "WARM" | "COLD",
  "score": 0-100,
  "reasoning": "explicação curta",
  "suggestedDealTitle": "título sugerido para o deal",
  "suggestedDealValue": 0,
  "nextAction": "ação recomendada"
}`,
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
    ? await prisma.whatsAppMessage.findMany({
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

  const llmResponse = await callLLM([
    {
      role: 'system' as const,
      content: `Você é um analista de pipeline de vendas B2B. Analise a conversa e determine se o deal deve avançar de estágio.

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
}`,
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
