import { NextRequest, NextResponse } from 'next/server'
import { calculateResults } from '@/lib/generative-ui/ab-testing'

/**
 * GET /api/ab-testing/[experimentId]/results
 * 
 * Get experiment results with statistical analysis
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { experimentId: string } }
) {
    try {
        const { experimentId } = params

        const results = await calculateResults(experimentId)

        return NextResponse.json({ results })
    } catch (error) {
        console.error('[get-results] Error:', error)
        return NextResponse.json(
            { error: 'Failed to calculate results' },
            { status: 500 }
        )
    }
}
