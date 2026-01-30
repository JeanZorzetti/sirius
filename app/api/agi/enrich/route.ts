/**
 * AGI Response Enrichment API
 *
 * POST /api/agi/enrich
 * Enriches agent responses with auto-citations and related content.
 */

import { NextRequest, NextResponse } from 'next/server'
import { enriquecerRespostaComCitacoes } from '@/lib/agi/graph-skills'
import { z } from 'zod'

export const runtime = 'nodejs'

const EnrichRequestSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters'),
  userInput: z.string().min(3, 'User input must be at least 3 characters'),
  includeSources: z.boolean().optional().default(true),
  includeRelated: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params = EnrichRequestSchema.parse(body)

    const result = await enriquecerRespostaComCitacoes(params)

    return NextResponse.json({
      success: true,
      enriched: result,
    })
  } catch (error) {
    console.error('[API /agi/enrich] Error:', error)

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
