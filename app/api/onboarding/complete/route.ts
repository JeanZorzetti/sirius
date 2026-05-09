import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const body = await request.json().catch(() => ({}))
    const status = body.status === 'SKIPPED' ? 'SKIPPED' : 'COMPLETED'

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

    // Mark onboarding as completed/skipped
    await prisma.onboardingProgress.upsert({
      where: { userId: user.id },
      update: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        skippedAt: status === 'SKIPPED' ? new Date() : undefined,
      },
      create: {
        userId: user.id,
        organizationId: user.organizationId,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        skippedAt: status === 'SKIPPED' ? new Date() : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      status
    })
  } catch (error) {
    logger.error({ err: error }, 'Error completing onboarding')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
