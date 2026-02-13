import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import {
    trackImpression,
    trackInteraction,
    trackConversion,
} from '@/lib/generative-ui/ab-testing'

/**
 * POST /api/ab-testing/[experimentId]/events
 * 
 * Track experiment events (impression, interaction, conversion)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ experimentId: string }> }
) {
    try {
        const { experimentId } = await params
        const body = await request.json()
        const { variantId, userId, sessionId, eventType, metadata } = body

        if (!variantId || !sessionId || !eventType) {
            return NextResponse.json(
                { error: 'variantId, sessionId, and eventType are required' },
                { status: 400 }
            )
        }

        // Track event based on type
        switch (eventType) {
            case 'impression':
                await trackImpression(experimentId, variantId, sessionId, userId)
                break

            case 'interaction':
                await trackInteraction(experimentId, variantId, sessionId, userId, metadata)
                break

            case 'conversion':
                await trackConversion(experimentId, variantId, sessionId, userId, metadata)
                break

            default:
                return NextResponse.json(
                    { error: `Invalid eventType: ${eventType}` },
                    { status: 400 }
                )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        logger.error({ err: error }, '[track-event] Error')
        return NextResponse.json(
            { error: 'Failed to track event' },
            { status: 500 }
        )
    }
}
