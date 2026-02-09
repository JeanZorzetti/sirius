/**
 * Entitlements System
 * 
 * Define os limites e recursos disponíveis por tier de plano
 * FREE → STARTER → PRO → BUSINESS
 */

import { SubscriptionTier } from '@prisma/client'

// Re-exportar SubscriptionTier
export { SubscriptionTier }

export interface PlanLimits {
  // Contatos
  maxContacts: number | null // null = ilimitado
  
  // Deals
  maxDeals: number | null
  maxDealsPerPipeline: number | null
  
  // Pipelines
  maxPipelines: number
  
  // Usuários
  maxUsers: number
  
  // Scraping/Prospecção
  scrapingCreditsMonthly: number
  maxScrapingPerSearch: number
  
  // WhatsApp
  maxWhatsAppInstances: number
  
  // Automações
  maxEmailAutomations: number
  maxSequences: number
  
  // Integrações
  allowedIntegrations: string[]
  
  // Analytics
  advancedAnalytics: boolean
  customReports: boolean
  
  // Suporte
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated'
  
  // Features exclusivas
  features: {
    roundRobin: boolean
    leadScoring: boolean
    apiAccess: boolean
    webhooks: boolean
    customDomain: boolean
    sso: boolean
    auditLog: boolean
  }
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  [SubscriptionTier.FREE]: {
    maxContacts: 100,
    maxDeals: 50,
    maxDealsPerPipeline: 50,
    maxPipelines: 1,
    maxUsers: 1,
    scrapingCreditsMonthly: 0,
    maxScrapingPerSearch: 0,
    maxWhatsAppInstances: 0,
    maxEmailAutomations: 0,
    maxSequences: 0,
    allowedIntegrations: [],
    advancedAnalytics: false,
    customReports: false,
    supportLevel: 'community',
    features: {
      roundRobin: false,
      leadScoring: false,
      apiAccess: false,
      webhooks: false,
      customDomain: false,
      sso: false,
      auditLog: false,
    },
  },
  
  [SubscriptionTier.STARTER]: {
    maxContacts: 500,
    maxDeals: 200,
    maxDealsPerPipeline: 200,
    maxPipelines: 3,
    maxUsers: 3,
    scrapingCreditsMonthly: 50,
    maxScrapingPerSearch: 50,
    maxWhatsAppInstances: 1,
    maxEmailAutomations: 3,
    maxSequences: 3,
    allowedIntegrations: ['google-calendar', 'n8n'],
    advancedAnalytics: false,
    customReports: false,
    supportLevel: 'email',
    features: {
      roundRobin: false,
      leadScoring: false,
      apiAccess: false,
      webhooks: false,
      customDomain: false,
      sso: false,
      auditLog: false,
    },
  },
  
  [SubscriptionTier.PRO]: {
    maxContacts: 2000,
    maxDeals: 1000,
    maxDealsPerPipeline: 1000,
    maxPipelines: 10,
    maxUsers: 10,
    scrapingCreditsMonthly: 200,
    maxScrapingPerSearch: 100,
    maxWhatsAppInstances: 1,
    maxEmailAutomations: 10,
    maxSequences: 10,
    allowedIntegrations: ['google-calendar', 'n8n', 'webhook', 'zapier'],
    advancedAnalytics: true,
    customReports: false,
    supportLevel: 'priority',
    features: {
      roundRobin: false,
      leadScoring: true,
      apiAccess: true,
      webhooks: true,
      customDomain: false,
      sso: false,
      auditLog: false,
    },
  },
  
  [SubscriptionTier.BUSINESS]: {
    maxContacts: null, // ilimitado
    maxDeals: null, // ilimitado
    maxDealsPerPipeline: null,
    maxPipelines: 50,
    maxUsers: 50,
    scrapingCreditsMonthly: 1000,
    maxScrapingPerSearch: 500,
    maxWhatsAppInstances: 5,
    maxEmailAutomations: 50,
    maxSequences: 50,
    allowedIntegrations: ['*'], // todas
    advancedAnalytics: true,
    customReports: true,
    supportLevel: 'dedicated',
    features: {
      roundRobin: true,
      leadScoring: true,
      apiAccess: true,
      webhooks: true,
      customDomain: true,
      sso: true,
      auditLog: true,
    },
  },
}

// Preços dos planos (mensal)
export const PLAN_PRICING: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.STARTER]: 49,
  [SubscriptionTier.PRO]: 97,
  [SubscriptionTier.BUSINESS]: 149,
}

// Nomes amigáveis
export const PLAN_NAMES: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREE]: 'Gratuito',
  [SubscriptionTier.STARTER]: 'Starter',
  [SubscriptionTier.PRO]: 'Pro',
  [SubscriptionTier.BUSINESS]: 'Business',
}

// Descrições
export const PLAN_DESCRIPTIONS: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREE]: 'Para testar o CRM',
  [SubscriptionTier.STARTER]: 'Para pequenas empresas',
  [SubscriptionTier.PRO]: 'Para equipes em crescimento',
  [SubscriptionTier.BUSINESS]: 'Para grandes operações',
}

/**
 * Verifica se uma ação está dentro dos limites do plano
 */
