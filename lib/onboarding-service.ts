/**
 * Onboarding Service
 *
 * Service Pattern para gerenciar conclusão de steps do onboarding.
 * Centraliza toda lógica de validação e atualização.
 *
 * Chamado DIRETAMENTE pelas Prisma Extensions (síncrono).
 * Não usa EventEmitter para ser compatível com Serverless (Vercel).
 */

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export type OnboardingStepId = 'welcome' | 'organization' | 'pipeline' | 'first_contact' | 'first_deal';

interface StepCompletionResult {
  completed: boolean;
  stepId?: string;
  pointsEarned?: number;
  newBadges?: string[];
  message?: string;
}

/**
 * Verifica e marca um step como completo se as condições foram satisfeitas.
 *
 * Chamado por Prisma Extensions após create/update de entidades.
 * Executa de forma SÍNCRONA (await) para garantir conclusão antes da Lambda morrer.
 */
export async function checkAndCompleteStep(
  prismaClient: PrismaClient,
  organizationId: string,
  stepId: OnboardingStepId
): Promise<StepCompletionResult> {
  try {
    console.log(`[OnboardingService] Checking step ${stepId} for org ${organizationId}`);

    // Buscar usuário da organização com onboarding
    const user = await prismaClient.user.findFirst({
      where: { organizationId },
      include: {
        onboarding: true,
        organization: true,
      },
    });

    if (!user?.onboarding) {
      console.log(`[OnboardingService] No onboarding found for org ${organizationId}`);
      return { completed: false, message: 'Onboarding não iniciado' };
    }

    // Se step já está completo, retornar
    if (user.onboarding.completedSteps.includes(stepId)) {
      console.log(`[OnboardingService] Step ${stepId} already completed`);
      return { completed: false, message: 'Step já estava completo' };
    }

    // ✅ VALIDAÇÃO INLINE - Verifica se condição foi satisfeita
    const isValid = await validateStepCondition(prismaClient, stepId, organizationId);

    if (!isValid) {
      console.log(`[OnboardingService] Step ${stepId} condition not met yet`);
      return { completed: false, message: 'Condição não satisfeita' };
    }

    // ✅ MARCAR COMO COMPLETO
    const steps = [
      { id: 'welcome', order: 0 },
      { id: 'organization', order: 1 },
      { id: 'pipeline', order: 2 },
      { id: 'first_contact', order: 3 },
      { id: 'first_deal', order: 4 },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === stepId);
    const nextStepIndex = Math.min(currentStepIndex + 1, steps.length - 1);

    const newCompletedSteps = [...user.onboarding.completedSteps, stepId];

    // Calcular pontos
    const stepPoints: Record<string, number> = {
      welcome: 10,
      organization: 20,
      pipeline: 25,
      first_contact: 20,
      first_deal: 25,
    };

    const pointsEarned = stepPoints[stepId] || 0;
    const newTotalPoints = user.onboarding.totalPoints + pointsEarned;

    // Verificar badges
    const newBadges: string[] = [];
    if (stepId === 'organization' && !user.onboarding.badges.includes('first_steps')) {
      newBadges.push('first_steps');
    }
    if (stepId === 'first_deal' && !user.onboarding.badges.includes('deal_maker')) {
      newBadges.push('deal_maker');
    }

    // Verificar se completou tudo
    const isFullyCompleted = newCompletedSteps.length >= steps.length;

    // ✅ ATUALIZAR NO BANCO (síncrono)
    await prismaClient.onboardingProgress.update({
      where: { id: user.onboarding.id },
      data: {
        currentStep: nextStepIndex,
        completedSteps: newCompletedSteps,
        totalPoints: newTotalPoints,
        badges: {
          push: newBadges,
        },
        status: isFullyCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isFullyCompleted ? new Date() : null,
      },
    });

    console.log(`[OnboardingService] ✅ Step ${stepId} completed! Points: +${pointsEarned}`);

    // ✅ REVALIDAR UI (Next.js atualiza cache)
    revalidatePath('/dashboard');

    return {
      completed: true,
      stepId,
      pointsEarned,
      newBadges,
      message: `Step ${stepId} concluído!`,
    };
  } catch (error) {
    console.error(`[OnboardingService] Error completing step ${stepId}:`, error);
    return { completed: false, message: 'Erro ao completar step' };
  }
}

/**
 * Valida se a condição de um step foi satisfeita.
 * Validação inline (sem arquivo separado de validators).
 */
async function validateStepCondition(
  prismaClient: PrismaClient,
  stepId: OnboardingStepId,
  organizationId: string
): Promise<boolean> {
  try {
    switch (stepId) {
      case 'welcome':
        // Welcome completa manualmente (não precisa validação)
        return true;

      case 'organization':
        // Organização deve ter nome E slug configurados
        const org = await prismaClient.organization.findUnique({
          where: { id: organizationId },
        });
        return !!org?.name && org.name.trim() !== '' && !!org?.slug && org.slug.trim() !== '';

      case 'pipeline':
        // Deve ter pelo menos 1 pipeline
        const pipelineCount = await prismaClient.pipeline.count({
          where: { organizationId },
        });
        return pipelineCount > 0;

      case 'first_contact':
        // Deve ter pelo menos 1 contato
        const contactCount = await prismaClient.contact.count({
          where: { organizationId },
        });
        return contactCount > 0;

      case 'first_deal':
        // Deve ter pelo menos 1 deal
        const dealCount = await prismaClient.deal.count({
          where: { organizationId },
        });
        return dealCount > 0;

      default:
        return false;
    }
  } catch (error) {
    console.error(`[OnboardingService] Validation error for step ${stepId}:`, error);
    return false;
  }
}
