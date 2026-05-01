import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizationId = session.user.organizationId
  const posts = await prisma.instagramPost.findMany({
    where: { organizationId },
    orderBy: { scheduledFor: 'desc' },
    take: 50,
  })

  return NextResponse.json(posts)
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizationId = session.user.organizationId
  const { id } = await request.json()
  await prisma.instagramPost.deleteMany({ where: { id, organizationId } })

  return NextResponse.json({ success: true })
}
