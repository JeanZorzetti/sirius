/**
 * Entitlements System - v2.0 Modular Plans
 *
 * Define os limites, features e quotas de cada plano do Sirius CRM.
 */

import { SubscriptionTier } from '@prisma/client'

/**
 * Feature flags e limites por plano
 */
export const PLAN_FEATURES = {
  FREE: {
    // Limites de recursos
    max_deals: 50,
    max_users: 1,
    max_pipelines: 1,

    // Features habilitadas
    can_use_automation: false,
    can_use_agi: true, // Limitado por quota
    can_use_chat_interface: false, // Apenas click-to-chat
    can_use_round_robin: false,
    can_use_team_reports: false,

    // Quotas mensais
    agi_monthly_quota: 3, // 3 gerações de IA por mês
    scraping_initial_credits: 5, // 5 créditos iniciais (apenas na criação)
    scraping_monthly_credits: 0, // Sem refill mensal

    // Integrações
    whatsapp_type: 'click_to_chat' as const,
    whatsapp_instances: 0,

    // Analytics
    analytics_tier: 'basic' as const,

    // Suporte
    support_tier: 'community' as const,
  },

  STARTER: {
    // Limites de recursos
    max_deals: -1, // Ilimitado
    max_users: 1,
    max_pipelines: 1,

    // Features habilitadas
    can_use_automation: false,
    can_use_agi: false, // Sem acesso
    can_use_chat_interface: false, // Apenas click-to-chat
    can_use_round_robin: false,
    can_use_team_reports: false,

    // Quotas mensais
    agi_monthly_quota: 0, // Sem IA
    scraping_monthly_credits: 0, // Sem scraping

    // Integrações
    whatsapp_type: 'click_to_chat' as const,
    whatsapp_instances: 0,

    // Analytics
    analytics_tier: 'basic' as const,

    // Suporte
    support_tier: 'standard' as const,
  },

  PRO: {
    // Limites de recursos
    max_deals: -1, // Ilimitado
    max_users: -1, // Ilimitado
    max_pipelines: -1, // Ilimitado

    // Features habilitadas
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: true, // Chat Center integrado
    can_use_round_robin: false, // Apenas BUSINESS
    can_use_team_reports: false, // Apenas BUSINESS

    // Quotas mensais
    agi_monthly_quota: -1, // Ilimitado
    scraping_monthly_credits: 50, // 50 créditos/mês

    // Integrações
    whatsapp_type: 'integrated_chat' as const,
    whatsapp_instances: 1, // 1 instância base

    // Analytics
    analytics_tier: 'pro' as const,

    // Suporte
    support_tier: 'priority' as const,
  },

  BUSINESS: {
    // Limites de recursos
    max_deals: -1, // Ilimitado
    max_users: -1, // Ilimitado
    max_pipelines: -1, // Ilimitado

    // Features habilitadas
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: true,
    can_use_round_robin: true, // Round-robin distribution
    can_use_team_reports: true, // Team performance reports

    // Quotas mensais
    agi_monthly_quota: -1, // Ilimitado
    scraping_monthly_credits: 50, // 50 créditos/mês (igual PRO)

    // Integrações
    whatsapp_type: 'integrated_chat' as const,
    whatsapp_instances: 1, // 1 instância base (pode comprar mais)

    // Analytics
    analytics_tier: 'business' as const,

    // Suporte
    support_tier: 'vip' as const,
  },
} as const

export type PlanFeatures = (typeof PLAN_FEATURES)[SubscriptionTier]
export type FeatureKey = keyof PlanFeatures

/**
 * Verifica se um plano tem acesso a uma feature específica
 */
export function canUseFeature(
  tier: SubscriptionTier,
  feature: string
): boolean {
  const features = PLAN_FEATURES[tier] as any
  return features[feature] === true
}

/**
 * Obtém o limite de um recurso para um plano
 * @returns -1 para ilimitado, 0 para sem acesso, número positivo para limite
 */
export function getLimit(tier: SubscriptionTier, limit: string): number {
  const features = PLAN_FEATURES[tier] as any
  const value = features[limit]
  return typeof value === 'number' ? value : 0
}

/**
 * Obtém a quota mensal de um recurso
 * @returns -1 para ilimitado, 0 para sem acesso, número positivo para quota
 */
export function getQuota(tier: SubscriptionTier, quota: string): number {
  const features = PLAN_FEATURES[tier] as any
  const value = features[quota]
  return typeof value === 'number' ? value : 0
}

/**
 * Obtém o nome amigável de um plano
 */
export function getPlanName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    FREE: 'Grátis',
    STARTER: 'Starter',
    PRO: 'PRO',
    BUSINESS: 'Business',
  }
  return names[tier]
}

/**
 * Obtém o preço mensal de um plano
 */
