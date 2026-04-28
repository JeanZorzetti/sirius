import { prisma } from '@/lib/prisma'
import { SubscriptionTier } from '@prisma/client'
import { PLAN_LIMITS, getEffectiveTier, isReadOnly } from '@/lib/entitlements'

/**
 * Plan limits configuration
 * 
 * This module reads `org.tier` (SubscriptionTier enum) and uses
 * the PLAN_LIMITS from entitlements.ts which covers all 4 tiers:
 * FREE → STARTER → PRO → BUSINESS
 * 
 * In PLAN_LIMITS: null = unlimited, number = hard limit
 */

/**
 * Get current usage for an organization
 */
export async function getOrganizationUsage(organizationId: string) {
  const [contactCount, pipelineCount, dealCount] = await Promise.all([
    prisma.contact.count({ where: { organizationId } }),
    prisma.pipeline.count({ where: { organizationId } }),
    prisma.deal.count({ where: { organizationId, archived: false } }),
  ])

  return {
    contacts: contactCount,
    pipelines: pipelineCount,
    deals: dealCount,
  }
}

/**
 * Get organization tier and limits
 */
export async function getOrganizationPlanLimits(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true, trialEndsAt: true, trialStatus: true },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const tier = getEffectiveTier(org)
  const limits = PLAN_LIMITS[tier]
  const usage = await getOrganizationUsage(organizationId)

  // maxContacts is null for unlimited tiers
  const maxContacts = limits.maxContacts
  const maxPipelines = limits.maxPipelines
  const maxDeals = limits.maxDeals

  return {
    tier,
    limits: {
      maxContacts,
      maxPipelines,
      maxDeals,
    },
    usage,
    // Calculated percentages (null = unlimited → 0%)
    contactsUsagePercent: maxContacts === null
      ? 0
      : Math.round((usage.contacts / maxContacts) * 100),
    pipelinesUsagePercent: maxPipelines === null
      ? 0
      : Math.round((usage.pipelines / maxPipelines) * 100),
    // Check if limits are reached (null = unlimited → never reached)
    hasReachedContactLimit: maxContacts !== null && usage.contacts >= maxContacts,
    hasReachedPipelineLimit: maxPipelines !== null && usage.pipelines >= maxPipelines,
    // Check if approaching limits (>= 80%)
    isApproachingContactLimit: maxContacts !== null &&
      usage.contacts >= maxContacts * 0.8,
    isApproachingPipelineLimit: maxPipelines !== null &&
      usage.pipelines >= maxPipelines * 0.8,
  }
}

/**
 * Check if organization can create a new contact
 */
export async function canCreateContact(organizationId: string): Promise<{
  allowed: boolean
  reason?: string
  current?: number
  limit?: number | null
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true, trialEndsAt: true, trialStatus: true },
  })
  if (org && isReadOnly(org)) {
    return { allowed: false, reason: 'TRIAL_EXPIRED' }
  }

  const { tier, limits, usage } = await getOrganizationPlanLimits(organizationId)

  // null = unlimited → always allowed
  if (limits.maxContacts === null) {
    return { allowed: true }
  }

  if (usage.contacts >= limits.maxContacts) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limits.maxContacts} contatos do seu plano.`,
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
  limit?: number | null
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true, trialEndsAt: true, trialStatus: true },
  })
  if (org && isReadOnly(org)) {
    return { allowed: false, reason: 'TRIAL_EXPIRED' }
  }

  const { tier, limits, usage } = await getOrganizationPlanLimits(organizationId)

  // null = unlimited → always allowed
  if (limits.maxPipelines === null) {
    return { allowed: true }
  }

  if (usage.pipelines >= limits.maxPipelines) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limits.maxPipelines} pipelines do seu plano.`,
      current: usage.pipelines,
      limit: limits.maxPipelines,
    }
  }

  return { allowed: true }
}

/**
 * Check if organization can create a new deal
 */
export async function canCreateDeal(organizationId: string): Promise<{
  allowed: boolean
  reason?: string
  current?: number
  limit?: number | null
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true, trialEndsAt: true, trialStatus: true, grandfatheredDealLimit: true },
  })
  if (org && isReadOnly(org)) {
    return { allowed: false, reason: 'TRIAL_EXPIRED' }
  }

  const { tier, limits, usage } = await getOrganizationPlanLimits(organizationId)

  // null = unlimited → always allowed
  if (limits.maxDeals === null) {
    return { allowed: true }
  }

  const effectiveLimit = org?.grandfatheredDealLimit ?? limits.maxDeals

  if (effectiveLimit === null) {
    return { allowed: true }
  }

  if (usage.deals >= effectiveLimit) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${effectiveLimit} negócios do seu plano.`,
      current: usage.deals,
      limit: effectiveLimit,
    }
  }

  return { allowed: true }
}

/**
 * Format limit error message for API responses
 */
export function formatLimitError(type: 'contact' | 'pipeline' | 'deal', limit: number) {
  const messages = {
    contact: `Limite de ${limit} contatos atingido. Faça upgrade para aumentar seu limite.`,
    pipeline: `Limite de ${limit} pipelines atingido. Faça upgrade para aumentar seu limite.`,
    deal: `Limite de ${limit} negócios atingido. Faça upgrade para aumentar seu limite.`,
  }

  return {
    error: messages[type],
    code: 'PLAN_LIMIT_REACHED',
    upgradeUrl: '/dashboard/billing',
  }
}
