/**
 * AGI Sirius - Usage Stats API Route
 * 
 * GET /api/agi/usage
 * 
 * Returns current user's AGI usage stats and limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUsageLimits } from '@/lib/agi/usage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
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
        console.error('Usage Stats Error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar estatísticas de uso' },
            { status: 500 }
        );
    }
}
