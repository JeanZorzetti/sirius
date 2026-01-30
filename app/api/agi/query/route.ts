/**
 * Graph-Augmented RAG Query API
 *
 * POST /api/agi/query
 * Queries knowledge base using graph-augmented retrieval.
 */

import { NextRequest, NextResponse } from 'next/server'
import { queryGraphKnowledgeBase, buildGraphAugmentedPrompt } from '@/lib/nlp/graph-rag'
import { z } from 'zod'

export const runtime = 'nodejs'

const QueryRequestSchema = z.object({
  query: z.string().min(5, 'Query must be at least 5 characters'),
  includePrompt: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
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
    console.error('[API /agi/query] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
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
