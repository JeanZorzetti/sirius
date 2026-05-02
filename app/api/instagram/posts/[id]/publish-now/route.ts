import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canPublishNow } from '@/lib/instagram/post-permissions'
import { getUserRole } from '@/lib/instagram/get-user-role'
import { decrypt } from '@/lib/encryption'

export const runtime = 'nodejs'
export const maxDuration = 120

async function postToInstagram(
  type: string,
  imageUrls: string[],
  caption: string,
  altText: string,
  igId: string,
  token: string
): Promise<string> {
  const BASE = 'https://graph.facebook.com/v21.0'

  async function graphPost(endpoint: string, p: Record<string, string>): Promise<string> {
    const body = new URLSearchParams({ ...p, access_token: token })
    const res = await fetch(`${BASE}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
    const json = await res.json()
    if (json.error) throw new Error(`Meta API: ${json.error.message}`)
    return json.id
  }

  async function waitContainer(cid: string) {
    const start = Date.now()
    while (Date.now() - start < 60000) {
      const res = await fetch(`${BASE}/${cid}?fields=status_code&access_token=${token}`)
      const json = await res.json()
      if (json.status_code === 'FINISHED') return
      if (json.status_code === 'ERROR') throw new Error(`Container ${cid} failed`)
      await new Promise(r => setTimeout(r, 3000))
    }
    throw new Error('Container timeout')
  }

  if (type === 'feed') {
    const cid = await graphPost(`/${igId}/media`, { image_url: imageUrls[0], caption, alt_text: altText })
    await waitContainer(cid)
    return graphPost(`/${igId}/media_publish`, { creation_id: cid })
  }
  if (type === 'stories') {
    const cid = await graphPost(`/${igId}/media`, { image_url: imageUrls[0], media_type: 'IMAGE' })
    await waitContainer(cid)
    return graphPost(`/${igId}/media_publish`, { creation_id: cid })
  }
  if (type === 'carousel') {
    const childIds = await Promise.all(imageUrls.map(url => graphPost(`/${igId}/media`, { image_url: url, is_carousel_item: 'true' })))
    await Promise.all(childIds.map(waitContainer))
    const carouselId = await graphPost(`/${igId}/media`, { media_type: 'CAROUSEL', children: childIds.join(','), caption, alt_text: altText })
    await waitContainer(carouselId)
    return graphPost(`/${igId}/media_publish`, { creation_id: carouselId })
  }
  throw new Error(`Unknown type: ${type}`)
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      organization: {
        select: {
          instagramPageAccessToken:   true,
          instagramBusinessAccountId: true,
        },
      },
    },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userRole = await getUserRole(session.user.id)
  const allowed = canPublishNow({ userRole, userId: session.user.id, post })
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Resolve credentials: org token takes priority, fall back to env vars
  const encryptedToken = post.organization?.instagramPageAccessToken
  const token = encryptedToken
    ? decrypt(encryptedToken)
    : process.env.META_ACCESS_TOKEN!
  const igId = post.organization?.instagramBusinessAccountId
    ?? process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!

  try {
    const caption = `${post.caption}\n\n${post.hashtags}`
    await postToInstagram(post.type, post.imageUrls, caption, post.altText, igId, token)
    const updated = await prisma.instagramPost.update({ where: { id }, data: { status: 'posted', postedAt: new Date() } })
    return NextResponse.json(updated)
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await prisma.instagramPost.update({ where: { id }, data: { status: 'failed', error } })
    return NextResponse.json({ error }, { status: 500 })
  }
}
