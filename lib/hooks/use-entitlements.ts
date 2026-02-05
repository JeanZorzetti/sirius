/**
 * React Hook: useEntitlements
 *
 * Hook para acessar os entitlements da organização atual no cliente.
 */

'use client'

import { useEffect, useState } from 'react'
import { SubscriptionTier } from '@prisma/client'
import { OrganizationEntitlements } from '../feature-gates'

/**
 * Hook para obter os entitlements da organização
 */
export function useEntitlements() {
  const [entitlements, setEntitlements] =
    useState<OrganizationEntitlements | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchEntitlements() {
      try {
        setLoading(true)
        const response = await fetch('/api/entitlements')

        if (!response.ok) {
          throw new Error('Failed to fetch entitlements')
        }

        const data = await response.json()
        setEntitlements(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchEntitlements()
  }, [])

  return {
    entitlements,
    loading,
    error,
    // Atalhos convenientes
    tier: entitlements?.tier ?? 'FREE',
    canUseAutomation: entitlements?.features.automation ?? false,
    canUseAgi: entitlements?.features.agi ?? false,
    canUseChatInterface: entitlements?.features.chatInterface ?? false,
    canUseRoundRobin: entitlements?.features.roundRobin ?? false,
    canUseTeamReports: entitlements?.features.teamReports ?? false,
    dealLimit: entitlements?.limits.deals ?? 50,
    userLimit: entitlements?.limits.users ?? 1,
    pipelineLimit: entitlements?.limits.pipelines ?? 1,
    agiQuota: entitlements?.quotas.agi ?? {
      limit: 0,
      used: 0,
      remaining: 0,
    },
    scrapingCredits: entitlements?.quotas.scraping ?? {
      balance: 0,
      monthlyQuota: 0,
      usedThisMonth: 0,
    },
  }
}

/**
 * Hook para verificar se uma feature específica está disponível
 */
export function useFeatureAccess(feature: string): boolean {
  const { entitlements, loading } = useEntitlements()

  if (loading || !entitlements) {
    return false
  }

  const featureMap: Record<string, boolean> = {
    automation: entitlements.features.automation,
    agi: entitlements.features.agi,
    chat_interface: entitlements.features.chatInterface,
    round_robin: entitlements.features.roundRobin,
    team_reports: entitlements.features.teamReports,
  }

  return featureMap[feature] ?? false
}

/**
 * Hook para verificar se um limite foi atingido
 */
export function useLimitStatus(
  resource: 'deals' | 'users' | 'pipelines',
  currentCount: number
) {
  const { entitlements, loading } = useEntitlements()

  if (loading || !entitlements) {
    return {
      isAtLimit: false,
      isNearLimit: false,
      limit: 0,
      remaining: 0,
      percentage: 0,
    }
  }

  const limit = entitlements.limits[resource]

  // -1 = ilimitado
  if (limit === -1) {
    return {
      isAtLimit: false,
      isNearLimit: false,
      limit: -1,
      remaining: -1,
      percentage: 0,
      isUnlimited: true,
    }
  }

  const remaining = limit - currentCount
  const percentage = (currentCount / limit) * 100

  return {
    isAtLimit: currentCount >= limit,
    isNearLimit: percentage >= 80, // 80% ou mais
    limit,
    remaining,
    percentage: Math.min(percentage, 100),
    isUnlimited: false,
  }
}

/**
 * Hook para verificar quota de IA
 */
export function useAgiQuotaStatus() {
  const { entitlements, loading } = useEntitlements()

  if (loading || !entitlements) {
    return {
      hasAccess: false,
      isUnlimited: false,
      isExceeded: true,
      limit: 0,
      used: 0,
      remaining: 0,
      percentage: 0,
    }
  }

  const { agi } = entitlements.quotas
  const isUnlimited = agi.limit === -1
  const hasAccess = agi.limit !== 0

  if (isUnlimited) {
    return {
      hasAccess: true,
      isUnlimited: true,
      isExceeded: false,
      limit: -1,
      used: agi.used,
      remaining: -1,
      percentage: 0,
    }
  }

  const percentage = hasAccess ? (agi.used / agi.limit) * 100 : 100

  return {
    hasAccess,
    isUnlimited: false,
    isExceeded: agi.remaining <= 0,
    limit: agi.limit,
    used: agi.used,
    remaining: agi.remaining,
    percentage: Math.min(percentage, 100),
  }
}

/**
 * Hook para verificar créditos de scraping
 */
export function useScrapingCreditsStatus() {
  const { entitlements, loading } = useEntitlements()

  if (loading || !entitlements) {
    return {
      hasAccess: false,
      balance: 0,
      monthlyQuota: 0,
      used: 0,
      canUse: false,
    }
  }

  const { scraping } = entitlements.quotas
  const hasAccess = scraping.monthlyQuota > 0 || scraping.balance > 0

  return {
    hasAccess,
    balance: scraping.balance,
    monthlyQuota: scraping.monthlyQuota,
    used: scraping.usedThisMonth,
    canUse: scraping.balance > 0,
  }
}

/**
 * Hook para verificar se precisa fazer upgrade
 */
export function useUpgradeInfo() {
  const { tier } = useEntitlements()

  const upgradePaths: Record<
    SubscriptionTier,
    { nextTier: SubscriptionTier | null; price: number }
  > = {
    FREE: { nextTier: 'STARTER', price: 49 },
    STARTER: { nextTier: 'PRO', price: 97 },
    PRO: { nextTier: 'BUSINESS', price: 149 },
    BUSINESS: { nextTier: null, price: 0 }, // Já é o máximo
  }

  const upgrade = upgradePaths[tier]

  return {
    currentTier: tier,
    nextTier: upgrade.nextTier,
    nextPrice: upgrade.price,
    canUpgrade: upgrade.nextTier !== null,
  }
}
