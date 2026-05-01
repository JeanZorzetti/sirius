import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const posts = await prisma.instagramPost.findMany({
    orderBy: { scheduledFor: 'desc' },
    take: 50,
  })

  return NextResponse.json(posts)
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await prisma.instagramPost.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
