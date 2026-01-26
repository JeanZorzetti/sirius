import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { z } from "zod";

// Onboarding steps configuration
export const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Bem-vindo ao Sirius CRM",
    description: "Vamos configurar sua conta em poucos minutos",
    points: 10,
  },
  {
    id: "organization",
    title: "Configurar Organização",
    description: "Personalize o nome e informações da sua empresa",
    points: 20,
  },
  {
    id: "pipeline",
    title: "Criar Pipeline",
    description: "Configure os estágios do seu funil de vendas",
    points: 30,
  },
  {
    id: "first_contact",
    title: "Primeiro Contato",
    description: "Adicione seu primeiro contato ou lead",
    points: 25,
    badge: "first_contact",
  },
  {
    id: "first_deal",
    title: "Primeira Negociação",
    description: "Crie sua primeira oportunidade de venda",
    points: 25,
    badge: "first_deal",
  },
] as const;

// Badges configuration
export const BADGES = {
  first_contact: {
    id: "first_contact",
    name: "Primeiro Contato",
    description: "Adicionou seu primeiro contato",
    icon: "user-plus",
  },
  first_deal: {
    id: "first_deal",
    name: "Primeira Negociação",
    description: "Criou sua primeira oportunidade",
    icon: "handshake",
  },
  pipeline_master: {
    id: "pipeline_master",
    name: "Mestre do Pipeline",
    description: "Personalizou seu funil de vendas",
    icon: "git-branch",
  },
  onboarding_complete: {
    id: "onboarding_complete",
    name: "Pronto para Vender!",
    description: "Completou todo o onboarding",
    icon: "trophy",
  },
} as const;

const updateOnboardingSchema = z.object({
  currentStep: z.number().min(0).max(5).optional(),
  completedSteps: z.array(z.string()).optional(),
  stepData: z.record(z.string(), z.any()).optional(),
});

/**
 * GET /api/onboarding
 * Get onboarding progress for the current user
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Get or create onboarding progress
    let onboarding = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!onboarding) {
      // Create new onboarding progress
      onboarding = await prisma.onboardingProgress.create({
        data: {
          userId: session.user.id,
          organizationId: session.user.organizationId,
          currentStep: 0,
          completedSteps: [],
          badges: [],
          totalPoints: 0,
        },
      });

      logger.info({
        msg: "Onboarding progress created",
        userId: session.user.id,
      });
    }

    // Calculate completion percentage
    const totalSteps = ONBOARDING_STEPS.length;
    const completedCount = onboarding.completedSteps.length;
    const completionPercentage = Math.round((completedCount / totalSteps) * 100);

    // Get max possible points
    const maxPoints = ONBOARDING_STEPS.reduce((acc, step) => acc + step.points, 0);

    return NextResponse.json({
      onboarding,
      steps: ONBOARDING_STEPS,
      badges: BADGES,
      stats: {
        totalSteps,
        completedCount,
        completionPercentage,
        maxPoints,
        currentPoints: onboarding.totalPoints,
      },
    });
  } catch (error) {
    logger.error({
      msg: "Error fetching onboarding progress",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Erro ao buscar progresso do onboarding" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding
 * Update onboarding progress
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateOnboardingSchema.parse(body);

    // Get current onboarding
    const currentOnboarding = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentOnboarding) {
      return NextResponse.json(
        { error: "Onboarding não encontrado" },
        { status: 404 }
      );
    }

    // Calculate new badges and points if completing steps
    let newBadges = [...currentOnboarding.badges];
    let newPoints = currentOnboarding.totalPoints;

    if (validatedData.completedSteps) {
      const newlyCompleted = validatedData.completedSteps.filter(
        (step) => !currentOnboarding.completedSteps.includes(step)
      );

      for (const stepId of newlyCompleted) {
        const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
        if (step) {
          newPoints += step.points;
          if ("badge" in step && step.badge && !newBadges.includes(step.badge)) {
            newBadges.push(step.badge);
          }
        }
      }
    }

    // Check if all steps are completed
    const allStepsCompleted =
      validatedData.completedSteps?.length === ONBOARDING_STEPS.length;

    if (allStepsCompleted && !newBadges.includes("onboarding_complete")) {
      newBadges.push("onboarding_complete");
    }

    // Merge step data
    const mergedStepData = {
      ...(currentOnboarding.stepData as Record<string, unknown> || {}),
      ...(validatedData.stepData || {}),
    };

    const onboarding = await prisma.onboardingProgress.update({
      where: { userId: session.user.id },
      data: {
        currentStep: validatedData.currentStep ?? currentOnboarding.currentStep,
        completedSteps: validatedData.completedSteps ?? currentOnboarding.completedSteps,
        stepData: mergedStepData,
        badges: newBadges,
        totalPoints: newPoints,
        ...(allStepsCompleted && {
          status: "COMPLETED",
          completedAt: new Date(),
        }),
      },
    });

    logger.info({
      msg: "Onboarding progress updated",
      userId: session.user.id,
      currentStep: onboarding.currentStep,
      completedSteps: onboarding.completedSteps.length,
      status: onboarding.status,
    });

    return NextResponse.json({
      onboarding,
      newBadges: newBadges.filter((b) => !currentOnboarding.badges.includes(b)),
      pointsEarned: newPoints - currentOnboarding.totalPoints,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    logger.error({
      msg: "Error updating onboarding progress",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Erro ao atualizar progresso do onboarding" },
      { status: 500 }
    );
  }
}
