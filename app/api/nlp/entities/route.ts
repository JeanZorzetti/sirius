/**
 * NLP Pipeline API - Entity Search Endpoint
 *
 * GET /api/nlp/entities?q=query&limit=10
 * Searches for entities in the knowledge graph.
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { searchEntities } from '@/lib/nlp/pipeline'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const { searchParams } = request.nextUrl
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Allow empty query to return all entities
    const entities = await searchEntities(query, limit)

    return NextResponse.json({
      query,
      count: entities.length,
      entities,
    })
  } catch (error) {
    logger.error({ err: error }, '[API /nlp/entities] Error')

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
