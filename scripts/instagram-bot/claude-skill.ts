/**
 * Entry point for Claude Code (runs locally).
 * Claude generates content and passes it as JSON — this script handles
 * image generation, MinIO upload, and saving to DB queue.
 *
 * Usage:
 *   npx tsx scripts/instagram-bot/claude-skill.ts '{"type":"feed","caption":"...","hashtags":"...","imagePrompt":"...","altText":"..."}'
 *   npx tsx scripts/instagram-bot/claude-skill.ts '{"type":"carousel",...,"slides":["Slide 1","Slide 2",...]}'
 *   npx tsx scripts/instagram-bot/claude-skill.ts queue
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { generateImage, getTempImagePath, cleanupTempImage } from './generate-image'
import { uploadToStorage } from './templates/upload-image'

const prisma = new PrismaClient()

type PostType = 'feed' | 'carousel' | 'stories'

interface ContentInput {
  type: PostType
  caption: string
  hashtags: string
  imagePrompt: string
  altText: string
  slides?: string[]
}

function nextScheduledTime(type: PostType): Date {
  const slots: Record<PostType, { days: number[]; hour: number; minute: number }> = {
    stories:  { days: [1, 2, 3, 4, 5], hour: 8,  minute: 30 },
    feed:     { days: [2, 3, 4],       hour: 9,  minute: 0  },
    carousel: { days: [2, 3, 4],       hour: 12, minute: 30 },
  }
  const slot = slots[type]
  const candidate = new Date()
  // Adjust to Brasília (UTC-3)
  candidate.setUTCHours(slot.hour + 3, slot.minute, 0, 0)

  let attempts = 0
  while (attempts < 14 && (candidate <= new Date() || !slot.days.includes(candidate.getDay()))) {
    candidate.setDate(candidate.getDate() + 1)
    candidate.setUTCHours(slot.hour + 3, slot.minute, 0, 0)
    attempts++
  }
  return candidate
}

async function showQueue() {
  const posts = await prisma.instagramPost.findMany({
    orderBy: { scheduledFor: 'asc' },
    take: 20,
  })
  if (posts.length === 0) { console.log('Queue is empty.'); return }
  console.log('\n📋 Queue:\n')
  for (const p of posts) {
    const icon = p.status === 'posted' ? '✅' : p.status === 'failed' ? '❌' : '⏳'
    console.log(`${icon} [${p.type.toUpperCase()}] id=${p.id}`)
    console.log(`   Scheduled: ${p.scheduledFor.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília)`)
    console.log(`   Caption: ${p.caption.slice(0, 60)}...`)
    if (p.postedAt) console.log(`   Posted at: ${p.postedAt.toISOString()}`)
    if (p.error) console.log(`   Error: ${p.error}`)
    console.log()
  }
}

async function run() {
  const arg = process.argv[2]

  if (arg === 'queue') {
    await showQueue()
    await prisma.$disconnect()
    return
  }

  const content: ContentInput = JSON.parse(arg)
  const { type, caption, hashtags, imagePrompt, altText, slides } = content
  const tmpPaths: string[] = []

  try {
    const ratio = type === 'stories' ? 'portrait' : 'square'

    if (type === 'carousel' && slides?.length) {
      console.log(`\n🖼  Generating ${slides.length} slide images...`)
      for (let i = 0; i < slides.length; i++) {
        const slidePrompt = i === 0 ? imagePrompt : `${imagePrompt}, text: "${slides[i]}"`
        const tmpPath = getTempImagePath(`carousel-${i}`)
        tmpPaths.push(tmpPath)
        process.stdout.write(`  Slide ${i + 1}/${slides.length}... `)
        await generateImage(slidePrompt, 'square', tmpPath)
        console.log('done')
      }
    } else {
      console.log('\n🖼  Generating image...')
      const tmpPath = getTempImagePath(type)
      tmpPaths.push(tmpPath)
      await generateImage(imagePrompt, ratio, tmpPath)
      console.log('✓ Image generated')
    }

    console.log('\n☁️  Uploading to MinIO...')
    const imageUrls = await Promise.all(tmpPaths.map(uploadToStorage))
    console.log(`✓ ${imageUrls.length} image(s) uploaded`)

    const scheduledFor = nextScheduledTime(type)
    const post = await prisma.instagramPost.create({
      data: {
        type,
        caption,
        hashtags,
        altText,
        imageUrls,
        slides: slides ?? [],
        scheduledFor,
        status: 'pending',
      },
    })

    console.log(`\n✅ Queued!`)
    console.log(`   ID: ${post.id}`)
    console.log(`   Scheduled: ${scheduledFor.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília)`)
    console.log(`   Image: ${imageUrls[0]}`)
  } finally {
    tmpPaths.forEach(cleanupTempImage)
    await prisma.$disconnect()
  }
}

run().catch(async err => {
  console.error('❌ Error:', err.message)
  await prisma.$disconnect()
  process.exit(1)
})
