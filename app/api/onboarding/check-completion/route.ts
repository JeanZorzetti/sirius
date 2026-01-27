/**
 * Onboarding Check Completion API
 *
 * Verifica automaticamente se um step foi completado através de
 * validação no banco de dados e marca como concluído se detectado.
 *
 * Pattern: Automatic completion detection
 * https://userguiding.com/blog/progressive-onboarding
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkStepCompletion, OnboardingStepId } from '@/lib/onboarding-validators';

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { stepId } = await req.json();

    if (!stepId || typeof stepId !== 'string') {
      return NextResponse.json(
        { error: 'stepId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        onboarding: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Se não tem onboarding progress, retornar false
    if (!user.onboarding) {
      return NextResponse.json({
        completed: false,
        alreadyCompleted: false,
        message: 'Onboarding não iniciado',
      });
    }

    // Verificar se step já estava marcado como concluído
    const alreadyCompleted = user.onboarding.completedSteps.includes(stepId);

    if (alreadyCompleted) {
      return NextResponse.json({
        completed: true,
        alreadyCompleted: true,
        message: 'Step já estava concluído',
      });
    }

    // ✅ VALIDAÇÃO NO BANCO DE DADOS
    const isCompleted = await checkStepCompletion(stepId as OnboardingStepId, user.id);

    console.log(`[Onboarding Check] Step ${stepId} for user ${user.id}: ${isCompleted}`);

    // Se detectou conclusão, marcar automaticamente
    if (isCompleted) {
      const steps = [
        { id: 'welcome', order: 0 },
        { id: 'organization', order: 1 },
        { id: 'pipeline', order: 2 },
        { id: 'first_contact', order: 3 },
        { id: 'first_deal', order: 4 },
      ];

      const currentStepIndex = steps.findIndex((s) => s.id === stepId);
      const nextStepIndex = Math.min(currentStepIndex + 1, steps.length - 1);

      // Adicionar step aos completedSteps
      const newCompletedSteps = [...user.onboarding.completedSteps];
      if (!newCompletedSteps.includes(stepId)) {
        newCompletedSteps.push(stepId);
      }

      // Calcular novos pontos
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

      // Atualizar no banco
      await prisma.onboardingProgress.update({
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

      console.log(`[Onboarding Check] ✅ Step ${stepId} auto-completed for user ${user.id}`);

      return NextResponse.json({
        completed: true,
        alreadyCompleted: false,
        autoCompleted: true,
        pointsEarned,
        newBadges,
        message: `Step ${stepId} detectado e marcado como concluído!`,
      });
    }

    // Não completou ainda
    return NextResponse.json({
      completed: false,
      alreadyCompleted: false,
      message: `Step ${stepId} ainda não foi concluído`,
    });
  } catch (error) {
    console.error('[Onboarding Check] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar conclusão do step' },
      { status: 500 }
    );
  }
}
