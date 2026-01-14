/**
 * AGI Sirius - Memory Module
 * 
 * Manages conversations persistence and retrieval using Prisma.
 */

import { prisma } from '@/lib/prisma';
import type { Message } from './brain';

export interface SaveConversationParams {
    organizationId: string;
    userId: string;
    messages: Message[];
    context?: string;
    dealId?: string;
    pipelineId?: string;
    tokensUsed: number;
}

export interface ConversationSummary {
    id: string;
    context: string | null;
    summary: string | null;
    tokensUsed: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Save conversation to database
 */
export async function saveConversation(params: SaveConversationParams): Promise<string> {
    const {
        organizationId,
        userId,
        messages,
        context,
        dealId,
        pipelineId,
        tokensUsed,
    } = params;

    // Generate summary (simple: use first user message + last assistant message)
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    let summary = '';
    if (userMessages.length > 0) {
        const firstQuestion = userMessages[0].content.substring(0, 100);
        summary = firstQuestion;

        if (assistantMessages.length > 0) {
            const lastResponse = assistantMessages[assistantMessages.length - 1].content.substring(0, 100);
            summary += ` ... ${lastResponse}`;
        }
    }

    const conversation = await prisma.agiConversation.create({
        data: {
            organizationId,
            userId,
            messages: messages as any, // Prisma will handle JSON
            context,
            dealId,
            pipelineId,
            tokensUsed,
            summary,
        },
    });

    return conversation.id;
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId: string): Promise<{
    messages: Message[];
    tokensUsed: number;
} | null> {
    const conversation = await prisma.agiConversation.findUnique({
        where: { id: conversationId },
    });

    if (!conversation) return null;

    return {
        messages: conversation.messages as unknown as Message[],
        tokensUsed: conversation.tokensUsed,
    };
}

/**
 * Get recent conversations for a user
 */
export async function getRecentConversations(
    organizationId: string,
    userId: string,
    limit: number = 10
): Promise<ConversationSummary[]> {
    const conversations = await prisma.agiConversation.findMany({
        where: {
            organizationId,
            userId,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        select: {
            id: true,
            context: true,
            summary: true,
            tokensUsed: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return conversations;
}

/**
 * Get conversations related to a specific deal
 */
export async function getDealConversations(
    organizationId: string,
    dealId: string
): Promise<ConversationSummary[]> {
    const conversations = await prisma.agiConversation.findMany({
        where: {
            organizationId,
            dealId,
        },
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            context: true,
            summary: true,
            tokensUsed: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return conversations;
}

/**
 * Delete old conversations (data cleanup)
 */
export async function deleteOldConversations(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.agiConversation.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });

    return result.count;
}
