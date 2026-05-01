import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({ where: { id, organizationId: session.user.organizationId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const comments = await prisma.instagramPostComment.findMany({
    where: { postId: id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({ where: { id, organizationId: session.user.organizationId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const comment = await prisma.instagramPostComment.create({
    data: { postId: id, userId: session.user.id, content: content.trim() },
    include: { user: { select: { id: true, name: true } } },
  })
  return NextResponse.json(comment)
}
