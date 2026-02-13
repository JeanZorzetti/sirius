/**
 * NLP Pipeline API - Batch Process Blog Posts
 *
 * POST /api/nlp/process-blog-posts
 * Processes all blog posts (or only pending ones) through NLP pipeline
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { processBlogPostsBatch } from '@/lib/nlp/blog-processor'
import { blogPosts } from '@/lib/blog-data'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for batch processing

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const body = await request.json()
    const { force = false, slugs } = body

    let slugsToProcess: string[] | undefined = slugs

    // If not forcing and no specific slugs, only process pending posts
    if (!force && !slugs) {
      const processedExtractions = await prisma.entityExtraction.findMany({
        where: {
          contentType: 'blog_post',
          status: 'completed',
        },
        select: {
          contentId: true,
        },
      })

      const processedSlugs = new Set(
        processedExtractions
          .map((e) => e.contentId)
          .filter((id): id is string => id !== null)
      )

      slugsToProcess = blogPosts
        .filter((p) => !processedSlugs.has(p.slug))
        .map((p) => p.slug)

      if (slugsToProcess.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All posts already processed',
          total: 0,
          successful: 0,
          failed: 0,
          results: [],
        })
      }
    }

    // Process posts
    const result = await processBlogPostsBatch(slugsToProcess)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    logger.error({ err: error }, '[API /nlp/process-blog-posts] Error')

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
