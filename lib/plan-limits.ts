import { prisma } from '@/lib/prisma'

/**
 * Plan limits configuration
 * FREE plan has hard limits, PRO is unlimited
 */
export const PLAN_LIMITS = {
  FREE: {
    maxContacts: 50,
    maxPipelines: 3,
    maxDeals: Infinity, // Deals are unlimited even in FREE (but contacts are limited)
  },
  PRO: {
    maxContacts: Infinity,
    maxPipelines: Infinity,
    maxDeals: Infinity,
  },
} as const

export type PlanType = 'FREE' | 'PRO'

/**
 * Get current usage for an organization
 */
export async function getOrganizationUsage(organizationId: string) {
  const [contactCount, pipelineCount, dealCount] = await Promise.all([
    prisma.contact.count({ where: { organizationId } }),
    prisma.pipeline.count({ where: { organizationId } }),
    prisma.deal.count({ where: { organizationId } }),
  ])

  return {
    contacts: contactCount,
    pipelines: pipelineCount,
    deals: dealCount,
  }
}

/**
 * Get organization plan and limits
 */
export async function getOrganizationPlanLimits(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const plan = org.plan as PlanType
  const limits = PLAN_LIMITS[plan]
  const usage = await getOrganizationUsage(organizationId)

  return {
    plan,
    limits,
    usage,
    // Calculated percentages
    contactsUsagePercent: limits.maxContacts === Infinity
      ? 0
      : Math.round((usage.contacts / limits.maxContacts) * 100),
    pipelinesUsagePercent: limits.maxPipelines === Infinity
      ? 0
      : Math.round((usage.pipelines / limits.maxPipelines) * 100),
    // Check if limits are reached
    hasReachedContactLimit: usage.contacts >= limits.maxContacts,
    hasReachedPipelineLimit: usage.pipelines >= limits.maxPipelines,
    // Check if approaching limits (>= 80%)
    isApproachingContactLimit: limits.maxContacts !== Infinity &&
      usage.contacts >= limits.maxContacts * 0.8,
    isApproachingPipelineLimit: limits.maxPipelines !== Infinity &&
      usage.pipelines >= limits.maxPipelines * 0.8,
  }
}

/**
 * Check if organization can create a new contact
 */
export async function canCreateContact(organizationId: string): Promise<{
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
}> {
  const { plan, limits, usage } = await getOrganizationPlanLimits(organizationId)

  if (plan === 'PRO') {
    return { allowed: true }
  }

  if (usage.contacts >= limits.maxContacts) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limits.maxContacts} contatos do plano gratuito.`,
      current: usage.contacts,
      limit: limits.maxContacts,
    }
  }

  return { allowed: true }
}

/**
 * Check if organization can create a new pipeline
 */
export async function canCreatePipeline(organizationId: string): Promise<{
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
}> {
  const { plan, limits, usage } = await getOrganizationPlanLimits(organizationId)

  if (plan === 'PRO') {
    return { allowed: true }
  }

  if (usage.pipelines >= limits.maxPipelines) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limits.maxPipelines} pipelines do plano gratuito.`,
      current: usage.pipelines,
      limit: limits.maxPipelines,
    }
  }

  return { allowed: true }
}

/**
 * Format limit error message for API responses
 */
export function formatLimitError(type: 'contact' | 'pipeline', limit: number) {
  const messages = {
    contact: `Limite de ${limit} contatos atingido. Faça upgrade para PRO para adicionar contatos ilimitados.`,
    pipeline: `Limite de ${limit} pipelines atingido. Faça upgrade para PRO para criar pipelines ilimitados.`,
  }

  return {
    error: messages[type],
    code: 'PLAN_LIMIT_REACHED',
    upgradeUrl: '/dashboard/billing',
  }
}
