/**
 * SPIN Selling State Machine
 *
 * Implements the SPIN methodology for consultative AI conversations:
 * - Situation: Understand current state ("Tell me about your current setup")
 * - Problem: Identify pain points ("How often do you face X?")
 * - Implication: Amplify pain ("If data is stale, doesn't that cause Y?")
 * - Need-Payoff: Present solution ("Would automating X help?")
 *
 * References: Capítulo 4 - Engenharia Comportamental
 */

import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

// ============================================
// TYPES
// ============================================

export type SPINState = 'Situation' | 'Problem' | 'Implication' | 'NeedPayoff'

export type SandlerStage =
  | 'Bonding' // Building rapport
  | 'UpfrontContract' // Setting expectations
  | 'PainDiscovery' // Finding pain points
  | 'Budget' // Qualifying budget
  | 'Decision' // Decision-making process
  | 'Fulfillment' // Closing/delivery

export type DiagnosticMode = 'express' | 'complete' | 'deep'

export interface DiagnosticConfig {
  mode: DiagnosticMode
  targetQuestions: number // Número alvo de perguntas
  minResponseLength: number // Tamanho mínimo de resposta para transição
  scoreMultiplier: number // Multiplicador de score (express = 1.5, complete = 1.0, deep = 0.8)
  toneStyle: 'casual' | 'balanced' | 'professional' // Estilo de tom
}

export interface ConversationContext {
  sessionId: string
  spinState: SPINState
  sandlerStage: SandlerStage
  diagnosticMode: DiagnosticMode
  identifiedProblems: string[]
  identifiedGoals: string[]
  entityContext: Record<string, any>
  qualificationScore: number
}

export interface SPINTransition {
  fromState: SPINState
  toState: SPINState
  trigger: 'answered' | 'deflected' | 'manual'
  confidence: number // 0-1 how confident we are in this transition
}

// ============================================
// DIAGNOSTIC MODE CONFIGURATIONS
// ============================================

export function getDiagnosticConfig(mode: DiagnosticMode): DiagnosticConfig {
  const configs: Record<DiagnosticMode, DiagnosticConfig> = {
    express: {
      mode: 'express',
      targetQuestions: 6, // 5-7 perguntas
      minResponseLength: 20, // Respostas curtas OK
      scoreMultiplier: 1.5, // Scoring generoso
      toneStyle: 'casual',
    },
    complete: {
      mode: 'complete',
      targetQuestions: 12, // 10-15 perguntas
      minResponseLength: 40, // Respostas médias
      scoreMultiplier: 1.0, // Scoring balanceado
      toneStyle: 'balanced',
    },
    deep: {
      mode: 'deep',
      targetQuestions: 20, // 20+ perguntas
      minResponseLength: 60, // Respostas detalhadas
      scoreMultiplier: 0.8, // Scoring rigoroso
      toneStyle: 'professional',
    },
  }

  return configs[mode]
}

// ============================================
// STATE MACHINE LOGIC
// ============================================

/**
 * Determine next SPIN state based on conversation analysis
 */
export function determineNextSPINState(
  currentState: SPINState,
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  diagnosticMode: DiagnosticMode = 'complete'
): SPINTransition {
  const lowerMessage = userMessage.toLowerCase()
  const config = getDiagnosticConfig(diagnosticMode)

  switch (currentState) {
    case 'Situation':
      // Move to Problem if user described their situation
      // Express mode: less strict
      const situationMinLength = config.mode === 'express' ? 20 : config.mode === 'complete' ? 50 : 80

      if (
        lowerMessage.length > situationMinLength &&
        (lowerMessage.includes('atualmente') ||
          lowerMessage.includes('usando') ||
          lowerMessage.includes('tenho') ||
          lowerMessage.includes('trabalho') ||
          lowerMessage.includes('faço') ||
          lowerMessage.includes('sistema'))
      ) {
        return {
          fromState: 'Situation',
          toState: 'Problem',
          trigger: 'answered',
          confidence: config.mode === 'express' ? 0.7 : 0.8,
        }
      }
      break

    case 'Problem':
      // Move to Implication if user acknowledged problems
      const problemMinLength = config.mode === 'express' ? 15 : config.mode === 'complete' ? 30 : 50

      if (
        lowerMessage.length > problemMinLength &&
        (lowerMessage.includes('problema') ||
          lowerMessage.includes('dificuldade') ||
          lowerMessage.includes('difícil') ||
          lowerMessage.includes('desafio') ||
          lowerMessage.includes('frustr') ||
          lowerMessage.includes('complicado') ||
          lowerMessage.includes('ruim'))
      ) {
        return {
          fromState: 'Problem',
          toState: 'Implication',
          trigger: 'answered',
          confidence: config.mode === 'express' ? 0.8 : 0.9,
        }
      }
      break

    case 'Implication':
      // Move to Need-Payoff if user expressed urgency/impact
      const implicationMinLength = config.mode === 'express' ? 15 : config.mode === 'complete' ? 30 : 50

      if (
        lowerMessage.length > implicationMinLength &&
        (lowerMessage.includes('custo') ||
          lowerMessage.includes('perco') ||
          lowerMessage.includes('perdi') ||
          lowerMessage.includes('urgente') ||
          lowerMessage.includes('crítico') ||
          lowerMessage.includes('impacto') ||
          lowerMessage.includes('afeta') ||
          lowerMessage.includes('prejuízo'))
      ) {
        return {
          fromState: 'Implication',
          toState: 'NeedPayoff',
          trigger: 'answered',
          confidence: config.mode === 'express' ? 0.75 : 0.85,
        }
      }
      break

    case 'NeedPayoff':
      // Stay in NeedPayoff (solution presentation mode)
      return {
        fromState: 'NeedPayoff',
        toState: 'NeedPayoff',
        trigger: 'answered',
        confidence: 1.0,
      }
  }

  // No confident transition - stay in current state
  return {
    fromState: currentState,
    toState: currentState,
    trigger: 'deflected',
    confidence: 0.5,
  }
}

