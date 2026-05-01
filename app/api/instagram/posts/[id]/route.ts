import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canEdit, canDelete } from '@/lib/instagram/post-permissions'
import { getUserRole } from '@/lib/instagram/get-user-role'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      createdBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({ where: { id, organizationId: session.user.organizationId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userRole = await getUserRole(session.user.id)
  const allowed = canEdit({ userRole, userId: session.user.id, post })
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { caption, hashtags, altText, imageUrls, slides, scheduledFor, status, recurrenceRule, recurrenceEndDate } = body

  const updated = await prisma.instagramPost.update({
    where: { id },
    data: {
      ...(caption !== undefined && { caption }),
      ...(hashtags !== undefined && { hashtags }),
      ...(altText !== undefined && { altText }),
      ...(imageUrls !== undefined && { imageUrls }),
      ...(slides !== undefined && { slides }),
      ...(scheduledFor !== undefined && { scheduledFor: new Date(scheduledFor) }),
      ...(status !== undefined && { status }),
      ...(recurrenceRule !== undefined && { recurrenceRule }),
      ...(recurrenceEndDate !== undefined && { recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({ where: { id, organizationId: session.user.organizationId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userRole2 = await getUserRole(session.user.id)
  const allowed = canDelete({ userRole: userRole2, userId: session.user.id, post })
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.instagramPost.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
