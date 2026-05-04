import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify ownership before delete
  const doc = await prisma.knowledgeDocument.findUnique({
    where: { id },
    select: { organizationId: true },
  })

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (doc.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.knowledgeDocument.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
