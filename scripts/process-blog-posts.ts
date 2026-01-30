/**
 * Batch Process All Blog Posts - NLP Pipeline
 *
 * Processes all blog posts through the NLP pipeline to extract entities
 * and build the knowledge graph.
 *
 * Usage:
 *   npx tsx scripts/process-blog-posts.ts
 *   npx tsx scripts/process-blog-posts.ts --slug=spin-selling-guia-completo
 *   npx tsx scripts/process-blog-posts.ts --force  (re-process already processed posts)
 */

import { processBlogPostsBatch, getBlogProcessingStats } from '../lib/nlp/blog-processor'
import { blogPosts } from '../lib/blog-data'
import { prisma } from '../lib/prisma'

async function main() {
  const args = process.argv.slice(2)
  const slugArg = args.find((arg) => arg.startsWith('--slug='))
  const forceReprocess = args.includes('--force')

  console.log('🤖 Blog Posts NLP Processor\n')
  console.log('='.repeat(70))

  // Display initial stats
  const initialStats = await getBlogProcessingStats()
  console.log('\n📊 Current Status:\n')
  console.log(`   Total Blog Posts: ${initialStats.totalPosts}`)
  console.log(`   ✅ Already Processed: ${initialStats.processedPosts}`)
  console.log(`   ⏳ Pending: ${initialStats.pendingPosts}`)
  console.log(`   🏷️  Total Entities Extracted: ${initialStats.totalEntitiesExtracted}`)
  console.log(`   📈 Avg Entities/Post: ${initialStats.avgEntitiesPerPost}`)

  // Determine which posts to process
  let slugsToProcess: string[] | undefined

  if (slugArg) {
    const slug = slugArg.replace('--slug=', '')
    const post = blogPosts.find((p) => p.slug === slug)

    if (!post) {
      console.error(`\n❌ Error: Blog post not found: ${slug}`)
      console.log('\nAvailable posts:')
      blogPosts.forEach((p) => console.log(`   - ${p.slug}`))
      process.exit(1)
    }

    slugsToProcess = [slug]
    console.log(`\n🎯 Processing single post: ${post.title}`)
  } else if (!forceReprocess && initialStats.pendingPosts > 0) {
    // Get slugs of posts that haven't been processed yet
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
      processedExtractions.map((e) => e.contentId).filter((id): id is string => id !== null)
    )

    slugsToProcess = blogPosts
      .filter((p) => !processedSlugs.has(p.slug))
      .map((p) => p.slug)

    console.log(`\n🔄 Processing ${slugsToProcess.length} unprocessed posts...`)
  } else if (forceReprocess) {
    console.log('\n♻️  Force reprocessing ALL posts...')
    slugsToProcess = undefined // Process all
  } else {
    console.log('\n✅ All posts already processed!')
    console.log('   Use --force to reprocess or --slug=<slug> for a specific post')
    process.exit(0)
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n🚀 Starting batch processing...\n')

  const startTime = Date.now()
  const result = await processBlogPostsBatch(slugsToProcess)
  const totalTime = Date.now() - startTime

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 BATCH PROCESSING RESULTS:\n')

  console.log(`   Total Posts: ${result.total}`)
  console.log(`   ✅ Successful: ${result.successful}`)
  console.log(`   ❌ Failed: ${result.failed}`)
  console.log(`   ⏱️  Total Time: ${(totalTime / 1000).toFixed(1)}s`)
  console.log(`   ⚡ Avg Time/Post: ${(totalTime / result.total / 1000).toFixed(1)}s\n`)

  // Display detailed results
  console.log('─'.repeat(70))
  console.log('\n📝 Detailed Results:\n')

  for (const r of result.results) {
    if (r.success) {
      console.log(`✅ ${r.title}`)
      console.log(`   Slug: ${r.slug}`)
      console.log(`   Entities: ${r.entitiesCount}`)
      console.log(`   Relationships: ${r.relationshipsCount}`)
      console.log(`   Time: ${((r.processingTimeMs || 0) / 1000).toFixed(1)}s`)
      console.log(`   Tokens: ${r.tokensUsed || 'N/A'}`)
      console.log(`   Extraction ID: ${r.extractionId}\n`)
    } else {
      console.log(`❌ ${r.title || r.slug}`)
      console.log(`   Error: ${r.error}\n`)
    }
  }

  // Display final stats
  const finalStats = await getBlogProcessingStats()

  console.log('─'.repeat(70))
  console.log('\n📊 Final Statistics:\n')
  console.log(`   Total Blog Posts: ${finalStats.totalPosts}`)
  console.log(`   ✅ Processed: ${finalStats.processedPosts}`)
  console.log(`   🏷️  Total Entities: ${finalStats.totalEntitiesExtracted}`)
  console.log(`   📈 Avg Entities/Post: ${finalStats.avgEntitiesPerPost}`)

  console.log('\n' + '='.repeat(70))
  console.log('\n✨ Batch processing complete!\n')

  // Next steps
  console.log('📌 Next steps:')
  console.log('   1. View entities: SELECT * FROM "Entity" LIMIT 20;')
  console.log('   2. View blog entities: SELECT * FROM "ContentEntity" WHERE "contentType" = \'blog_post\';')
  console.log('   3. Test API: curl http://localhost:3000/api/nlp/stats')
  console.log('   4. Test related posts: Import getRelatedPostsByEntities in your code')
  console.log('')
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
