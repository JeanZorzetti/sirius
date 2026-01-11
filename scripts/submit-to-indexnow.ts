#!/usr/bin/env ts-node
/**
 * CLI script to manually submit URLs to IndexNow
 *
 * Usage:
 * npm run indexnow -- /blog/spin-selling-guia-completo
 * npm run indexnow -- /blog/post-1 /blog/post-2 /blog/post-3
 * npm run indexnow -- --all-blog-posts
 */

import { submitUrlToIndexNow, submitUrlsToIndexNow } from '../lib/indexnow'
import { blogPosts } from '../lib/blog-data'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('❌ Error: No URLs provided')
    console.log('\nUsage:')
    console.log('  npm run indexnow -- /blog/spin-selling-guia-completo')
    console.log('  npm run indexnow -- /blog/post-1 /blog/post-2')
    console.log('  npm run indexnow -- --all-blog-posts')
    process.exit(1)
  }

  // Submit all blog posts
  if (args[0] === '--all-blog-posts') {
    console.log('📤 Submitting all blog posts to IndexNow...\n')
    const urls = blogPosts.map((post) => `/blog/${post.slug}`)
    const result = await submitUrlsToIndexNow(urls)

    if (result.success) {
      console.log(`✅ Success! Submitted ${urls.length} blog posts`)
      console.log(`   Status: ${result.statusCode}`)
      console.log('\n📋 URLs submitted:')
      urls.forEach((url) => console.log(`   - ${url}`))
    } else {
      console.error(`❌ Failed: ${result.error}`)
      process.exit(1)
    }
    return
  }

  // Submit single or multiple URLs
  if (args.length === 1) {
    console.log(`📤 Submitting to IndexNow: ${args[0]}\n`)
    const result = await submitUrlToIndexNow(args[0])

    if (result.success) {
      console.log(`✅ Success!`)
      console.log(`   URL: ${result.url}`)
      console.log(`   Status: ${result.statusCode}`)
      console.log('\n💡 Your content will be indexed by Bing, Yandex, and other search engines within minutes!')
    } else {
      console.error(`❌ Failed: ${result.error}`)
      process.exit(1)
    }
  } else {
    console.log(`📤 Submitting ${args.length} URLs to IndexNow...\n`)
    const result = await submitUrlsToIndexNow(args)

    if (result.success) {
      console.log(`✅ Success! Submitted ${args.length} URLs`)
      console.log(`   Status: ${result.statusCode}`)
      console.log('\n📋 URLs submitted:')
      args.forEach((url) => console.log(`   - ${url}`))
    } else {
      console.error(`❌ Failed: ${result.error}`)
      process.exit(1)
    }
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
