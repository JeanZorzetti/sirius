import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/scraping/jobs/[id] - Detalhes de um job
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    const job = await prisma.scrapingJob.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        query: true,
        status: true,
        resultsCount: true,
        creditsUsed: true,
        results: true,
        error: true,
        createdAt: true,
        completedAt: true,
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching scraping job')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
