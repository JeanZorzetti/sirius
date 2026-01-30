/**
 * NLP Pipeline - Auto-Reprocessing System
 *
 * Automatically detects content changes and triggers re-extraction
 * when blog posts are updated.
 */

'use server'

import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { processBlogPost } from './blog-processor'

/**
 * Calculate SHA-256 hash of content for change detection
 * Note: Not a server action, just a utility function
 */
function calculateContentHash(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex')
}

/**
 * Check if content has changed since last extraction
 */
export async function hasContentChanged(
  contentId: string,
  contentType: string,
  currentContent: string
): Promise<boolean> {
  const currentHash = calculateContentHash(currentContent)

  const lastExtraction = await prisma.entityExtraction.findFirst({
    where: {
      contentType,
      contentId,
      status: 'completed',
    },
    orderBy: {
      completedAt: 'desc',
    },
    select: {
      contentHash: true,
    },
  })

  // If no previous extraction or no hash stored, consider it changed
  if (!lastExtraction || !lastExtraction.contentHash) {
    return true
  }

  // Compare hashes
  return lastExtraction.contentHash !== currentHash
}

/**
 * Process content only if it has changed since last extraction
 */
export async function processIfChanged(params: {
  contentId: string
  contentType: string
  content: string
  forceReprocess?: boolean
}) {
  const { contentId, contentType, content, forceReprocess = false } = params

  // Check if content changed
  if (!forceReprocess) {
    const changed = await hasContentChanged(contentId, contentType, content)

    if (!changed) {
      console.log(`[Auto-Reprocess] Content unchanged for ${contentType}:${contentId}, skipping`)
      return {
        success: true,
        skipped: true,
        reason: 'Content unchanged',
      }
    }
  }

  console.log(`[Auto-Reprocess] Content changed for ${contentType}:${contentId}, reprocessing...`)

  // Reprocess
  if (contentType === 'blog_post') {
    return await processBlogPost(contentId)
  }

  // Add other content types here as needed
  return {
    success: false,
    error: `Unsupported content type: ${contentType}`,
  }
}

/**
 * Get posts that need reprocessing (content changed)
 */
export async function getPostsNeedingReprocessing(posts: Array<{ slug: string; content: string }>) {
  const postsToReprocess: string[] = []

  for (const post of posts) {
    const changed = await hasContentChanged('blog_post', post.slug, post.content)
    if (changed) {
      postsToReprocess.push(post.slug)
    }
  }

  return postsToReprocess
}

/**
 * Webhook handler for content updates
 *
 * Call this endpoint when content is updated externally
 * POST /api/nlp/reprocess-webhook
 */
export interface ReprocessWebhookPayload {
  contentType: string
  contentId: string
  content: string
  trigger: 'manual' | 'cms_update' | 'scheduled' | 'api'
}

export async function handleReprocessWebhook(payload: ReprocessWebhookPayload) {
  const { contentType, contentId, content, trigger } = payload

  console.log(`[Reprocess Webhook] Triggered by: ${trigger}`)
  console.log(`[Reprocess Webhook] Content: ${contentType}:${contentId}`)

  try {
    const result = await processIfChanged({
      contentId,
      contentType,
      content,
      forceReprocess: trigger === 'manual', // Force if manual trigger
    })

    return {
      success: true,
      trigger,
      ...result,
    }
  } catch (error) {
    console.error('[Reprocess Webhook] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
