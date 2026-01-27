/**
 * Onboarding Step Validators
 *
 * Funções para verificar se cada step do onboarding foi realmente
 * completado através de validação no banco de dados.
 *
 * Pattern: Database-backed validation
 * Referência: https://userpilot.com/blog/progressive-onboarding/
 */

import { prisma } from '@/lib/prisma';

export type OnboardingStepId = 'welcome' | 'organization' | 'pipeline' | 'first_contact' | 'first_deal';

/**
 * Verifica se um step específico foi concluído
 */
export async function checkStepCompletion(stepId: OnboardingStepId, userId: string): Promise<boolean> {
  try {
    switch (stepId) {
      case 'welcome':
        // Welcome sempre completa manualmente (não precisa validação)
        return true;

      case 'organization':
        return await hasOrganizationConfigured(userId);

      case 'pipeline':
        return await hasPipelineCreated(userId);

      case 'first_contact':
        return await hasContactCreated(userId);

      case 'first_deal':
        return await hasDealCreated(userId);

      default:
        return false;
    }
  } catch (error) {
    console.error(`[Onboarding Validator] Error checking step ${stepId}:`, error);
    return false;
  }
}

/**
 * Step: organization
 * Verifica se usuário configurou nome e slug da organização
 */
async function hasOrganizationConfigured(userId: string): Promise<boolean> {
  const organization = await prisma.organization.findFirst({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
    },
  });

  // Organização deve ter nome E slug configurados (não vazios)
  const isConfigured = !!organization &&
    !!organization.name &&
    organization.name.trim() !== '' &&
    !!organization.slug &&
    organization.slug.trim() !== '';

  console.log(`[Validator] Organization configured for user ${userId}:`, isConfigured);
  return isConfigured;
}

/**
 * Step: pipeline
 * Verifica se usuário tem pelo menos um pipeline criado
 */
async function hasPipelineCreated(userId: string): Promise<boolean> {
  const organization = await prisma.organization.findFirst({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      pipelines: true,
    },
  });

  const hasPipeline = !!organization && organization.pipelines.length > 0;

  console.log(`[Validator] Pipeline created for user ${userId}:`, hasPipeline);
  return hasPipeline;
}

/**
 * Step: first_contact
 * Verifica se usuário criou pelo menos um contato
 */
async function hasContactCreated(userId: string): Promise<boolean> {
  const organization = await prisma.organization.findFirst({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      contacts: {
        take: 1,
      },
    },
  });

  const hasContact = !!organization && organization.contacts.length > 0;

  console.log(`[Validator] Contact created for user ${userId}:`, hasContact);
  return hasContact;
}

/**
 * Step: first_deal
 * Verifica se usuário criou pelo menos um negócio
 */
async function hasDealCreated(userId: string): Promise<boolean> {
  const organization = await prisma.organization.findFirst({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      deals: {
        take: 1,
      },
    },
  });

  const hasDeal = !!organization && organization.deals.length > 0;

  console.log(`[Validator] Deal created for user ${userId}:`, hasDeal);
  return hasDeal;
}

/**
 * Verifica múltiplos steps de uma vez
 * Útil para sincronizar progresso quando usuário retorna
 */
export async function checkMultipleSteps(
  stepIds: OnboardingStepId[],
  userId: string
): Promise<Record<OnboardingStepId, boolean>> {
  const results: Record<string, boolean> = {};

  for (const stepId of stepIds) {
    results[stepId] = await checkStepCompletion(stepId, userId);
  }

  return results as Record<OnboardingStepId, boolean>;
}
