/**
 * AGI Sirius - Chat with Generative UI API Route
 *
 * POST /api/agi/chat-with-ui
 * Enhanced chat endpoint with support for dynamic UI component rendering.
 * Streams text responses AND UI component metadata.
 */

import { NextRequest, NextResponse } from 'next/server'
import { streamText, tool } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUseAGI, recordUsage } from '@/lib/agi/usage'
import {
  getOrCreateSession,
  updateSession,
  saveMessage,
  getConversationHistory,
  determineNextSPINState,
  calculateQualificationScore,
} from '@/lib/agi/spin-engine'
import { enhancePromptWithGenerativeUI } from '@/lib/agi/prompts/generative-ui-prompt'
import { componentRegistry } from '@/lib/generative-ui/component-registry'
import type { StreamChunk, ThinkingState } from '@/lib/generative-ui/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  sessionId?: string
  context?: {
    dealId?: string
    pipelineId?: string
    type?: string
  }
}

/**
 * Base system prompt for AGI Sirius
 */
const BASE_SYSTEM_PROMPT = `Você é Sirius, uma AGI especializada em Vendas e CRM.

EXPERTISE:
- Frameworks: BANT, MEDDIC, SPIN Selling, Challenger Sale
- Quebra de objeções (Preço, Timing, Autoridade, Concorrência)
- Análise de funil e métricas (CAC, LTV, Conversão)
- Scripts de vendas e playbooks

METODOLOGIA:
1. Diagnostique o contexto de vendas
2. Use o framework adequado
3. Seja objetiva e focada em resultados
4. Forneça respostas práticas e acionáveis

Você é a melhor consultora de vendas. Seja breve e precisa.`

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 2. Get user and organization
    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    })

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'Usuário ou organização não encontrada' },
        { status: 404 }
      )
    }

    const plan = user.organization.plan as 'FREE' | 'PRO'

    // 3. Check usage limits
    const usageCheck = await canUseAGI(user.organizationId, user.id, plan)

    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason || 'Limite de uso atingido' },
        { status: 429 }
      )
    }

    // 4. Parse request
    const body: ChatRequest = await req.json()
    const { messages, sessionId, context } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Mensagens não podem estar vazias' },
        { status: 400 }
      )
    }

    // 5. Load context data if provided
    let enhancedContext: Record<string, any> = {}

    if (context?.dealId) {
      const deal = await prisma.deal.findFirst({
        where: {
          id: context.dealId,
          organizationId: user.organizationId,
        },
        include: {
          contact: true,
          stage: true,
          pipeline: true,
        },
      })

      if (deal) {
        enhancedContext.deal = {
          title: deal.title,
          value: deal.value?.toString(),
          stage: deal.stage.name,
          pipeline: deal.pipeline.name,
          contact: deal.contact
            ? {
                name: deal.contact.name,
                company: deal.contact.company,
                email: deal.contact.email,
              }
            : null,
        }
      }
    }

    // 6. Get or create SPIN session
    let spinSession = null
    if (sessionId) {
      spinSession = await getOrCreateSession(sessionId, userId)
    }

    // 7. Build enhanced system prompt with Generative UI capabilities
    const systemPrompt = enhancePromptWithGenerativeUI(BASE_SYSTEM_PROMPT)

    // Add context to system prompt if available
    const contextPrompt =
      Object.keys(enhancedContext).length > 0
        ? `\n\nCONTEXTO ATUAL:\n${JSON.stringify(enhancedContext, null, 2)}`
        : ''

    // Add SPIN state if available
    const spinPrompt = spinSession
      ? `\n\nSPIN STATE: ${spinSession.spinState || 'SITUATION'}\nQualification Score: ${spinSession.qualificationScore || 0}/100`
      : ''

    const fullSystemPrompt = systemPrompt + contextPrompt + spinPrompt

    // 8. Configure LLM provider
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY!,
    })

    const modelName =
      plan === 'PRO' ? 'llama-3.3-70b-versatile' : 'llama-3.2-11b-text-preview'

    // 9. Stream response with render_ui_component tool
    const result = streamText({
      model: groq(modelName),
      system: fullSystemPrompt,
      messages,
      temperature: 0.7,
      tools: {
        render_ui_component: tool({
          description: 'Renders a UI component dynamically based on the conversation context. Use this when you want to show interactive visualizations, calculators, forms, or dashboards to enhance the sales conversation.',
          parameters: z.object({
            componentName: z.enum([
              'ROICalculator',
              'DealFormGenerator',
              'PricingComparison',
              'DemoScheduler',
              'QualificationDashboard',
              'ObjectionHandler',
              'SPINQuestionGenerator',
              'CompetitorComparison',
              'ValuePropositionBuilder',
              'NextStepsTimeline'
            ]),
            props: z.record(z.string(), z.any()),
            reasoning: z.string().optional().describe('Why you chose this component and how it helps the conversation')
          }),
          execute: async ({ componentName, props, reasoning }) => {
            const component = componentRegistry[componentName]

            if (!component) {
              return {
                success: false,
                error: `Component ${componentName} not found in registry`
              }
            }

            // Validate props against component schema
            const validationResult = component.props_schema.safeParse(props)

            if (!validationResult.success) {
              return {
                success: false,
                error: `Invalid props for ${componentName}: ${validationResult.error.message}`
              }
            }

            // Return UI metadata for client-side rendering
            return {
              success: true,
              ui_metadata: {
                name: componentName,
                props: validationResult.data,
                skeleton: component.skeleton,
                reasoning: reasoning || component.description
              }
            }
          }
        })
      },

      onFinish: async ({ usage, finishReason }) => {
        // Record usage
        await recordUsage({
          userId,
          organizationId: user.organizationId,
          tokensUsed: usage.totalTokens,
          plan,
          endpoint: 'chat-with-ui',
        })

        // Update SPIN session if exists
        if (spinSession) {
          const history = await getConversationHistory(spinSession.id)
          const nextState = determineNextSPINState(history, spinSession.spinState || 'SITUATION')
          const qualScore = calculateQualificationScore(history)

          await updateSession(spinSession.id, {
            spinState: nextState,
            qualificationScore: qualScore,
          })
        }

        // Save conversation
        if (sessionId) {
          await saveMessage({
            sessionId,
            role: 'user',
            content: messages[messages.length - 1].content,
          })

          // AI response will be saved when streaming completes
        }
      },
    })

    // 10. Transform stream to include UI metadata and thinking states
    const transformedStream = result.toDataStream({
      getErrorMessage: (error) => {
        if (error instanceof Error) {
          return `Erro ao processar: ${error.message}`
        }
        return 'Erro desconhecido'
      },

      transform: async (chunk) => {
        // Pass through different chunk types
        if (chunk.type === 'text-delta') {
          const textChunk: StreamChunk = {
            type: 'text',
            content: chunk.textDelta,
          }
          return JSON.stringify(textChunk) + '\n'
        }

        if (chunk.type === 'tool-call' && chunk.toolName === 'render_ui_component') {
          // Tool is being called - show thinking state
          const thinkingChunk: StreamChunk = {
            type: 'thinking',
            state: 'generating_ui',
            message: 'Preparando componente visual...',
          }
          return JSON.stringify(thinkingChunk) + '\n'
        }

        if (chunk.type === 'tool-result' && chunk.toolName === 'render_ui_component') {
          // Tool execution completed - send UI metadata
          const toolResult = chunk.result as any

          if (toolResult.success && toolResult.ui_metadata) {
            const uiChunk: StreamChunk = {
              type: 'ui_component',
              name: toolResult.ui_metadata.name,
              props: toolResult.ui_metadata.props,
              skeleton: toolResult.ui_metadata.skeleton,
              reasoning: toolResult.ui_metadata.reasoning,
            }
            return JSON.stringify(uiChunk) + '\n'
          } else if (!toolResult.success) {
            // Tool execution failed - send error
            const errorChunk: StreamChunk = {
              type: 'error',
              message: toolResult.error || 'Erro ao renderizar componente',
              recoverable: true,
            }
            return JSON.stringify(errorChunk) + '\n'
          }
        }

        // For other chunk types, return empty string (will be filtered)
        return ''
      },
    })

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[chat-with-ui] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}

/**
 * Infer thinking state from step type
 */
function inferThinkingState(stepType: string): ThinkingState {
  const stateMap: Record<string, ThinkingState> = {
    'tool-call-render_ui_component': 'generating_ui',
    'tool-call-analyze_deal': 'analyzing_deal',
    retrieval: 'querying_knowledge',
  }
  return stateMap[stepType] || 'thinking'
}
