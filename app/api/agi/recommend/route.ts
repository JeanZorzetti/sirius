/**
 * AGI Content Recommendation API
 *
 * POST /api/agi/recommend
 * Recommends relevant content based on conversation context.
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { recomendarConteudo } from '@/lib/agi/graph-skills'
import { agiRateLimit } from '@/lib/ratelimit';
import { z } from 'zod'

export const runtime = 'nodejs'

const RecommendRequestSchema = z.object({
  userInput: z.string().min(3, 'User input must be at least 3 characters'),
  conversationHistory: z.array(z.string()).optional(),
  currentTopic: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const blocked = await agiRateLimit(request)
  if (blocked) return blocked

  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    const params = RecommendRequestSchema.parse(body)

    const result = await recomendarConteudo(params)

    return NextResponse.json({
      success: true,
      recommendations: result,
    })
  } catch (error) {
    logger.error({ err: error }, '[API /agi/recommend] Error')

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro de validação',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
