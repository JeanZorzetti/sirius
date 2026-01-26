import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Buscar onboarding progress do usuário
    const onboarding = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
    })

    if (!onboarding) {
      return NextResponse.json(
        { error: 'Onboarding not found' },
        { status: 404 }
      )
    }

    // Resetar para estado inicial
    await prisma.onboardingProgress.update({
      where: { userId: session.user.id },
      data: {
        currentStep: 0,
        completedSteps: [],
        status: 'IN_PROGRESS',
        completedAt: null,
        skippedAt: null,
        badges: [],
        totalPoints: 0,
        stepData: {},
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding resetado com sucesso',
    })
  } catch (error) {
    console.error('[ONBOARDING RESET] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
