/**
 * AGI Relationship Explanation API
 *
 * GET /api/agi/explain-relationship?concept1=CRM&concept2=conversão
 * Explains how two concepts are related using graph traversal.
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { explicarRelacionamento } from '@/lib/agi/graph-skills'
import { agiRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const blocked = await agiRateLimit(request)
  if (blocked) return blocked

  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const { searchParams } = request.nextUrl
    const concept1 = searchParams.get('concept1')
    const concept2 = searchParams.get('concept2')

    if (!concept1 || !concept2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both concept1 and concept2 parameters are required',
        },
        { status: 400 }
      )
    }

    if (concept1.length < 2 || concept2.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Concepts must be at least 2 characters',
        },
        { status: 400 }
      )
    }

    const result = await explicarRelacionamento(concept1, concept2)

    return NextResponse.json({
      success: true,
      relationship: result,
    })
  } catch (error) {
    logger.error({ err: error }, '[API /agi/explain-relationship] Error')

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