export function getPlanPrice(tier: SubscriptionTier): number {
  const prices: Record<SubscriptionTier, number> = {
    FREE: 0,
    STARTER: 49,
    PRO: 97,
    BUSINESS: 149,
  }
  return prices[tier]
}

/**
 * Verifica se um plano é superior a outro
 */
export function isPlanHigherThan(
  tierA: SubscriptionTier,
  tierB: SubscriptionTier
): boolean {
  const hierarchy: Record<SubscriptionTier, number> = {
    FREE: 0,
    STARTER: 1,
    PRO: 2,
    BUSINESS: 3,
  }
  return hierarchy[tierA] > hierarchy[tierB]
}

/**
 * Obtém o próximo plano na hierarquia (para upgrades)
 */
export function getNextPlan(tier: SubscriptionTier): SubscriptionTier | null {
  const upgrades: Record<SubscriptionTier, SubscriptionTier | null> = {
    FREE: 'STARTER',
    STARTER: 'PRO',
    PRO: 'BUSINESS',
    BUSINESS: null, // Já é o plano máximo
  }
  return upgrades[tier]
}

/**
 * Obtém o plano mínimo necessário para uma feature
 */
export function getRequiredPlanForFeature(feature: string): SubscriptionTier {
  // Percorre os planos do menor para o maior
  const tiers: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'BUSINESS']

  for (const tier of tiers) {
    if (canUseFeature(tier, feature)) {
      return tier
    }
  }

  return 'BUSINESS' // Fallback
}

/**
 * Formata um limite para exibição
 * @example formatLimit(-1) => "Ilimitado"
 * @example formatLimit(50) => "50"
 * @example formatLimit(0) => "Sem acesso"
 */
export function formatLimit(limit: number): string {
  if (limit === -1) return 'Ilimitado'
  if (limit === 0) return 'Sem acesso'
  return limit.toString()
}

/**
 * Obtém o analytics tier como string amigável
 */
export function getAnalyticsTierName(
  tier: 'basic' | 'pro' | 'business'
): string {
  const names = {
    basic: 'Básico',
    pro: 'Avançado',
    business: 'Empresarial',
  }
  return names[tier]
}

/**
 * Obtém as principais diferenças entre dois planos
 */
export function getPlanDifferences(
  from: SubscriptionTier,
  to: SubscriptionTier
): string[] {
  const fromFeatures = PLAN_FEATURES[from]
  const toFeatures = PLAN_FEATURES[to]

  const differences: string[] = []

  // Verifica deals
  if (fromFeatures.max_deals !== toFeatures.max_deals) {
    differences.push(
      `Deals: ${formatLimit(fromFeatures.max_deals)} → ${formatLimit(
        toFeatures.max_deals
      )}`
    )
  }

  // Verifica usuários
  if (fromFeatures.max_users !== toFeatures.max_users) {
    differences.push(
      `Usuários: ${formatLimit(fromFeatures.max_users)} → ${formatLimit(
        toFeatures.max_users
      )}`
    )
  }

  // Verifica pipelines
  if (fromFeatures.max_pipelines !== toFeatures.max_pipelines) {
    differences.push(
      `Pipelines: ${formatLimit(fromFeatures.max_pipelines)} → ${formatLimit(
        toFeatures.max_pipelines
      )}`
    )
  }

  // Verifica WhatsApp
  if (fromFeatures.whatsapp_type !== toFeatures.whatsapp_type) {
    if (toFeatures.whatsapp_type === 'integrated_chat') {
      differences.push('✨ Chat Center integrado (WhatsApp)')
    }
  }

  // Verifica IA
  if (
    fromFeatures.agi_monthly_quota !== toFeatures.agi_monthly_quota &&
    toFeatures.agi_monthly_quota === -1
  ) {
    differences.push('✨ IA ilimitada (AGI Sirius)')
  }

  // Verifica scraping
  if (
    fromFeatures.scraping_monthly_credits !==
    toFeatures.scraping_monthly_credits
  ) {
    differences.push(
      `✨ Prospecção: ${fromFeatures.scraping_monthly_credits} → ${toFeatures.scraping_monthly_credits} leads/mês`
    )
  }

  // Verifica automação
  if (!fromFeatures.can_use_automation && toFeatures.can_use_automation) {
    differences.push('✨ Automações de email')
  }

  // Verifica round-robin
  if (!fromFeatures.can_use_round_robin && toFeatures.can_use_round_robin) {
    differences.push('✨ Distribuição automática de leads')
  }

  // Verifica team reports
  if (!fromFeatures.can_use_team_reports && toFeatures.can_use_team_reports) {
    differences.push('✨ Relatórios de equipe')
  }

  // Verifica analytics
  if (fromFeatures.analytics_tier !== toFeatures.analytics_tier) {
    differences.push(
      `Analytics: ${getAnalyticsTierName(
        fromFeatures.analytics_tier
      )} → ${getAnalyticsTierName(toFeatures.analytics_tier)}`
    )
  }

  return differences
}
