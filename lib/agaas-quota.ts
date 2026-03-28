import { prisma } from '@/lib/prisma'

/**
 * AgaaS tier limits derived from subscription tier.
 * Used as defaults when agaas* fields are not explicitly set.
 */
const TIER_LIMITS: Record<string, { agents: number; quota: number }> = {
  FREE:     { agents: 0,  quota: 0 },
  STARTER:  { agents: 1,  quota: 200 },
  PRO:      { agents: 3,  quota: 1000 },
  BUSINESS: { agents: 5,  quota: 3000 },
}

function nextMonthDate(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export interface QuotaResult {
  allowed: boolean
  remaining: number
  used: number
  quota: number
  agentLimit: number
  tier: string
  resetsAt: Date | null
  reason?: string
}

/**
 * Check if the organization can perform an AgaaS action.
 */
export async function checkAgaasQuota(organizationId: string): Promise<QuotaResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      tier: true,
      agaasEnabled: true,
      agaasAgentLimit: true,
      agaasMonthlyQuota: true,
      agaasActionsUsed: true,
      agaasQuotaResetAt: true,
    }
  })

  if (!org) {
    return { allowed: false, remaining: 0, used: 0, quota: 0, agentLimit: 0, tier: 'FREE', resetsAt: null, reason: 'Organization not found' }
  }

  const tierKey = org.tier || 'FREE'
  const tierLimits = TIER_LIMITS[tierKey] || TIER_LIMITS.FREE

  // Use explicit agaas fields if set, otherwise derive from tier
  const agentLimit = org.agaasAgentLimit || tierLimits.agents
  const monthlyQuota = org.agaasMonthlyQuota || tierLimits.quota

  // FREE tier or not enabled
  if (monthlyQuota === 0) {
    return { allowed: false, remaining: 0, used: org.agaasActionsUsed, quota: 0, agentLimit, tier: tierKey, resetsAt: null, reason: 'Upgrade para usar agentes autônomos' }
  }

  // BUSINESS = unlimited
  if (monthlyQuota === -1) {
    return { allowed: true, remaining: Infinity, used: org.agaasActionsUsed, quota: -1, agentLimit: -1, tier: tierKey, resetsAt: org.agaasQuotaResetAt }
  }

  // Auto-reset mensal
  if (org.agaasQuotaResetAt && new Date() > org.agaasQuotaResetAt) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        agaasActionsUsed: 0,
        agaasQuotaResetAt: nextMonthDate(),
      }
    })
    return { allowed: true, remaining: monthlyQuota, used: 0, quota: monthlyQuota, agentLimit, tier: tierKey, resetsAt: nextMonthDate() }
  }

  // Initialize reset date if not set
  if (!org.agaasQuotaResetAt) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { agaasQuotaResetAt: nextMonthDate() }
    })
  }

  const remaining = monthlyQuota - org.agaasActionsUsed
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    used: org.agaasActionsUsed,
    quota: monthlyQuota,
    agentLimit,
    tier: tierKey,
    resetsAt: org.agaasQuotaResetAt || nextMonthDate(),
    reason: remaining <= 0 ? 'Cota mensal de ações esgotada' : undefined,
  }
}

/**
 * Increment the monthly usage counter.
 */
export async function incrementAgaasUsage(organizationId: string) {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { agaasActionsUsed: { increment: 1 } }
  })
}
