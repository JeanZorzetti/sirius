/**
 * AGI Sirius - Insights Module
 * 
 * Manages AI-generated insights for deals and pipelines.
 */

import { prisma } from '@/lib/prisma';
import { AgiInsightType } from '@prisma/client';

export interface CreateInsightParams {
    organizationId: string;
    userId: string;
    type: AgiInsightType;
    title: string;
    content: string;
    confidence: number;
    metadata?: Record<string, any>;
    dealId?: string;
    pipelineId?: string;
}

export interface DealInsight {
    id: string;
    type: AgiInsightType;
    title: string;
    content: string;
    confidence: number;
    metadata: any;
    applied: boolean;
    dismissed: boolean;
    createdAt: Date;
}

/**
 * Create a new insight
 */
export async function createInsight(params: CreateInsightParams): Promise<string> {
    const insight = await prisma.agiInsight.create({
        data: {
            organizationId: params.organizationId,
            userId: params.userId,
            type: params.type,
            title: params.title,
            content: params.content,
            confidence: params.confidence,
            metadata: params.metadata || {},
            dealId: params.dealId,
            pipelineId: params.pipelineId,
        },
    });

    return insight.id;
}

/**
 * Get insights for a specific deal
 */
export async function getDealInsights(
    organizationId: string,
    dealId: string
): Promise<DealInsight[]> {
    const insights = await prisma.agiInsight.findMany({
        where: {
            organizationId,
            dealId,
            dismissed: false, // Don't return dismissed insights
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return insights.map(insight => ({
        id: insight.id,
        type: insight.type,
        title: insight.title,
        content: insight.content,
        confidence: insight.confidence.toNumber(),
        metadata: insight.metadata,
        applied: insight.applied,
        dismissed: insight.dismissed,
        createdAt: insight.createdAt,
    }));
}

/**
 * Get recent insights for an organization
 */
export async function getRecentInsights(
    organizationId: string,
    limit: number = 20
): Promise<DealInsight[]> {
    const insights = await prisma.agiInsight.findMany({
        where: {
            organizationId,
            dismissed: false,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
    });

    return insights.map(insight => ({
        id: insight.id,
        type: insight.type,
        title: insight.title,
        content: insight.content,
        confidence: insight.confidence.toNumber(),
        metadata: insight.metadata,
        applied: insight.applied,
        dismissed: insight.dismissed,
        createdAt: insight.createdAt,
    }));
}

/**
 * Mark insight as applied
 */
export async function markInsightAsApplied(insightId: string): Promise<void> {
    await prisma.agiInsight.update({
        where: { id: insightId },
        data: { applied: true },
    });
}

/**
 * Dismiss an insight
 */
export async function dismissInsight(insightId: string): Promise<void> {
    await prisma.agiInsight.update({
        where: { id: insightId },
        data: { dismissed: true },
    });
}

/**
 * Get insights summary by type for an organization
 */
export async function getInsightsSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
): Promise<{
    total: number;
    byType: Record<string, number>;
    appliedCount: number;
    dismissedCount: number;
}> {
    const where: any = { organizationId };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const insights = await prisma.agiInsight.findMany({ where });

    const byType: Record<string, number> = {};
    let appliedCount = 0;
    let dismissedCount = 0;

    for (const insight of insights) {
        byType[insight.type] = (byType[insight.type] || 0) + 1;
        if (insight.applied) appliedCount++;
        if (insight.dismissed) dismissedCount++;
    }

    return {
        total: insights.length,
        byType,
        appliedCount,
        dismissedCount,
    };
}
