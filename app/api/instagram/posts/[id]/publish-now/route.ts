import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPublishNow } from '@/lib/instagram/post-permissions'

export const runtime = 'nodejs'
export const maxDuration = 120

async function postToInstagram(type: string, imageUrls: string[], caption: string, altText: string): Promise<string> {
  const IG_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!
  const TOKEN = process.env.META_ACCESS_TOKEN!
  const BASE = 'https://graph.facebook.com/v21.0'

  async function graphPost(endpoint: string, p: Record<string, string>): Promise<string> {
    const body = new URLSearchParams({ ...p, access_token: TOKEN })
    const res = await fetch(`${BASE}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
    const json = await res.json()
    if (json.error) throw new Error(`Meta API: ${json.error.message}`)
    return json.id
  }

  async function waitContainer(cid: string) {
    const start = Date.now()
    while (Date.now() - start < 60000) {
      const res = await fetch(`${BASE}/${cid}?fields=status_code&access_token=${TOKEN}`)
      const json = await res.json()
      if (json.status_code === 'FINISHED') return
      if (json.status_code === 'ERROR') throw new Error(`Container ${cid} failed`)
      await new Promise(r => setTimeout(r, 3000))
    }
    throw new Error('Container timeout')
  }

  if (type === 'feed') {
    const cid = await graphPost(`/${IG_ID}/media`, { image_url: imageUrls[0], caption, alt_text: altText })
    await waitContainer(cid)
    return graphPost(`/${IG_ID}/media_publish`, { creation_id: cid })
  }
  if (type === 'stories') {
    const cid = await graphPost(`/${IG_ID}/media`, { image_url: imageUrls[0], media_type: 'IMAGE' })
    await waitContainer(cid)
    return graphPost(`/${IG_ID}/media_publish`, { creation_id: cid })
  }
  if (type === 'carousel') {
    const childIds = await Promise.all(imageUrls.map(url => graphPost(`/${IG_ID}/media`, { image_url: url, is_carousel_item: 'true' })))
    await Promise.all(childIds.map(waitContainer))
    const carouselId = await graphPost(`/${IG_ID}/media`, { media_type: 'CAROUSEL', children: childIds.join(','), caption, alt_text: altText })
    await waitContainer(carouselId)
    return graphPost(`/${IG_ID}/media_publish`, { creation_id: carouselId })
  }
  throw new Error(`Unknown type: ${type}`)
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({ where: { id, organizationId: session.user.organizationId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allowed = canPublishNow({ userRole: session.user.orgRole || 'MEMBER', userId: session.user.id, post })
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const caption = `${post.caption}\n\n${post.hashtags}`
    await postToInstagram(post.type, post.imageUrls, caption, post.altText)
    const updated = await prisma.instagramPost.update({ where: { id }, data: { status: 'posted', postedAt: new Date() } })
    return NextResponse.json(updated)
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await prisma.instagramPost.update({ where: { id }, data: { status: 'failed', error } })
    return NextResponse.json({ error }, { status: 500 })
  }
}
