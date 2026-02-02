import { NextRequest, NextResponse } from 'next/server'
import { getVariantForUser } from '@/lib/generative-ui/ab-testing'

/**
 * POST /api/ab-testing/[experimentId]/assign
 * 
 * Assign variant to user for given experiment
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { experimentId: string } }
) {
    try {
        const { experimentId } = params
        const body = await request.json()
        const { userId } = body

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            )
        }

        const variant = await getVariantForUser(experimentId, userId)

        if (!variant) {
            // Experiment not running or doesn't exist
            return NextResponse.json({ variant: null })
        }

        return NextResponse.json({ variant })
    } catch (error) {
        console.error('[assign-variant] Error:', error)
        return NextResponse.json(
            { error: 'Failed to assign variant' },
            { status: 500 }
        )
    }
}
