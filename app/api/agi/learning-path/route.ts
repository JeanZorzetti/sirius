/**
 * AGI Learning Path API
 *
 * GET /api/agi/learning-path?topic=SPIN+Selling
 * Generates a progressive learning path for a topic.
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { gerarCaminhoAprendizado } from '@/lib/agi/graph-skills'
import { agiRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const blocked = await agiRateLimit(request)
  if (blocked) return blocked

  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const { searchParams } = request.nextUrl
    const topic = searchParams.get('topic')

    if (!topic || topic.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Topic parameter is required and must be at least 3 characters',
        },
        { status: 400 }
      )
    }

    const result = await gerarCaminhoAprendizado(topic)

    return NextResponse.json({
      success: true,
      learningPath: result,
    })
  } catch (error) {
    logger.error({ err: error }, '[API /agi/learning-path] Error')

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
