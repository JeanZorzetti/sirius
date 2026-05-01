import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizationId = session.user.organizationId
  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = { organizationId }
  if (status) where.status = status
  if (type) where.type = type
  if (from || to) {
    where.scheduledFor = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }
  if (search) where.caption = { contains: search, mode: 'insensitive' }

  const posts = await prisma.instagramPost.findMany({
    where,
    orderBy: { scheduledFor: 'asc' },
    take: 200,
    include: {
      _count: { select: { comments: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, caption, hashtags, altText, imageUrls, slides, scheduledFor, status } = body

  if (!type || !caption || !scheduledFor) {
    return NextResponse.json({ error: 'type, caption and scheduledFor are required' }, { status: 400 })
  }

  const post = await prisma.instagramPost.create({
    data: {
      organizationId: session.user.organizationId,
      createdById: session.user.id,
      type,
      caption,
      hashtags: hashtags ?? '',
      altText: altText ?? '',
      imageUrls: imageUrls ?? [],
      slides: slides ?? [],
      scheduledFor: new Date(scheduledFor),
      status: status ?? 'draft',
    },
    include: { _count: { select: { comments: true } } },
  })

  return NextResponse.json(post)
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizationId = session.user.organizationId
  const { id } = await request.json()
  await prisma.instagramPost.deleteMany({ where: { id, organizationId } })

  return NextResponse.json({ success: true })
}
