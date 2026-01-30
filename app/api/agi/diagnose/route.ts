/**
 * AGI Diagnosis API
 *
 * POST /api/agi/diagnose
 * Diagnoses business problems using knowledge graph traversal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { diagnosticarComGrafo } from '@/lib/agi/graph-skills'
import { z } from 'zod'

export const runtime = 'nodejs'

const DiagnoseRequestSchema = z.object({
  problem: z.string().min(5, 'Problem description must be at least 5 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { problem } = DiagnoseRequestSchema.parse(body)

    const result = await diagnosticarComGrafo(problem)

    return NextResponse.json({
      success: true,
      diagnosis: result,
    })
  } catch (error) {
    console.error('[API /agi/diagnose] Error:', error)

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
