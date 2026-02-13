/**
 * AGI Test Endpoint - Verifies Ollama connection
 * GET /api/agi/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import logger from '@/lib/logger';
import { agiRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const auth = await requireAuth()
    if (auth instanceof Response) return auth
    try {
        const ollamaHost = process.env.AGI_OLLAMA_HOST || 'http://localhost:11434';

        logger.info({ ollamaHost }, 'Testing Ollama connection');

        const response = await fetch(`${ollamaHost}/api/tags`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            host: ollamaHost,
            status: 'connected',
            models: data.models.map((m: any) => ({
                name: m.name,
                size: `${(m.size / 1024 / 1024 / 1024).toFixed(2)} GB`,
                family: m.details?.family,
                parameters: m.details?.parameter_size,
            })),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ err: error }, 'Ollama connection test failed');

        return NextResponse.json({
            success: false,
            host: process.env.AGI_OLLAMA_HOST || 'not configured',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: 'Check if AGI_OLLAMA_HOST is set correctly in Vercel environment variables',
        }, { status: 503 });
    }
}
