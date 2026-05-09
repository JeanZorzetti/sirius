import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { seedDemoData } from '@/lib/seed-demo-data'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    // Fetch user from database to get id and organizationId
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        organizationId: true
      }
    })

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 400 }
      )
    }

    const userId = user.id
    const organizationId = user.organizationId

    // Seed demo data
    const result = await seedDemoData(userId, organizationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to seed demo data' },
        { status: 500 }
      )
    }

    // Mark onboarding as completed
    await prisma.onboardingProgress.upsert({
      where: { userId },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      create: {
        userId,
        organizationId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Demo data loaded successfully',
      data: result.data
    })
  } catch (error) {
    logger.error({ err: error }, 'Error in seed-demo endpoint')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
