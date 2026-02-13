/**
 * AGI Sirius - Chat with Generative UI API Route
 *
 * POST /api/agi/chat-with-ui
 * Enhanced chat endpoint with support for dynamic UI component rendering.
 * Streams text responses AND UI component metadata.
 */

import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { streamText, stepCountIs } from 'ai'
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
import { analyzeConversation } from '@/lib/generative-ui/intelligence'
import { componentCacheStore, createCacheKey, hashContext } from '@/lib/generative-ui/cache-store'
import { agiRateLimit } from '@/lib/ratelimit';

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
  const blocked = await agiRateLimit(req)
  if (blocked) return blocked

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

    // 7. Run Intelligence Layer analysis
    const spinState = spinSession?.spinState || 'Situation'
    const leadScore = spinSession?.qualificationScore || 30

    // Get last user message for debugging
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || ''

    const intelligenceResult = analyzeConversation({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      spinState: spinState as any,
      leadScore,
      dealContext: enhancedContext.deal ? {
        contactName: enhancedContext.deal.contact?.name,
        contactEmail: enhancedContext.deal.contact?.email,
        company: enhancedContext.deal.contact?.company,
        value: enhancedContext.deal.value ? parseFloat(enhancedContext.deal.value) : undefined,
      } : undefined,
    })

    logger.debug({ userMessage: lastUserMsg }, '[INTELLIGENCE] User message')
    logger.debug({
      intent: intelligenceResult.intent.primary,
      confidence: intelligenceResult.intent.confidence,
      shouldRender: intelligenceResult.trigger.shouldRender,
      component: intelligenceResult.trigger.recommendation?.component,
      score: intelligenceResult.trigger.recommendation?.score,
      reasoning: intelligenceResult.trigger.reasoning,
      spinState,
      leadScore,
    }, '[INTELLIGENCE] Analysis result')

    // 8. Build enhanced system prompt with Generative UI capabilities
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

    // Add Intelligence Layer insights
    const intelligencePrompt = `
## INTELLIGENCE ANALYSIS (use this to decide if you should render a UI component)

DETECTED INTENT: ${intelligenceResult.intent.primary} (confidence: ${Math.round(intelligenceResult.intent.confidence * 100)}%)
${intelligenceResult.intent.secondary ? `Secondary: ${intelligenceResult.intent.secondary}` : ''}

EXTRACTED ENTITIES:
- Monetary values: ${intelligenceResult.entities.monetaryValues.map(v => `${v.raw} (${v.context})`).join(', ') || 'None'}
- Competitors: ${intelligenceResult.entities.competitors.map(c => c.name).join(', ') || 'None'}
- Pain points: ${intelligenceResult.entities.painPoints.slice(0, 3).join(', ') || 'None'}
- Names: ${intelligenceResult.entities.names.join(', ') || 'None'}
- Emails: ${intelligenceResult.entities.emails.join(', ') || 'None'}
- Team size: ${intelligenceResult.entities.teamSizes || 'Unknown'}

UI RECOMMENDATION: ${intelligenceResult.trigger.shouldRender ? `YES - Render ${intelligenceResult.trigger.recommendation?.component}` : 'NO'}
${intelligenceResult.trigger.shouldRender && intelligenceResult.suggestedProps ? `Suggested props: ${JSON.stringify(intelligenceResult.suggestedProps)}` : ''}
Reasoning: ${intelligenceResult.trigger.reasoning}

IMPORTANT: Use the intelligence analysis above to inform your decision. If a component is recommended and you have the required data, use the render_ui_component tool.
`

    const fullSystemPrompt = systemPrompt + contextPrompt + spinPrompt + intelligencePrompt

    // 9. Configure LLM provider
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY!,
    })

    // Use Llama 3.3 70B Versatile (official model with superior tool calling support)
    // Replaces deprecated llama3-groq-70b-8192-tool-use-preview (deprecated Jan 6, 2025)
    const modelName = 'llama-3.3-70b-versatile'

    // 10. Define render UI component tool with explicit type annotation for compatibility
    const renderUIComponentTool: any = {
      description: 'Renders a UI component dynamically based on the conversation context. Use this when you want to show interactive visualizations, calculators, forms, or dashboards to enhance the sales conversation.',
      parameters: z.object({
        componentName: z.string().describe('The name of the UI component to render. Must be one of: ROICalculator, DealFormGenerator, PricingComparison, DemoScheduler, QualificationDashboard'),
        props: z.object({}).passthrough().describe('Component properties as a JSON object. Can be empty {}'),
        reasoning: z.string().optional().describe('Why you chose this component')
      }),
      execute: async (args: any) => {
        const { componentName, props, reasoning } = args
        logger.info({ componentName, reasoning }, '[TOOL CALL] render_ui_component invoked')

        // Build cache context (user context + component request)
        const cacheContext = {
          userId,
          organizationId: user.organizationId,
          componentName,
          ...enhancedContext,
        }
        const contextHash = hashContext(cacheContext)
        const propsStr = JSON.stringify(props)
        const cacheKey = createCacheKey(contextHash, propsStr)

        // Check cache first
        const cached = componentCacheStore.get(cacheKey)
        if (cached) {
          logger.info({ componentName, hitCount: cached.hitCount }, '[CACHE HIT] Component served from cache')

          // Track cache hit for analytics
          const today = new Date()
          today.setHours(0, 0, 0, 0) // Reset time to start of day

          await prisma.agiUsage.upsert({
            where: {
              organizationId_userId_date: {
                organizationId: user.organizationId,
                userId,
                date: today,
              }
            },
            update: {
              requestCount: { increment: 1 },
            },
            create: {
              organizationId: user.organizationId,
              userId,
              date: today,
              tokensUsed: 0, // Cache hit = no tokens
              requestCount: 1,
              plan,
              year: today.getFullYear(),
              month: today.getMonth() + 1,
            },
          }).catch((err: any) => {
            logger.error({ err: err }, 'Failed to log cache hit')
          })

          return {
            name: componentName,
            props: cached.props,
            skeleton: componentRegistry[componentName]?.skeleton,
            reasoning: reasoning || cached.props.reasoning || componentRegistry[componentName]?.description,
            fromCache: true,
          }
        }

        logger.info({ componentName }, '[CACHE MISS] Generating fresh component')

        const component = componentRegistry[componentName]

        if (!component) {
          throw new Error(`Component ${componentName} not found in registry`)
        }

        // Validate props against component schema
        const validationResult = component.props_schema.safeParse(props)

        if (!validationResult.success) {
          throw new Error(`Invalid props for ${componentName}: ${validationResult.error.message}`)
        }

        const result = {
          name: componentName,
          props: validationResult.data,
          skeleton: component.skeleton,
          reasoning: reasoning || component.description,
          fromCache: false,
        }

        // Cache the result
        componentCacheStore.set(cacheKey, {
          id: cacheKey,
          componentName,
          props: validationResult.data,
          timestamp: Date.now(),
          contextHash,
        })

        logger.info({ componentName }, '[CACHED] Component stored for future use')

        return result
      }
    }

    // 11. Stream response with render_ui_component tool
    const result = streamText({
      model: groq(modelName),
      system: fullSystemPrompt,
      messages,
      temperature: 0.7,
      stopWhen: stepCountIs(5), // Allow up to 5 steps for tool calls (AI can call render_ui_component)
      tools: {
        render_ui_component: renderUIComponentTool
      },

      onFinish: async ({ usage, finishReason }) => {
        // Record usage
        await recordUsage(
          user.organizationId,
          userId,
          usage.totalTokens || 0,
          plan
        )

        // Update SPIN session if exists
        if (spinSession) {
          const history = await getConversationHistory(spinSession.sessionId)
          const userMessage = messages[messages.length - 1]?.content || ''
          const nextStateTransition = determineNextSPINState(
            spinSession.spinState || 'Situation',
            userMessage,
            history,
            spinSession.diagnosticMode || 'complete'
          )
          const qualScore = calculateQualificationScore(spinSession, history)

          await updateSession(spinSession.sessionId, {
            spinState: nextStateTransition.toState,
            qualificationScore: qualScore,
          })
        }

        // Save conversation
        if (sessionId) {
          await saveMessage(
            sessionId,
            'user',
            messages[messages.length - 1]?.content || ''
          )

          // AI response will be saved when streaming completes
        }
      },
    })

    // 12. Create custom NDJSON stream for frontend parsing
    const encoder = new TextEncoder()

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // The streamText result provides different chunk types
        // We need to transform them to our StreamChunk format

        if (typeof chunk === 'string') {
          // Text delta
          const streamChunk: StreamChunk = {
            type: 'text',
            content: chunk
          }
          controller.enqueue(encoder.encode(JSON.stringify(streamChunk) + '\n'))
        }
      }
    })

    // Use toDataStream for full control and pipe through our transformer
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Collect text and tool results
          let fullText = ''
          let componentAlreadyRendered = false

          // If intelligence layer recommends a component, render it automatically
          // This bypasses Groq's problematic tool calling
          if (intelligenceResult.trigger.shouldRender && intelligenceResult.trigger.recommendation) {
            logger.info({ component: intelligenceResult.trigger.recommendation.component }, '[AUTO-RENDER] Intelligence recommends')

            try {
              const component = intelligenceResult.trigger.recommendation.component as any
              const suggestedProps = intelligenceResult.suggestedProps || {}

              // Call the tool execute function directly
              const toolResult = await renderUIComponentTool.execute({
                componentName: component,
                props: suggestedProps,
                reasoning: intelligenceResult.trigger.reasoning
              })

              // Send UI component chunk
              const uiChunk: StreamChunk = {
                type: 'ui_component',
                name: toolResult.name,
                props: toolResult.props,
                skeleton: toolResult.skeleton,
                reasoning: toolResult.reasoning
              }
              controller.enqueue(encoder.encode(JSON.stringify(uiChunk) + '\n'))
              componentAlreadyRendered = true
              logger.info('[AUTO-RENDER] Component rendered successfully')
            } catch (error) {
              logger.error({ err: error }, '[AUTO-RENDER] Failed')
            }
          }

          for await (const part of result.fullStream) {
            if (part.type === 'text-delta') {
              fullText += part.text
              const chunk: StreamChunk = { type: 'text', content: part.text }
              controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'))
            } else if (part.type === 'tool-call') {
              logger.info({ toolName: part.toolName }, '[STREAM] Tool call detected')
              logger.debug({ argsType: typeof part.input, args: part.input }, '[STREAM] Tool call args')
              if (part.toolName === 'render_ui_component') {
                // Send thinking state first
                const thinkingChunk: StreamChunk = {
                  type: 'thinking',
                  state: 'generating_ui' as ThinkingState,
                  message: 'Gerando componente...'
                }
                controller.enqueue(encoder.encode(JSON.stringify(thinkingChunk) + '\n'))
              }
            } else if (part.type === 'tool-result') {
              logger.info({ toolName: part.toolName }, '[STREAM] Tool result')
              if (part.output) {
                logger.debug({ output: part.output }, '[STREAM] Tool result content')
              }
              if ((part as any).error) {
                logger.error('[STREAM] Tool error:', (part as any).error)
              }
              if (part.toolName === 'render_ui_component' && part.output) {
                // Send UI component metadata
                const output = part.output as any
                const uiChunk: StreamChunk = {
                  type: 'ui_component',
                  name: output.name,
                  props: output.props,
                  skeleton: output.skeleton,
                  reasoning: output.reasoning
                }
                controller.enqueue(encoder.encode(JSON.stringify(uiChunk) + '\n'))
              }
            } else if (part.type === 'start') {
              // Stream started - send initial thinking state
              const thinkingChunk: StreamChunk = {
                type: 'thinking',
                state: 'thinking' as ThinkingState,
                message: 'Processando...'
              }
              controller.enqueue(encoder.encode(JSON.stringify(thinkingChunk) + '\n'))
            }
          }

          controller.close()
        } catch (error) {
          const errorChunk: StreamChunk = {
            type: 'error',
            message: error instanceof Error ? error.message : 'Erro no streaming',
            recoverable: true
          }
          controller.enqueue(encoder.encode(JSON.stringify(errorChunk) + '\n'))
          controller.close()
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    logger.error({ err: error }, '[chat-with-ui] Error')
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
