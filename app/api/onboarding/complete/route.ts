import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
        { error: 'Organization not found' },
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
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
