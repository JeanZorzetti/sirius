import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 300

async function postToInstagram(
  type: string,
  imageUrls: string[],
  caption: string,
  altText: string
): Promise<string> {
  const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!
  const TOKEN = process.env.META_ACCESS_TOKEN!
  const BASE = 'https://graph.facebook.com/v21.0'

  async function graphPost(endpoint: string, params: Record<string, string>): Promise<string> {
    const body = new URLSearchParams({ ...params, access_token: TOKEN })
    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const json = await res.json()
    if (json.error) throw new Error(`Meta API: ${json.error.message}`)
    return json.id
  }

  async function waitForContainer(containerId: string): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < 60000) {
      const res = await fetch(
        `${BASE}/${containerId}?fields=status_code&access_token=${TOKEN}`
      )
      const json = await res.json()
      if (json.status_code === 'FINISHED') return
      if (json.status_code === 'ERROR') throw new Error(`Container ${containerId} failed`)
      await new Promise(r => setTimeout(r, 3000))
    }
    throw new Error('Container processing timeout')
  }

  if (type === 'feed') {
    const containerId = await graphPost(`/${IG_ID}/media`, {
      image_url: imageUrls[0],
      caption,
      alt_text: altText,
    })
    await waitForContainer(containerId)
    return graphPost(`/${IG_ID}/media_publish`, { creation_id: containerId })
  }

  if (type === 'stories') {
    const containerId = await graphPost(`/${IG_ID}/media`, {
      image_url: imageUrls[0],
      media_type: 'IMAGE',
    })
    await waitForContainer(containerId)
    return graphPost(`/${IG_ID}/media_publish`, { creation_id: containerId })
  }

  if (type === 'carousel') {
    const childIds = await Promise.all(
      imageUrls.map(url =>
        graphPost(`/${IG_ID}/media`, { image_url: url, is_carousel_item: 'true' })
      )
    )
    await Promise.all(childIds.map(waitForContainer))
    const carouselId = await graphPost(`/${IG_ID}/media`, {
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption,
      alt_text: altText,
    })
    await waitForContainer(carouselId)
    return graphPost(`/${IG_ID}/media_publish`, { creation_id: carouselId })
  }

  throw new Error(`Unknown post type: ${type}`)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const urlToken = request.nextUrl.searchParams.get('token')
  const cronSecret = process.env.CRON_SECRET

  const isValid =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && urlToken === cronSecret)

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const pending = await prisma.instagramPost.findMany({
    where: { status: 'pending', scheduledFor: { lte: now } },
    orderBy: { scheduledFor: 'asc' },
  })

  if (pending.length === 0) {
    return NextResponse.json({ success: true, posted: 0, message: 'No posts due' })
  }

  logger.info(`[instagram-poster] ${pending.length} post(s) due`)

  const results = []
  for (const post of pending) {
    try {
      const caption = `${post.caption}\n\n${post.hashtags}`
      await postToInstagram(post.type, post.imageUrls, caption, post.altText)

      await prisma.instagramPost.update({
        where: { id: post.id },
        data: { status: 'posted', postedAt: new Date() },
      })

      logger.info(`[instagram-poster] Posted ${post.type} id=${post.id}`)
      results.push({ id: post.id, type: post.type, status: 'posted' })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      await prisma.instagramPost.update({
        where: { id: post.id },
        data: { status: 'failed', error },
      })
      logger.error(`[instagram-poster] Failed id=${post.id}: ${error}`)
      results.push({ id: post.id, type: post.type, status: 'failed', error })
    }
  }

  return NextResponse.json({ success: true, posted: results.filter(r => r.status === 'posted').length, results })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
