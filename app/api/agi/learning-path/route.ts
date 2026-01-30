/**
 * AGI Learning Path API
 *
 * GET /api/agi/learning-path?topic=SPIN+Selling
 * Generates a progressive learning path for a topic.
 */

import { NextRequest, NextResponse } from 'next/server'
import { gerarCaminhoAprendizado } from '@/lib/agi/graph-skills'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
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
    console.error('[API /agi/learning-path] Error:', error)

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
