import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { callLLM } from '@/lib/agi/providers'
import { retrieveContext } from '@/lib/rag/retrieval'

const AGENT_PROMPTS: Record<string, { systemPrompt: string; agentName: string }> = {
  'followup-coordinator': {
    agentName: 'FollowUpCoordinator',
    systemPrompt: 'Você é um vendedor B2B experiente. Escreva uma mensagem natural, breve e personalizada (máx. 2 parágrafos curtos) baseada no contexto da conversa. Não use saudações genéricas. Não invente fatos. Português brasileiro.',
  },
  'lead-qualifier': {
    agentName: 'LeadQualifier',
    systemPrompt: 'Você é um SDR experiente qualificando leads via WhatsApp usando BANT/SPIN. Faça 1 pergunta inteligente que avance a qualificação naturalmente, sem soar robótico. Máx. 2 frases. Português brasileiro.',
  },
  'meeting-scheduler': {
    agentName: 'MeetingScheduler',
    systemPrompt: 'Você é um assistente de vendas. Escreva uma mensagem curta propondo horários de reunião. Seja profissional e amigável. Máx. 2 frases.',
  },
  'property-matcher': {
    agentName: 'PropertyMatcher',
    systemPrompt: 'Você é um corretor de imóveis experiente. Responda ao cliente com base no contexto da conversa, oferecendo ajuda concreta sobre busca de imóveis. Máx. 2 parágrafos curtos.',
  },
  'visit-scheduler': {
    agentName: 'VisitScheduler',
    systemPrompt: 'Você é um corretor de imóveis. Proponha horários de visita de forma simpática e profissional. Máx. 2 frases.',
  },
  'proposal-followup': {
    agentName: 'ProposalFollowUp',
    systemPrompt: 'Você é um corretor de imóveis. Escreva um follow-up elegante e não insistente para retomar contato sobre uma proposta. Máx. 2 frases.',
  },
  'negotiation-assistant': {
    agentName: 'NegotiationAssistant',
    systemPrompt: 'Você é um especialista em negociação. Responda à objeção do cliente com empatia e uma contra-proposta estratégica. Máx. 2 parágrafos curtos.',
  },
  default: {
    agentName: 'SiriusAssistant',
    systemPrompt: 'Você é um vendedor experiente respondendo via WhatsApp. Use o histórico da conversa para responder de forma natural, útil e concisa (máx. 2 parágrafos curtos). Português brasileiro.',
  },
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true, organization: { select: { tier: true } } },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const contactId = body.contactId as string | undefined
  const agentId = (body.agentId as string | undefined) || 'default'
  const instruction = (body.instruction as string | undefined)?.trim() || ''

  if (!contactId) {
    return NextResponse.json({ error: 'contactId required' }, { status: 400 })
  }

  // Verify contact belongs to the user's org
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, organizationId: user.organizationId },
    select: { id: true, name: true, phone: true },
  })
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  // Pull last 8 messages of the conversation for context
  const recentMessages = await prismaWa.whatsAppMessage.findMany({
    where: { contactId, organizationId: user.organizationId },
    orderBy: { sentAt: 'desc' },
    take: 8,
    select: { text: true, direction: true, sentAt: true },
  })

  const conversationHistory = recentMessages
    .reverse()
    .map(m => `${m.direction === 'INBOUND' ? 'Cliente' : 'Você'}: ${m.text}`)
    .join('\n')

  const agentConfig = AGENT_PROMPTS[agentId] || AGENT_PROMPTS.default

  // Retrieve RAG context (knowledge base) scoped to this agent + global docs
  const ragQuery = recentMessages.find(m => m.direction === 'INBOUND')?.text || agentConfig.agentName
  const ragContext = await retrieveContext(user.organizationId, ragQuery, agentId, 3).catch(() => '')

  const systemPrompt = ragContext
    ? `${agentConfig.systemPrompt}\n\nBASE DE CONHECIMENTO RELEVANTE:\n---\n${ragContext}\n---`
    : agentConfig.systemPrompt

  const userPrompt = [
    `Contato: ${contact.name || contact.phone || 'desconhecido'}`,
    '',
    'HISTÓRICO RECENTE:',
    conversationHistory || '(sem mensagens recentes)',
    '',
    instruction ? `INSTRUÇÃO DO USUÁRIO: ${instruction}` : 'Tarefa: escreva a próxima mensagem a enviar ao cliente.',
  ].join('\n')

  const tier = user.organization?.tier === 'BUSINESS' || user.organization?.tier === 'PRO' ? 'PRO' : 'FREE'

  try {
    const response = await callLLM(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tier
    )

    const draftText = (response.content || '').trim()
    if (!draftText) {
      return NextResponse.json({ error: 'Empty draft' }, { status: 502 })
    }

    return NextResponse.json({
      draft: draftText,
      agentName: agentConfig.agentName,
      agentId,
      usedRag: !!ragContext,
      provider: response.provider ?? null,
    })
  } catch (err: unknown) {
    console.error('[IA Draft] LLM call failed:', err)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
