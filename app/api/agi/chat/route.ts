/**
 * AGI Sirius - Chat API Route
 * 
 * POST /api/agi/chat
 * Main chat endpoint for conversing with AGI Sirius
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAgiBrain } from '@/lib/agi/brain';
import { canUseAGI, recordUsage } from '@/lib/agi/usage';
import { saveConversation } from '@/lib/agi/memory';
import {
  getOrCreateSession,
  updateSession,
  saveMessage,
  getConversationHistory,
  determineNextSPINState,
  calculateQualificationScore,
} from '@/lib/agi/spin-engine';
import {
  getSandlerSystemPrompt,
  detectPrematureClose,
  UPFRONT_CONTRACTS,
} from '@/lib/agi/sandler-prompts';

export const runtime = 'nodejs'; // Required for streaming
export const maxDuration = 60; // 60 seconds for LLM response

interface ChatRequest {
    message: string;
    sessionId?: string; // For SPIN/Sandler memory
    context?: {
        dealId?: string;
        pipelineId?: string;
        type?: string; // 'deal', 'pipeline', 'general', 'script'
    };
    modelOption?: 'option1' | 'option2'; // For FREE users
    stream?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Authentication
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // 2. Get user and organization
        const userId = session.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { organization: true },
        });

        if (!user || !user.organization) {
            return NextResponse.json(
                { error: 'Usuário ou organização não encontrada' },
                { status: 404 }
            );
        }

        const plan = user.organization.plan as 'FREE' | 'PRO';

        // 3. Check usage limits
        const usageCheck = await canUseAGI(
            user.organizationId,
            user.id,
            plan
        );

        if (!usageCheck.allowed) {
            return NextResponse.json(
                { error: usageCheck.reason || 'Limite de uso atingido' },
                { status: 429 }
            );
        }

        // 4. Parse request
        const body: ChatRequest = await req.json();
        const { message, sessionId, context, modelOption, stream = false } = body;

        if (!message || message.trim().length === 0) {
            return NextResponse.json(
                { error: 'Mensagem não pode estar vazia' },
                { status: 400 }
            );
        }

        // 5. Load context data if provided
        let enhancedContext: Record<string, any> = {};

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
            });

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
                };
            }
        }

        if (context?.pipelineId) {
            const pipeline = await prisma.pipeline.findFirst({
                where: {
                    id: context.pipelineId,
                    organizationId: user.organizationId,
                },
                include: {
                    stages: true,
                    _count: {
                        select: { deals: true },
                    },
                },
            });

            if (pipeline) {
                enhancedContext.pipeline = {
                    name: pipeline.name,
                    stages: pipeline.stages.map(s => s.name),
                    totalDeals: pipeline._count.deals,
                };
            }
        }

        // 5.5. If no specific context, load user's deals automatically (for general queries)
        if (!context?.dealId && !context?.pipelineId) {
            const userDeals = await prisma.deal.findMany({
                where: {
                    organizationId: user.organizationId,
                },
                include: {
                    contact: true,
                    stage: true,
                    pipeline: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 20, // Limit to 20 most recent deals
            });

            if (userDeals.length > 0) {
                enhancedContext.userDeals = {
                    total: userDeals.length,
                    deals: userDeals.map(d => ({
                        id: d.id,
                        title: d.title,
                        value: d.value?.toString(),
                        stage: d.stage.name,
                        pipeline: d.pipeline.name,
                        contactName: d.contact?.name,
                        contactCompany: d.contact?.company,
                        createdAt: d.createdAt.toISOString(),
                    })),
                };
            }
        }


        // 5.75. SPIN/Sandler Conversational Layer
        const effectiveSessionId = sessionId || `user-${userId}-${Date.now()}`;
        const spinSession = await getOrCreateSession(effectiveSessionId, userId);
        const conversationHist = await getConversationHistory(effectiveSessionId, 20);

        // Save user message
        await saveMessage(effectiveSessionId, 'user', message);

        // Check for premature closing attempts (Sandler Pattern Interrupt)
        const deflectionResponse = detectPrematureClose(message);
        if (deflectionResponse && spinSession.spinState !== 'NeedPayoff') {
            // User is asking closing questions too early - deflect
            await saveMessage(effectiveSessionId, 'assistant', deflectionResponse);

            return NextResponse.json({
                message: deflectionResponse,
                model: 'sandler-deflection',
                spinState: spinSession.spinState,
                sessionId: effectiveSessionId,
            });
        }

        // Determine next SPIN state based on user's response
        const stateTransition = determineNextSPINState(
            spinSession.spinState,
            message,
            conversationHist
        );

        // Update session with new state
        if (stateTransition.toState !== spinSession.spinState) {
            await updateSession(effectiveSessionId, {
                spinState: stateTransition.toState,
            });
            spinSession.spinState = stateTransition.toState;
        }

        // Calculate qualification score
        const qualScore = calculateQualificationScore(spinSession, conversationHist);
        await updateSession(effectiveSessionId, {
            qualificationScore: qualScore,
        });

        // Get Sandler-adapted system prompt
        const sandlerSystemPrompt = getSandlerSystemPrompt(
            spinSession.spinState,
            spinSession.sandlerStage
        );

        // Add SPIN/Sandler context to enhanced context
        enhancedContext.spinContext = {
            state: spinSession.spinState,
            sandlerStage: spinSession.sandlerStage,
            qualificationScore: qualScore,
            problems: spinSession.identifiedProblems,
            goals: spinSession.identifiedGoals,
            conversationHistory: conversationHist.slice(-10), // Last 10 messages
        };

        // 6. Initialize AGI Brain with conversational memory + SPIN prompts
        const brain = createAgiBrain(plan, modelOption);

        // Inject Sandler system prompt into brain
        brain.setSystemPrompt(sandlerSystemPrompt);

        // 6.5. Check if we should execute specialized skills
        const lowercaseMessage = message.toLowerCase();

        // Auto-run BANT analysis if user has deals and asks about them
        if (enhancedContext.userDeals && (
            lowercaseMessage.includes('analise') ||
            lowercaseMessage.includes('qualific') ||
            lowercaseMessage.includes('bant')
        )) {
            const { qualificarBANT } = await import('@/lib/agi/skills');

            // Run BANT for each deal
            const dealAnalysis = enhancedContext.userDeals.deals.map((deal: any) => {
                const bant = qualificarBANT(
                    deal.contactCompany,
                    parseFloat(deal.value) || 0,
                    deal.contactName || '',
                    30 // Default 30 days timeline
                );
                return {
                    deal: deal.title,
                    score: bant.score,
                    qualificado: bant.qualificado,
                    criterios: bant.criterios,
                };
            });

            enhancedContext.bantAnalysis = dealAnalysis;
        }

        // 7. Check if streaming is requested
        if (stream) {
            // Streaming response
            const encoder = new TextEncoder();
            const customReadable = new ReadableStream({
                async start(controller) {
                    try {
                        let fullResponse = '';

                        for await (const chunk of brain.thinkStream(message, enhancedContext)) {
                            fullResponse += chunk;
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
                        }

                        // Record usage
                        const tokensUsed = brain['estimateTokens'](message + fullResponse);
                        await recordUsage(user.organizationId, user.id, tokensUsed, plan);

                        // Save conversation
                        await saveConversation({
                            organizationId: user.organizationId,
                            userId: user.id,
                            messages: brain.getHistory(),
                            context: context?.type,
                            dealId: context?.dealId,
                            pipelineId: context?.pipelineId,
                            tokensUsed,
                        });

                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        controller.close();
                    } catch (error) {
                        controller.error(error);
                    }
                },
            });

            return new Response(customReadable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            });
        }

        // 8. Non-streaming response with Brain and conversational memory
        const response = await brain.think(message, enhancedContext);

        // Save assistant response to SPIN session
        await saveMessage(effectiveSessionId, 'assistant', response.content);

        // 9. Record usage
        await recordUsage(
            user.organizationId,
            user.id,
            response.tokensUsed,
            plan
        );

        // 10. Save conversation
        const conversationMessages: any[] = [
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: response.content, timestamp: new Date().toISOString() },
        ];

        await saveConversation({
            organizationId: user.organizationId,
            userId: user.id,
            messages: conversationMessages,
            context: context?.type,
            dealId: context?.dealId,
            pipelineId: context?.pipelineId,
            tokensUsed: response.tokensUsed,
        });

        // 11. Return response with SPIN metadata
        return NextResponse.json({
            message: response.content,
            model: response.model,
            spinState: spinSession.spinState,
            sessionId: effectiveSessionId,
            qualificationScore: qualScore,
        });
    } catch (error) {
        console.error('AGI Chat Error:', error);

        // Check if it's an Ollama connection error (this check might become less relevant with multi-provider)
        if (error instanceof Error && error.message.includes('Failed to get response')) {
            return NextResponse.json(
                {
                    error: 'Não foi possível conectar ao servidor de IA. Verifique se o Ollama está rodando.',
                    details: error.message,
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: 'Erro ao processar mensagem',
                details: error instanceof Error ? error.message : 'Erro desconhecido',
            },
            { status: 500 }
        );
    }
}