/**
 * Generate appropriate SPIN question based on current state
 */
export function generateSPINQuestion(
  state: SPINState,
  context: Partial<ConversationContext>
): string {
  const { identifiedProblems = [], entityContext = {} } = context

  switch (state) {
    case 'Situation':
      // Open-ended discovery questions
      const situationQuestions = [
        'Conte-me sobre a configuração atual do seu sistema de conhecimento.',
        'Como você gerencia informações e relacionamentos entre entidades atualmente?',
        'Qual é o volume de dados que você processa diariamente?',
        'Quem são os principais usuários do sistema?',
      ]
      return situationQuestions[Math.floor(Math.random() * situationQuestions.length)]

    case 'Problem':
      // Problem identification questions
      const problemQuestions = [
        'Com que frequência você percebe que os dados estão desatualizados ou dessincronizados?',
        'Quais são os maiores desafios ao manter as relações entre entidades atualizadas?',
        'Você já perdeu insights importantes porque os dados não estavam conectados corretamente?',
        'Quanto tempo sua equipe gasta corrigindo links quebrados ou dados incorretos?',
      ]
      return problemQuestions[Math.floor(Math.random() * problemQuestions.length)]

    case 'Implication':
      // Twist the knife - amplify pain
      const problem = identifiedProblems[0] || 'dados desatualizados'
      const implicationQuestions = [
        `Se ${problem}, isso não significa que seus agentes de IA podem estar alucinando respostas para clientes? Qual o custo disso para a sua marca?`,
        `Quando os dados estão incorretos, isso não leva a decisões de negócio equivocadas? Como isso impacta sua receita?`,
        `Se a sua equipe gasta horas corrigindo dados manualmente, isso não tira o foco de atividades mais estratégicas?`,
        `Dados obsoletos não criam uma experiência ruim para o usuário final? Como isso afeta sua taxa de retenção?`,
      ]
      return implicationQuestions[Math.floor(Math.random() * implicationQuestions.length)]

    case 'NeedPayoff':
      // Present solution value
      const needPayoffQuestions = [
        'Ajudaria se automatizássemos a vinculação de entidades para que seus agentes sempre tenham a verdade fundamental?',
        'Se pudéssemos reduzir o trabalho manual de manutenção de dados em 80%, isso liberaria recursos para outras prioridades?',
        'Uma solução que detecta e corrige inconsistências automaticamente seria valiosa para sua operação?',
        'Gostaria de ver como podemos implementar um sistema que aprende e melhora suas conexões de dados continuamente?',
      ]
      return needPayoffQuestions[Math.floor(Math.random() * needPayoffQuestions.length)]
  }
}

// ============================================
// PERSISTENCE
// ============================================

/**
 * Load or create conversation session
 */
export async function getOrCreateSession(
  sessionId: string,
  userId?: string,
  diagnosticMode: DiagnosticMode = 'complete'
): Promise<ConversationContext> {
  let session = await prisma.conversationSession.findUnique({
    where: { sessionId },
  })

  if (!session) {
    session = await prisma.conversationSession.create({
      data: {
        sessionId,
        userId,
        spinState: 'Situation',
        sandlerStage: 'Bonding',
        diagnosticMode,
        identifiedProblems: [],
        identifiedGoals: [],
        entityContext: {},
        qualificationScore: 0,
      },
    })
  }

  return {
    sessionId: session.sessionId,
    spinState: session.spinState as SPINState,
    sandlerStage: session.sandlerStage as SandlerStage,
    diagnosticMode: (session.diagnosticMode as DiagnosticMode) || 'complete',
    identifiedProblems: (session.identifiedProblems as string[]) || [],
    identifiedGoals: (session.identifiedGoals as string[]) || [],
    entityContext: (session.entityContext as Record<string, any>) || {},
    qualificationScore: session.qualificationScore,
  }
}

