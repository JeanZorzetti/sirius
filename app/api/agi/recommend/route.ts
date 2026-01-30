/**
 * AGI Content Recommendation API
 *
 * POST /api/agi/recommend
 * Recommends relevant content based on conversation context.
 */

import { NextRequest, NextResponse } from 'next/server'
import { recomendarConteudo } from '@/lib/agi/graph-skills'
import { z } from 'zod'

export const runtime = 'nodejs'

const RecommendRequestSchema = z.object({
  userInput: z.string().min(3, 'User input must be at least 3 characters'),
  conversationHistory: z.array(z.string()).optional(),
  currentTopic: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params = RecommendRequestSchema.parse(body)

    const result = await recomendarConteudo(params)

    return NextResponse.json({
      success: true,
      recommendations: result,
    })
  } catch (error) {
    console.error('[API /agi/recommend] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
