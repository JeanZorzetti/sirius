import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const dynamic = 'force-dynamic'

// GET /api/scraping/credits - Créditos da organização
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
      return NextResponse.json({ balance: 0, monthlyQuota: 0 })
    }

    const credits = await prisma.scrapingCredit.findUnique({
      where: { organizationId: user.organizationId },
      select: {
        balance: true,
        monthlyQuota: true,
      },
    })

    if (!credits) {
      // Criar créditos iniciais
      const newCredits = await prisma.scrapingCredit.create({
        data: {
          organizationId: user.organizationId,
          balance: 50, // 50 créditos iniciais
          monthlyQuota: 50,
        },
        select: {
          balance: true,
          monthlyQuota: true,
        },
      })
      return NextResponse.json(newCredits)
    }

    return NextResponse.json(credits)
  } catch (error) {
    logger.error({ err: error }, 'Error fetching scraping credits')
    return NextResponse.json({ balance: 0, monthlyQuota: 0 })
  }
}
