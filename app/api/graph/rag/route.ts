/**
 * Graph-RAG API Endpoint
 *
 * POST /api/graph/rag
 * Tests the Graph-Augmented Retrieval system
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { retrieveWithGraphAugmentation } from '@/lib/nlp/graph-rag'
import { z } from 'zod'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters'),
  maxEntities: z.number().optional().default(5),
  graphDepth: z.number().optional().default(2),
  maxContent: z.number().optional().default(10),
  minRelevance: z.number().optional().default(0.3),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    const params = QuerySchema.parse(body)

    const context = await retrieveWithGraphAugmentation(params.query, {
      maxEntities: params.maxEntities,
      graphDepth: params.graphDepth,
      maxContent: params.maxContent,
      minRelevance: params.minRelevance,
    })

    return NextResponse.json({
      success: true,
      context,
    })
  } catch (error) {
    logger.error({ err: error }, '[API /graph/rag] Error')

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
