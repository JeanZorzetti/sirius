/**
 * NLP Pipeline API - Knowledge Graph Statistics
 *
 * GET /api/nlp/stats
 * Returns statistics about the knowledge graph (entities, relationships, extractions).
 */

import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getGraphStats } from '@/lib/nlp/pipeline'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const stats = await getGraphStats()

    return NextResponse.json(stats)
  } catch (error) {
    logger.error({ err: error }, '[API /nlp/stats] Error')

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
