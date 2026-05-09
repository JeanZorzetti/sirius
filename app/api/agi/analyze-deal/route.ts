/**
 * AGI Sirius - Deal Analysis API Route
 * 
 * POST /api/agi/analyze-deal
 * Analyzes a deal and generates insights using sales frameworks
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAgiBrain } from '@/lib/agi/brain';
import { canUseAGI, recordUsage } from '@/lib/agi/usage';
import { createInsight } from '@/lib/agi/insights';
import { qualificarBANT, analisarFunil } from '@/lib/agi/skills';
import { agiRateLimit } from '@/lib/ratelimit';
import type { AgiInsightType } from '@prisma/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface AnalyzeDealRequest {
    dealId: string;
    analysisType?: 'bant' | 'meddic' | 'general' | 'all';
}

export async function POST(req: NextRequest) {
    try {
        // 1. Authentication
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true },
        });

        if (!user || !user.organization) {
            return NextResponse.json(
                { error: 'Usuário ou organização não encontrada' },
                { status: 404 }
            );
        }

        const plan = user.organization.tier as 'FREE' | 'PRO';

        // 2. Check usage limits
        const usageCheck = await canUseAGI(user.organizationId, user.id, plan);
        if (!usageCheck.allowed) {
            return NextResponse.json(
                { error: usageCheck.reason || 'Limite de uso atingido' },
                { status: 429 }
            );
        }

        // 3. Parse request
        const body: AnalyzeDealRequest = await req.json();
        const { dealId, analysisType = 'all' } = body;

        if (!dealId) {
            return NextResponse.json(
                { error: 'dealId é obrigatório' },
                { status: 400 }
            );
        }

        // 4. Load deal with full context
        const deal = await prisma.deal.findFirst({
            where: {
                id: dealId,
                organizationId: user.organizationId,
            },
            include: {
                contact: true,
                stage: true,
                pipeline: true,
                notes: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!deal) {
            return NextResponse.json({ error: 'Deal não encontrado' }, { status: 404 });
        }

        const insights: any[] = [];
        let totalTokens = 0;

        // 5. BANT Analysis (if requested or 'all')
        if (analysisType === 'bant' || analysisType === 'all') {
            // Extract BANT data from deal
            const orcamento = deal.value ? parseFloat(deal.value.toString()) : 0;
            const empresa = deal.contact?.company || deal.contact?.name || 'Não informado';
            const decisor = deal.contact?.name || 'Desconhecido';

            // Calculate timeline (days until close date or 90 if none)
            let prazo = 90;
            if (deal.closeDate) {
                const now = new Date();
                const closeDate = new Date(deal.closeDate);
                prazo = Math.max(1, Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            }

            const bantResult = qualificarBANT(empresa, orcamento, decisor, prazo);

            // Create insight
            const insightId = await createInsight({
                organizationId: user.organizationId,
                userId: user.id,
                type: 'QUALIFICATION_BANT' as AgiInsightType,
                title: `Qualificação BANT: ${bantResult.score}/100${bantResult.qualificado ? ' ✅' : ' ⚠️'}`,
                content: JSON.stringify(bantResult, null, 2),
                confidence: bantResult.score / 100,
                dealId,
                metadata: bantResult,
            });

            insights.push({
                id: insightId,
                type: 'QUALIFICATION_BANT',
                title: `Qualificação BANT: ${bantResult.score}/100${bantResult.qualificado ? ' ✅' : ' ⚠️'}`,
                data: bantResult,
            });
        }

        // 6. General AI Analysis (if requested or 'all')
        if (analysisType === 'general' || analysisType === 'all' || analysisType === 'meddic') {
            const brain = createAgiBrain(plan, undefined, user.locale ?? undefined);

            const prompt = `Analise este deal de vendas e forneça insights estratégicos:

**Deal:** ${deal.title}
**Valor:** R$ ${deal.value ? parseFloat(deal.value.toString()).toLocaleString('pt-BR') : 'Não definido'}
**Estágio:** ${deal.stage.name}
**Pipeline:** ${deal.pipeline.name}
**Contato:** ${deal.contact?.name || 'Não definido'} ${deal.contact?.company ? `(${deal.contact.company})` : ''}

**Notas recentes:**
${deal.notes.map(n => `- ${n.content}`).join('\n') || 'Nenhuma nota'}

**Atividades recentes:**
${deal.activities.map(a => `- ${a.type}: ${a.description}`).join('\n') || 'Nenhuma atividade'}

Por favor, forneça:
1. Próximos passos recomendados
2. Pontos de atenção/riscos
3. Estratégia de fechamento${analysisType === 'meddic' ? '\n4. Análise MEDDIC completa' : ''}

Seja específico e prático.`;

            const response = await brain.think(prompt);
            totalTokens += response.tokensUsed;

            // Create insight
            const insightId = await createInsight({
                organizationId: user.organizationId,
                userId: user.id,
                type: (analysisType === 'meddic' ? 'QUALIFICATION_MEDDIC' : 'NEXT_STEP_SUGGESTION') as AgiInsightType,
                title: analysisType === 'meddic' ? 'Análise MEDDIC' : 'Próximos Passos e Estratégia',
                content: response.content,
                confidence: 0.85,
                dealId,
                metadata: {
                    analysisType,
                    dealStage: deal.stage.name,
                },
            });

            insights.push({
                id: insightId,
                type: analysisType === 'meddic' ? 'QUALIFICATION_MEDDIC' : 'NEXT_STEP_SUGGESTION',
                title: analysisType === 'meddic' ? 'Análise MEDDIC' : 'Próximos Passos e Estratégia',
                data: { content: response.content },
            });
        }

        // 7. Record usage
        if (totalTokens > 0) {
            await recordUsage(user.organizationId, user.id, totalTokens, plan);
        }

        // 8. Return insights
        return NextResponse.json({
            dealId,
            dealTitle: deal.title,
            insights,
            tokensUsed: totalTokens,
        });
    } catch (error) {
        logger.error({ err: error }, 'Deal Analysis Error');
        return NextResponse.json(
            {
                error: 'Erro ao analisar deal',
                details: error instanceof Error ? error.message : 'Erro desconhecido',
            },
            { status: 500 }
        );
    }
}
