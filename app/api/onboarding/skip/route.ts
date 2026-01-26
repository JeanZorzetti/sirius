import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

/**
 * POST /api/onboarding/skip
 * Skip the onboarding process
 */
export async function POST() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const onboarding = await prisma.onboardingProgress.upsert({
      where: { userId: session.user.id },
      update: {
        status: "SKIPPED",
        skippedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        currentStep: 0,
        completedSteps: [],
        badges: [],
        totalPoints: 0,
        status: "SKIPPED",
        skippedAt: new Date(),
      },
    });

    logger.info({
      msg: "Onboarding skipped",
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      onboarding,
    });
  } catch (error) {
    logger.error({
      msg: "Error skipping onboarding",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Erro ao pular onboarding" },
      { status: 500 }
    );
  }
}
