/**
 * NLP Pipeline API - Entity Extraction Endpoint
 *
 * POST /api/nlp/extract
 * Processes content and extracts entities + relationships using LLM.
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { processContentNLP } from '@/lib/nlp/pipeline'
import type { ExtractionRequest } from '@/lib/nlp/types'

export const runtime = 'nodejs' // Cannot use Edge Runtime due to Prisma
export const maxDuration = 60 // 60 seconds timeout for LLM processing

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const body = (await request.json()) as ExtractionRequest

    // Validate request
    if (!body.text || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty "text" field' },
        { status: 400 }
      )
    }

    if (body.text.length > 50000) {
      return NextResponse.json(
        { error: 'Text too long (max 50,000 characters)' },
        { status: 400 }
      )
    }

    // Process through NLP pipeline
    const result = await processContentNLP(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    logger.error({ err: error }, '[API /nlp/extract] Error')

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