/**
 * Update conversation session state
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<ConversationContext>
): Promise<void> {
  await prisma.conversationSession.update({
    where: { sessionId },
    data: {
      ...updates,
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    },
  })
}

/**
 * Save conversation message
 */
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: {
    spinIntent?: string
    extractedEntities?: string[]
    sentiment?: string
  }
): Promise<void> {
  await prisma.conversationMessage.create({
    data: {
      sessionId,
      role,
      content,
      spinIntent: metadata?.spinIntent,
      extractedEntities: metadata?.extractedEntities || [],
      sentiment: metadata?.sentiment,
    },
  })
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  sessionId: string,
  limit: number = 50
): Promise<Array<{ role: string; content: string }>> {
  const messages = await prisma.conversationMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))
}

// ============================================
// QUALIFICATION SCORING
// ============================================

/**
 * Calculate lead qualification score based on conversation
 */
export function calculateQualificationScore(
  context: ConversationContext,
  conversationHistory: { role: string; content: string }[]
): number {
  const config = getDiagnosticConfig(context.diagnosticMode)
  let score = 0

  // Engagement (20 points)
  const userMessages = conversationHistory.filter((m) => m.role === 'user')
  score += Math.min(20, userMessages.length * 4)

  // Problem acknowledgment (30 points)
  score += Math.min(30, context.identifiedProblems.length * 10)

  // SPIN progression (30 points)
  const stateScores = {
    Situation: 5,
    Problem: 15,
    Implication: 25,
    NeedPayoff: 30,
  }
  score += stateScores[context.spinState]

  // Message depth (20 points)
  const avgMessageLength =
    userMessages.reduce((sum, m) => sum + m.content.length, 0) /
    Math.max(userMessages.length, 1)
  score += Math.min(20, (avgMessageLength / 50) * 5)

  // Apply mode multiplier
  score = score * config.scoreMultiplier

  return Math.min(100, Math.round(score))
}

// ============================================
// ANTI-LOOP & CONTEXT RETENTION
// ============================================

/**
 * Gera um resumo do contexto da conversa para evitar loops
 */
export function generateContextSummary(
  session: ConversationContext,
  conversationHistory: { role: string; content: string }[]
): string {
  const userMessages = conversationHistory.filter(m => m.role === 'user')
  const assistantMessages = conversationHistory.filter(m => m.role === 'assistant')

  const problems = session.identifiedProblems.length > 0
    ? session.identifiedProblems.join(', ')
    : 'nenhum problema identificado ainda'

  const goals = session.identifiedGoals.length > 0
    ? session.identifiedGoals.join(', ')
    : 'nenhum objetivo identificado ainda'

  return `
📋 RESUMO DA CONVERSA ATÉ AGORA (Estágio: ${session.spinState}):

IMPORTANTE: Você já teve ${userMessages.length} trocas com este lead. NÃO REPITA PERGUNTAS JÁ FEITAS.

CONTEXTO JÁ DISCUTIDO:
- Problemas identificados: ${problems}
- Objetivos mencionados: ${goals}
- Score de qualificação: ${session.qualificationScore}/100
- Número de interações: ${conversationHistory.length} mensagens

ÚLTIMAS 3 MENSAGENS DO LEAD:
${userMessages.slice(-3).map((m, i) => `${i + 1}. ${m.content.substring(0, 150)}...`).join('\n')}

⚠️ ANTI-LOOP: Não volte a perguntar sobre coisas que o lead já respondeu!
Se você já perguntou sobre o processo atual, não pergunte novamente.
Continue AVANÇANDO na conversa, não retroceda.
`
}

/**
 * Detecta se a resposta da IA contém perguntas já feitas antes
 */
export function detectRepeatedQuestions(
  aiResponse: string,
  conversationHistory: { role: string; content: string }[]
): boolean {
  const assistantMessages = conversationHistory.filter(m => m.role === 'assistant')

  // Extrair perguntas do histórico (linhas que terminam com ?)
  const previousQuestions = assistantMessages
    .flatMap(m => m.content.split('\n'))
    .filter(line => line.trim().endsWith('?'))
    .map(q => q.toLowerCase().trim())

  // Extrair perguntas da nova resposta
  const newQuestions = aiResponse
    .split('\n')
    .filter(line => line.trim().endsWith('?'))
    .map(q => q.toLowerCase().trim())

  // Verificar similaridade (> 70% de palavras em comum)
  for (const newQ of newQuestions) {
    const newWords = new Set(newQ.split(/\s+/).filter(w => w.length > 3))

    for (const prevQ of previousQuestions) {
      const prevWords = new Set(prevQ.split(/\s+/).filter(w => w.length > 3))

      // Calcular interseção
      const intersection = new Set([...newWords].filter(w => prevWords.has(w)))
      const similarity = intersection.size / Math.max(newWords.size, prevWords.size)

      if (similarity > 0.7) {
        logger.warn(
          { newQuestion: newQ.substring(0, 80), previousQuestion: prevQ.substring(0, 80), similarity },
          '[ANTI-LOOP] Repeated question detected'
        )
        return true
      }
    }
  }

  return false
}
