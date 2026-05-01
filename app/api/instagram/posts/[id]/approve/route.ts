import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canApprove } from '@/lib/instagram/post-permissions'
import { getUserRole } from '@/lib/instagram/get-user-role'

export const runtime = 'nodejs'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const post = await prisma.instagramPost.findFirst({ where: { id, organizationId: session.user.organizationId } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userRole = await getUserRole(session.user.id)
  const allowed = canApprove({ userRole, userId: session.user.id, post })
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updated = await prisma.instagramPost.update({
    where: { id },
    data: { status: 'scheduled', approvedById: session.user.id, approvedAt: new Date() },
  })
  return NextResponse.json(updated)
}
