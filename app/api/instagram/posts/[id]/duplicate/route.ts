import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nextScheduledTime } from '@/lib/instagram/scheduling'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({ where: { id, organizationId: session.user.organizationId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const copy = await prisma.instagramPost.create({
    data: {
      organizationId: post.organizationId,
      type: post.type,
      caption: post.caption,
      hashtags: post.hashtags,
      altText: post.altText,
      imageUrls: post.imageUrls,
      slides: post.slides,
      scheduledFor: nextScheduledTime(post.type as 'feed' | 'carousel' | 'stories'),
      status: 'draft',
      createdById: session.user.id,
    },
  })
  return NextResponse.json(copy)
}
