/**
 * NLP Pipeline - Blog Post Processor
 *
 * Automated entity extraction for blog content with knowledge graph integration.
 */

'use server'

import { processContentNLP, searchEntities, findRelatedEntities } from './pipeline'
import { blogPosts } from '@/lib/blog-data'
import { BlogPost } from '@/lib/blog-types'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

/**
 * Process a single blog post through NLP pipeline
 */
export async function processBlogPost(slug: string) {
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) {
    return {
      success: false,
      error: `Blog post not found: ${slug}`,
    }
  }

  // Strip HTML tags from content for better entity extraction
  const cleanContent = stripHtml(post.content)

  // Combine title, excerpt, and content for comprehensive extraction
  const fullText = `
    ${post.title}

    ${post.excerpt}

    ${cleanContent}
  `.trim()

  try {
    const result = await processContentNLP({
      text: fullText,
      contentType: 'blog_post',
      contentId: slug,
      contentUrl: `/blog/${slug}`,
    })

    return {
      success: result.success,
      slug,
      title: post.title,
      extractionId: result.extractionId,
      entitiesCount: result.data?.entities.length || 0,
      relationshipsCount: result.data?.relationships.length || 0,
      processingTimeMs: result.processingTimeMs,
      tokensUsed: result.tokensUsed,
      error: result.error,
    }
  } catch (error) {
    return {
      success: false,
      slug,
      title: post.title,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Process multiple blog posts in batch
 */
export async function processBlogPostsBatch(slugs?: string[]) {
  const postsToProcess = slugs
    ? blogPosts.filter((p) => slugs.includes(p.slug))
    : blogPosts

  const results = []

  for (const post of postsToProcess) {
    logger.info({ title: post.title }, 'Processing blog post')
    const result = await processBlogPost(post.slug)
    results.push(result)

    // Wait 500ms between posts to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return {
    total: results.length,
    successful,
    failed,
    results,
  }
}

/**
 * Get all entities extracted from a specific blog post
 */
export async function getPostEntities(slug: string) {
  try {
    const contentEntities = await prisma.contentEntity.findMany({
      where: {
        contentType: 'blog_post',
        contentId: slug,
      },
      include: {
        entity: true,
      },
      orderBy: {
        relevance: 'desc',
      },
    })

    return contentEntities.map((ce) => ({
      ...ce.entity,
      relevance: ce.relevance,
      context: ce.context,
    }))
  } catch (error) {
    console.error(`[getPostEntities] Error for ${slug}:`, error)
    return []
  }
}

/**
 * Find related blog posts based on shared entities (knowledge graph)
 */
export async function getRelatedPostsByEntities(
  slug: string,
  limit = 3
): Promise<BlogPost[]> {
  try {
    // Get entities from current post
    const postEntities = await getPostEntities(slug)

    if (postEntities.length === 0) {
      // Fallback to random posts if no entities found
      return blogPosts.filter((p) => p.slug !== slug).slice(0, limit)
    }

    // Get all blog posts that share entities with current post
    const relatedContentEntities = await prisma.contentEntity.findMany({
      where: {
        contentType: 'blog_post',
        contentId: { not: slug },
        entityId: {
          in: postEntities.map((e) => e.id),
        },
      },
      select: {
        contentId: true,
        relevance: true,
        entityId: true,
      },
    })

    // Calculate similarity score (number of shared entities + weighted by relevance)
    const scoreMap = new Map<string, number>()

    for (const ce of relatedContentEntities) {
      const currentScore = scoreMap.get(ce.contentId) || 0
      scoreMap.set(ce.contentId, currentScore + ce.relevance)
    }

    // Sort by score and get top N
    const rankedSlugs = Array.from(scoreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([slug]) => slug)

    // Return full BlogPost objects in ranked order
    const relatedPosts = rankedSlugs
      .map((relatedSlug) => blogPosts.find((p) => p.slug === relatedSlug))
      .filter((p): p is BlogPost => p !== undefined)

    // If not enough related posts, fill with random ones
    if (relatedPosts.length < limit) {
      const remaining = blogPosts
        .filter((p) => p.slug !== slug && !rankedSlugs.includes(p.slug))
        .slice(0, limit - relatedPosts.length)

      return [...relatedPosts, ...remaining]
    }

    return relatedPosts
  } catch (error) {
    console.error(`[getRelatedPostsByEntities] Error for ${slug}:`, error)
    // Fallback to random posts
    return blogPosts.filter((p) => p.slug !== slug).slice(0, limit)
  }
}

/**
 * Get statistics about blog post processing
 */
export async function getBlogProcessingStats() {
  try {
    const totalPosts = blogPosts.length

    // Count unique posts that have been processed (not total extractions)
    const uniqueProcessedPosts = await prisma.entityExtraction.groupBy({
      by: ['contentId'],
      where: {
        contentType: 'blog_post',
        status: 'completed',
        contentId: {
          not: null,
        },
      },
    })

    const processedPosts = uniqueProcessedPosts.length

    const totalEntitiesExtracted = await prisma.contentEntity.count({
      where: {
        contentType: 'blog_post',
      },
    })

    const recentExtractions = await prisma.entityExtraction.findMany({
      where: {
        contentType: 'blog_post',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        contentId: true,
        status: true,
        tokensUsed: true,
        processingTimeMs: true,
        createdAt: true,
        completedAt: true,
      },
    })

    return {
      totalPosts,
      processedPosts,
      pendingPosts: Math.max(0, totalPosts - processedPosts),
      totalEntitiesExtracted,
      avgEntitiesPerPost:
        processedPosts > 0
          ? (totalEntitiesExtracted / processedPosts).toFixed(1)
          : '0',
      recentExtractions,
    }
  } catch (error) {
    console.error('[getBlogProcessingStats] Error:', error)
    return {
      totalPosts: blogPosts.length,
      processedPosts: 0,
      pendingPosts: blogPosts.length,
      totalEntitiesExtracted: 0,
      avgEntitiesPerPost: '0',
      recentExtractions: [],
    }
  }
}

/**
 * Check if a blog post has been processed
 */
export async function isPostProcessed(slug: string): Promise<boolean> {
  try {
    const extraction = await prisma.entityExtraction.findFirst({
      where: {
        contentType: 'blog_post',
        contentId: slug,
        status: 'completed',
      },
    })

    return extraction !== null
  } catch (error) {
    return false
  }
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove HTML tags but preserve spacing
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ')
  text = text.trim()

  return text
}