export function checkLimit(
  tier: SubscriptionTier,
  limitKey: keyof PlanLimits,
  currentValue: number
): { allowed: boolean; limit: number | null; remaining: number } {
  const limits = PLAN_LIMITS[tier]
  const limit = limits[limitKey] as number | null
  
  if (limit === null) {
    return { allowed: true, limit: null, remaining: Infinity }
  }
  
  const remaining = limit - currentValue
  return { allowed: remaining > 0, limit, remaining }
}

/**
 * Verifica se uma feature está disponível no plano
 */
export function hasFeature(
  tier: SubscriptionTier,
  featureKey: keyof PlanLimits['features']
): boolean {
  return PLAN_LIMITS[tier].features[featureKey]
}

/**
 * Verifica se uma integração é permitida
 */
export function isIntegrationAllowed(
  tier: SubscriptionTier,
  integrationId: string
): boolean {
  const allowed = PLAN_LIMITS[tier].allowedIntegrations
  return allowed.includes('*') || allowed.includes(integrationId)
}

/**
 * Obtém o próximo tier disponível para upgrade
 */
export function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const tiers = [SubscriptionTier.FREE, SubscriptionTier.STARTER, SubscriptionTier.PRO, SubscriptionTier.BUSINESS]
  const currentIndex = tiers.indexOf(currentTier)
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null
}

/**
 * Obtém o tier anterior para downgrade
 */
export function getPreviousTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const tiers = [SubscriptionTier.FREE, SubscriptionTier.STARTER, SubscriptionTier.PRO, SubscriptionTier.BUSINESS]
  const currentIndex = tiers.indexOf(currentTier)
  return currentIndex > 0 ? tiers[currentIndex - 1] : null
}

// ============================================================
// COMPATIBILIDADE COM feature-gates.ts EXISTENTE
// ============================================================

/**
 * Features disponíveis por plano (formato legado para compatibilidade)
 */
export const PLAN_FEATURES: Record<SubscriptionTier, {
  max_deals: number
  max_users: number
  max_pipelines: number
  max_contacts: number
  agi_monthly_quota: number
  scraping_monthly_credits: number
  scraping_initial_credits: number
  can_use_automation: boolean
  can_use_agi: boolean
  can_use_chat_interface: boolean
  can_use_round_robin: boolean
  can_use_team_reports: boolean
}> = {
  [SubscriptionTier.FREE]: {
    max_deals: 50,
    max_users: 1,
    max_pipelines: 1,
    max_contacts: 100,
    agi_monthly_quota: 0,
    scraping_monthly_credits: 0,
    scraping_initial_credits: 0,
    can_use_automation: false,
    can_use_agi: false,
    can_use_chat_interface: false,
    can_use_round_robin: false,
    can_use_team_reports: false,
  },
  [SubscriptionTier.STARTER]: {
    max_deals: 200,
    max_users: 3,
    max_pipelines: 3,
    max_contacts: 500,
    agi_monthly_quota: 50,
    scraping_monthly_credits: 50,
    scraping_initial_credits: 50,
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: true,
    can_use_round_robin: false,
    can_use_team_reports: false,
  },
  [SubscriptionTier.PRO]: {
    max_deals: 1000,
    max_users: 10,
    max_pipelines: 10,
    max_contacts: 2000,
    agi_monthly_quota: 200,
    scraping_monthly_credits: 200,
    scraping_initial_credits: 200,
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: true,
    can_use_round_robin: false,
    can_use_team_reports: true,
  },
  [SubscriptionTier.BUSINESS]: {
    max_deals: -1, // ilimitado
    max_users: 50,
    max_pipelines: 50,
    max_contacts: -1, // ilimitado
    agi_monthly_quota: -1, // ilimitado
    scraping_monthly_credits: 1000,
    scraping_initial_credits: 1000,
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: true,
    can_use_round_robin: true,
    can_use_team_reports: true,
  },
}

/**
 * Verifica se um tier pode usar uma feature específica
 */
export function canUseFeature(tier: SubscriptionTier, feature: string): boolean {
  const features = PLAN_FEATURES[tier]
  const key = `can_use_${feature}` as keyof typeof features
  const value = features[key]
  return typeof value === 'boolean' ? value : false
}

/**
 * Obtém o limite de um recurso específico
 */
export function getLimit(tier: SubscriptionTier, resource: string): number {
  const features = PLAN_FEATURES[tier]
  const key = resource as keyof typeof features
  const value = features[key]
  return typeof value === 'number' ? value : 0
}

/**
 * Obtém a quota de um recurso específico
 */
export function getQuota(tier: SubscriptionTier, quota: string): number {
  const features = PLAN_FEATURES[tier]
  const key = quota as keyof typeof features
  const value = features[key]
  return typeof value === 'number' ? value : 0
}

/**
 * Retorna o tier mínimo necessário para uma feature
 */
export function getRequiredPlanForFeature(feature: string): SubscriptionTier {
  const featureOrder = [
    SubscriptionTier.FREE,
    SubscriptionTier.STARTER,
    SubscriptionTier.PRO,
    SubscriptionTier.BUSINESS,
  ]
  
  for (const tier of featureOrder) {
    if (canUseFeature(tier, feature)) {
      return tier
    }
  }
  
  return SubscriptionTier.BUSINESS
}
