import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { commentId } = await params
  const { resolved } = await req.json()
  const updated = await prisma.instagramPostComment.update({ where: { id: commentId }, data: { resolved } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { commentId } = await params
  const comment = await prisma.instagramPostComment.findUnique({ where: { id: commentId } })
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (comment.userId !== session.user.id && session.user.orgRole !== 'OWNER' && session.user.orgRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await prisma.instagramPostComment.delete({ where: { id: commentId } })
  return NextResponse.json({ success: true })
}
