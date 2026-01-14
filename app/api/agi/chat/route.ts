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

export const runtime = 'nodejs'; // Required for streaming
export const maxDuration = 60; // 60 seconds for LLM response

interface ChatRequest {
    message: string;
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
        const { message, context, modelOption, stream = false } = body;

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

        // 6. Create AGI brain instance
        const brain = createAgiBrain(plan, modelOption);

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

        // 8. Non-streaming response
        const response = await brain.think(message, enhancedContext);

        // 9. Record usage
        await recordUsage(
            user.organizationId,
            user.id,
            response.tokensUsed,
            plan
        );

        // 10. Save conversation
        const conversationId = await saveConversation({
            organizationId: user.organizationId,
            userId: user.id,
            messages: brain.getHistory(),
            context: context?.type,
            dealId: context?.dealId,
            pipelineId: context?.pipelineId,
            tokensUsed: response.tokensUsed,
        });

        // 11. Return response
        return NextResponse.json({
            response: response.content,
            tokensUsed: response.tokensUsed,
            model: response.model,
            conversationId,
        });
    } catch (error) {
        console.error('AGI Chat Error:', error);

        // Check if it's an Ollama connection error
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
