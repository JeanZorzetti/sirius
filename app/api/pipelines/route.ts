import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

async function getOrgUser() {
  const session = await getSession()
  if (!session?.user?.email) return null
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })
}

export async function GET() {
  try {
    const user = await getOrgUser()
    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        name: true,
        isDefault: true,
        stages: {
          select: { id: true, name: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(pipelines)
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
