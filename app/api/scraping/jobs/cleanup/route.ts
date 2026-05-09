import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const dynamic = 'force-dynamic'

/**
 * Limpa jobs antigos travados em RUNNING ou PENDING
 * Executa automaticamente ou manualmente via API
 */
export async function POST() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    // Jobs travados há mais de 10 minutos
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

    const stuckJobs = await prisma.scrapingJob.findMany({
      where: {
        status: { in: ['RUNNING', 'PENDING'] },
        startedAt: { lt: tenMinutesAgo },
        OR: [
          { completedAt: null },
          { completedAt: { gt: tenMinutesAgo } },
        ],
      },
    })

    // Atualizar para FAILED
    for (const job of stuckJobs) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: 'Timeout - job excedeu tempo limite',
          completedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      cleaned: stuckJobs.length,
      jobs: stuckJobs.map(j => ({ id: j.id, query: j.query, status: j.status })),
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
