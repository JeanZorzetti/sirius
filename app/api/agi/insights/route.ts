/**
 * AGI Sirius - Insights API Route
 * 
 * GET /api/agi/insights?dealId=xxx
 * GET /api/agi/insights (recent for organization)
 * 
 * Retrieves AI-generated insights
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDealInsights, getRecentInsights, markInsightAsApplied, dismissInsight } from '@/lib/agi/insights';
import { agiRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const dealId = searchParams.get('dealId');
        const limit = parseInt(searchParams.get('limit') || '20');

        let insights;

        if (dealId) {
            // Get insights for specific deal
            insights = await getDealInsights(user.organizationId, dealId);
        } else {
            // Get recent insights for organization
            insights = await getRecentInsights(user.organizationId, limit);
        }

        return NextResponse.json({ insights });
    } catch (error) {
        logger.error({ err: error }, 'Get Insights Error');
        return NextResponse.json(
            { error: 'Erro ao buscar insights' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const body = await req.json();
        const { insightId, action } = body;

        if (!insightId || !action) {
            return NextResponse.json(
                { error: 'insightId e action são obrigatórios' },
                { status: 400 }
            );
        }

        if (action === 'apply') {
            await markInsightAsApplied(insightId);
        } else if (action === 'dismiss') {
            await dismissInsight(insightId);
        } else {
            return NextResponse.json(
                { error: 'Action inválida. Use "apply" ou "dismiss"' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ err: error }, 'Update Insight Error');
        return NextResponse.json(
            { error: 'Erro ao atualizar insight' },
            { status: 500 }
        );
    }
}
