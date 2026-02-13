/**
 * AGI Sirius - Usage Stats API Route
 * 
 * GET /api/agi/usage
 * 
 * Returns current user's AGI usage stats and limits
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUsageLimits } from '@/lib/agi/usage';
import { agiRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

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
        const limits = await getUsageLimits(user.organizationId, user.id, plan);

        return NextResponse.json(limits);
    } catch (error) {
        logger.error({ err: error }, 'Usage Stats Error');
        return NextResponse.json(
            { error: 'Erro ao buscar estatísticas de uso' },
            { status: 500 }
        );
    }
}
