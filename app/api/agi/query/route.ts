/**
 * Graph-Augmented RAG Query API
 *
 * POST /api/agi/query
 * Queries knowledge base using graph-augmented retrieval.
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { queryGraphKnowledgeBase, buildGraphAugmentedPrompt } from '@/lib/nlp/graph-rag'
import { agiRateLimit } from '@/lib/ratelimit';
import { z } from 'zod'

export const runtime = 'nodejs'

const QueryRequestSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters'),
  includePrompt: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  const blocked = await agiRateLimit(request)
  if (blocked) return blocked

  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    const { query, includePrompt } = QueryRequestSchema.parse(body)

    if (includePrompt) {
      // Return enriched prompt for LLM integration
      const result = await buildGraphAugmentedPrompt(query)
      return NextResponse.json({
        success: true,
        data: result,
      })
    } else {
      // Return simplified response
      const result = await queryGraphKnowledgeBase(query)
      return NextResponse.json({
        success: true,
        data: result,
      })
    }
  } catch (error) {
    logger.error({ err: error }, '[API /agi/query] Error')

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
