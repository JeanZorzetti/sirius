/**
 * AGI Sirius - Usage Tracking
 * 
 * Manages token usage tracking and limits for FREE/PRO plans.
 */

import { prisma } from '@/lib/prisma';

export interface UsageLimits {
    monthlyLimit: number;
    currentUsage: number;
    remaining: number;
    plan: 'FREE' | 'PRO';
    canUse: boolean;
}

/**
 * Get usage limits for a user in the current month
 */
export async function getUsageLimits(
    organizationId: string,
    userId: string,
    plan: 'FREE' | 'PRO'
): Promise<UsageLimits> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    // Get monthly limit from environment
    const monthlyLimit =
        plan === 'PRO'
            ? parseInt(process.env.AGI_MONTHLY_LIMIT_PRO || '500000')
            : parseInt(process.env.AGI_MONTHLY_LIMIT_FREE || '50000');

    // Sum up usage for current month
    const usageRecords = await prisma.agiUsage.findMany({
        where: {
            organizationId,
            userId,
            year,
            month,
        },
    });

    const currentUsage = usageRecords.reduce((sum, record) => sum + record.tokensUsed, 0);
    const remaining = Math.max(0, monthlyLimit - currentUsage);

    return {
        monthlyLimit,
        currentUsage,
        remaining,
        plan,
        canUse: currentUsage < monthlyLimit,
    };
}

/**
 * Record token usage for a user
 */
export async function recordUsage(
    organizationId: string,
    userId: string,
    tokensUsed: number,
    plan: 'FREE' | 'PRO'
): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Set time to start of day for grouping
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Upsert usage record for today
    await prisma.agiUsage.upsert({
        where: {
            organizationId_userId_date: {
                organizationId,
                userId,
                date,
            },
        },
        update: {
            tokensUsed: {
                increment: tokensUsed,
            },
            requestCount: {
                increment: 1,
            },
        },
        create: {
            organizationId,
            userId,
            date,
            tokensUsed,
            requestCount: 1,
            plan,
            year,
            month,
        },
    });
}

/**
 * Check if user can make a request (has remaining quota)
 */
export async function canUseAGI(
    organizationId: string,
    userId: string,
    plan: 'FREE' | 'PRO'
): Promise<{ allowed: boolean; reason?: string }> {
    // Check if AGI is enabled globally
    const agiEnabled = process.env.AGI_ENABLED === 'true';
    if (!agiEnabled) {
        return { allowed: false, reason: 'AGI está temporariamente desabilitado' };
    }

    const limits = await getUsageLimits(organizationId, userId, plan);

    if (!limits.canUse) {
        return {
            allowed: false,
            reason: `Limite mensal de ${limits.monthlyLimit.toLocaleString('pt-BR')} tokens atingido. Redefine dia 1º do próximo mês.`,
        };
    }

    return { allowed: true };
}

/**
 * Get usage statistics for an organization
 */
export async function getOrganizationUsageStats(
    organizationId: string,
    year: number,
    month: number
): Promise<{
    totalTokens: number;
    totalRequests: number;
    userBreakdown: { userId: string; tokens: number; requests: number }[];
}> {
    const usageRecords = await prisma.agiUsage.findMany({
        where: {
            organizationId,
            year,
            month,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    const totalTokens = usageRecords.reduce((sum, record) => sum + record.tokensUsed, 0);
    const totalRequests = usageRecords.reduce((sum, record) => sum + record.requestCount, 0);

    // Group by user
    const userMap = new Map<string, { tokens: number; requests: number }>();

    for (const record of usageRecords) {
        const existing = userMap.get(record.userId) || { tokens: 0, requests: 0 };
        userMap.set(record.userId, {
            tokens: existing.tokens + record.tokensUsed,
            requests: existing.requests + record.requestCount,
        });
    }

    const userBreakdown = Array.from(userMap.entries()).map(([userId, stats]) => ({
        userId,
        tokens: stats.tokens,
        requests: stats.requests,
    }));

    return {
        totalTokens,
        totalRequests,
        userBreakdown,
    };
}
