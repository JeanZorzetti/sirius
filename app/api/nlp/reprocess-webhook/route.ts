/**
 * NLP Pipeline API - Auto-Reprocess Webhook
 *
 * POST /api/nlp/reprocess-webhook
 * Webhook endpoint for triggering automatic reprocessing when content changes
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  handleReprocessWebhook,
  type ReprocessWebhookPayload,
} from '@/lib/nlp/auto-reprocess'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const payload: ReprocessWebhookPayload = await request.json()

    // Validate required fields
    if (!payload.contentType || !payload.contentId || !payload.content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: contentType, contentId, content',
        },
        { status: 400 }
      )
    }

    // Process webhook
    const result = await handleReprocessWebhook(payload)

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ err: error }, '[API /nlp/reprocess-webhook] Error')

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

/**
 * GET handler to check webhook status
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/nlp/reprocess-webhook',
    method: 'POST',
    description: 'Webhook for automatic content reprocessing on updates',
    payload: {
      contentType: 'blog_post',
      contentId: 'post-slug',
      content: 'Full text content...',
      trigger: 'manual | cms_update | scheduled | api',
    },
  })
}
