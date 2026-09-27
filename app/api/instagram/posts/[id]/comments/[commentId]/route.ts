import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserRole } from '@/lib/instagram/get-user-role'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await getSession()
  // undefined in a Prisma filter means 'no filter': a session without an organization is refused
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, commentId } = await params
  const { resolved } = await req.json()
  // The comment must belong to this post, in the caller's organization
  const alterados = await prisma.instagramPostComment.updateMany({
    where: { id: commentId, postId: id, post: { organizationId: session.user.organizationId } },
    data: { resolved },
  })
  if (alterados.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await prisma.instagramPostComment.findFirst({
    where: { id: commentId, post: { organizationId: session.user.organizationId } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await getSession()
  // undefined in a Prisma filter means 'no filter': a session without an organization is refused
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, commentId } = await params
  const comment = await prisma.instagramPostComment.findFirst({
    where: { id: commentId, postId: id, post: { organizationId: session.user.organizationId } },
  })
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const userRole = await getUserRole(session.user.id)
  if (comment.userId !== session.user.id && userRole !== 'OWNER' && userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await prisma.instagramPostComment.delete({ where: { id: comment.id } })
  return NextResponse.json({ success: true })
}
