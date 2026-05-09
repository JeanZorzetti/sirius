import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const dynamic = 'force-dynamic'

// GET /api/scraping/jobs - Listar jobs do usuário
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ jobs: [] })
    }

    const jobs = await prisma.scrapingJob.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        query: true,
        status: true,
        resultsCount: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching scraping jobs')
    return NextResponse.json({ jobs: [] })
  }
}
