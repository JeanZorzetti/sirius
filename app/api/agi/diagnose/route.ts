/**
 * AGI Diagnosis API
 *
 * POST /api/agi/diagnose
 * Diagnoses business problems using knowledge graph traversal.
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { diagnosticarComGrafo } from '@/lib/agi/graph-skills'
import { agiRateLimit } from '@/lib/ratelimit';
import { z } from 'zod'

export const runtime = 'nodejs'

const DiagnoseRequestSchema = z.object({
  problem: z.string().min(5, 'Problem description must be at least 5 characters'),
})

export async function POST(request: NextRequest) {
  const blocked = await agiRateLimit(request)
  if (blocked) return blocked

  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    const { problem } = DiagnoseRequestSchema.parse(body)

    const result = await diagnosticarComGrafo(problem)

    return NextResponse.json({
      success: true,
      diagnosis: result,
    })
  } catch (error) {
    logger.error({ err: error }, '[API /agi/diagnose] Error')

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
