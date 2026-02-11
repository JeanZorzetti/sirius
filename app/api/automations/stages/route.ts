import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/automations/stages
 * Return all pipeline stages for the current organization (used by the automation builder).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId: user.organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          select: { id: true, name: true, order: true }
        }
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json({ pipelines })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
