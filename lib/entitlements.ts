/**
 * Entitlements System
 *
 * Define os limites e recursos disponíveis por tier de plano
 * FREE → STARTER → PRO → BUSINESS
 *
 * Trial: novos usuários recebem 7 dias com acesso PRO completo.
 * Após expirar sem pagamento: conta vai para read-only (pode ver, não pode criar/editar).
 */

import { SubscriptionTier } from '@prisma/client'

// Re-exportar SubscriptionTier
export { SubscriptionTier }

// Tipo mínimo necessário para verificar estado do trial
type OrgTrialInfo = {
  tier: SubscriptionTier
  trialEndsAt: Date | null
  trialStatus: string | null
}

/**
 * Retorna true se o trial do usuário está ativo (não expirou e não converteu)
 */
export function isTrialActive(org: OrgTrialInfo): boolean {
  if (org.tier !== SubscriptionTier.FREE) return false
  if (org.trialStatus === 'CONVERTED' || org.trialStatus === 'EXPIRED') return false
  if (!org.trialEndsAt) return false
  return org.trialEndsAt > new Date()
}

/**
 * Retorna o tier efetivo considerando trial.
 * - Tier pago: retorna o tier real
 * - Trial ativo: retorna PRO (acesso completo)
 * - Trial expirado sem pagamento: retorna FREE (read-only aplicado separadamente)
 */
export function getEffectiveTier(org: OrgTrialInfo): SubscriptionTier {
  if (org.tier !== SubscriptionTier.FREE) return org.tier
  if (isTrialActive(org)) return SubscriptionTier.PRO
  return SubscriptionTier.FREE
}

/**
 * Retorna true se a org está em modo read-only.
 * Condição: plano FREE + trial expirado (ou nunca iniciado).
 */
export function isReadOnly(org: OrgTrialInfo): boolean {
  if (org.tier !== SubscriptionTier.FREE) return false
  if (isTrialActive(org)) return false
  return true
}

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

  // Task Management
  maxTaskProjects: number
  maxTasks: number
  maxTaskStatusesPerProject: number

  // Features exclusivas
  features: {
    roundRobin: boolean
    leadScoring: boolean
    apiAccess: boolean
    webhooks: boolean
    customDomain: boolean
    sso: boolean
    auditLog: boolean
    taskKanban: boolean
    taskCalendar: boolean
    taskTable: boolean
    timeTracking: boolean
    taskDependencies: boolean
    recurringTasks: boolean
    taskBulkActions: boolean
    taskAnalytics: boolean
  }
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  [SubscriptionTier.FREE]: {
    maxContacts: 250,
    maxDeals: 100,
    maxDealsPerPipeline: 100,
    maxPipelines: 1,
    maxUsers: 2,
    scrapingCreditsMonthly: 0,
    maxScrapingPerSearch: 0,
    maxWhatsAppInstances: 0,
    maxEmailAutomations: 0,
    maxSequences: 0,
    allowedIntegrations: [],
    advancedAnalytics: false,
    customReports: false,
    supportLevel: 'community',
    maxTaskProjects: 1,
    maxTasks: 50,
    maxTaskStatusesPerProject: 3,
    features: {
      roundRobin: false,
      leadScoring: false,
      apiAccess: false,
      webhooks: false,
      customDomain: false,
      sso: false,
      auditLog: false,
      taskKanban: false,
      taskCalendar: false,
      taskTable: false,
      timeTracking: false,
      taskDependencies: false,
      recurringTasks: false,
      taskBulkActions: false,
      taskAnalytics: false,
    },
  },

  [SubscriptionTier.STARTER]: {
    maxContacts: 1000,
    maxDeals: 500,
    maxDealsPerPipeline: 500,
    maxPipelines: 5,
    maxUsers: 5,
    scrapingCreditsMonthly: 75,
    maxScrapingPerSearch: 75,
    maxWhatsAppInstances: 0,
    maxEmailAutomations: 5,
    maxSequences: 5,
    allowedIntegrations: ['google-calendar', 'n8n'],
    advancedAnalytics: false,
    customReports: false,
    supportLevel: 'email',
    maxTaskProjects: 5,
    maxTasks: 500,
    maxTaskStatusesPerProject: 6,
    features: {
      roundRobin: false,
      leadScoring: false,
      apiAccess: false,
      webhooks: false,
      customDomain: false,
      sso: false,
      auditLog: false,
      taskKanban: true,
      taskCalendar: true,
      taskTable: false,
      timeTracking: false,
      taskDependencies: false,
      recurringTasks: false,
      taskBulkActions: false,
      taskAnalytics: false,
    },
  },

  [SubscriptionTier.PRO]: {
    maxContacts: 5000,
    maxDeals: 2500,
    maxDealsPerPipeline: 2500,
    maxPipelines: 15,
    maxUsers: 15,
    scrapingCreditsMonthly: 300,
    maxScrapingPerSearch: 150,
    maxWhatsAppInstances: 0,
    maxEmailAutomations: 15,
    maxSequences: 15,
    allowedIntegrations: ['google-calendar', 'n8n', 'webhook', 'zapier'],
    advancedAnalytics: true,
    customReports: false,
    supportLevel: 'priority',
    maxTaskProjects: 25,
    maxTasks: 5000,
    maxTaskStatusesPerProject: 15,
    features: {
      roundRobin: false,
      leadScoring: true,
      apiAccess: true,
      webhooks: true,
      customDomain: false,
      sso: false,
      auditLog: false,
      taskKanban: true,
      taskCalendar: true,
      taskTable: true,
      timeTracking: true,
      taskDependencies: true,
      recurringTasks: true,
      taskBulkActions: true,
      taskAnalytics: true,
    },
  },

  [SubscriptionTier.BUSINESS]: {
    maxContacts: null, // ilimitado
    maxDeals: null, // ilimitado
    maxDealsPerPipeline: null,
    maxPipelines: 50,
    maxUsers: 50,
    scrapingCreditsMonthly: 1500,
    maxScrapingPerSearch: 500,
    maxWhatsAppInstances: 5,
    maxEmailAutomations: 50,
    maxSequences: 50,
    allowedIntegrations: ['*'], // todas
    advancedAnalytics: true,
    customReports: true,
    supportLevel: 'dedicated',
    maxTaskProjects: -1, // ilimitado
    maxTasks: -1, // ilimitado
    maxTaskStatusesPerProject: -1, // ilimitado
    features: {
      roundRobin: true,
      leadScoring: true,
      apiAccess: true,
      webhooks: true,
      customDomain: true,
      sso: true,
      auditLog: true,
      taskKanban: true,
      taskCalendar: true,
      taskTable: true,
      timeTracking: true,
      taskDependencies: true,
      recurringTasks: true,
      taskBulkActions: true,
      taskAnalytics: true,
    },
  },
}

// Preços dos planos (mensal)
export const PLAN_PRICING: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.STARTER]: 67,
  [SubscriptionTier.PRO]: 147,
  [SubscriptionTier.BUSINESS]: 397,
}

// Preços anuais (20% off)
export const PLAN_PRICING_ANNUAL: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREE]: 0,
  [SubscriptionTier.STARTER]: 643.20,
  [SubscriptionTier.PRO]: 1411.20,
  [SubscriptionTier.BUSINESS]: 3811.20,
}

export const ANNUAL_DISCOUNT_PERCENT = 20

// Add-on pricing
export const ADDON_PRICING = {
  EXTRA_ACTION: 0.15,
  EXTRA_AGENT: 29,
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
  max_task_projects: number
  max_tasks: number
  max_task_statuses_per_project: number
  agi_monthly_quota: number
  scraping_monthly_credits: number
  scraping_initial_credits: number
  can_use_automation: boolean
  can_use_agi: boolean
  can_use_chat_interface: boolean
  can_use_round_robin: boolean
  can_use_team_reports: boolean
  can_use_task_kanban: boolean
  can_use_task_calendar: boolean
  can_use_task_table: boolean
  can_use_time_tracking: boolean
  can_use_task_dependencies: boolean
  can_use_recurring_tasks: boolean
  can_use_task_bulk_actions: boolean
  can_use_task_analytics: boolean
}> = {
  [SubscriptionTier.FREE]: {
    max_deals: 100,
    max_users: 2,
    max_pipelines: 1,
    max_contacts: 250,
    max_task_projects: 1,
    max_tasks: 50,
    max_task_statuses_per_project: 3,
    agi_monthly_quota: 0,
    scraping_monthly_credits: 0,
    scraping_initial_credits: 0,
    can_use_automation: false,
    can_use_agi: false,
    can_use_chat_interface: false,
    can_use_round_robin: false,
    can_use_team_reports: false,
    can_use_task_kanban: false,
    can_use_task_calendar: false,
    can_use_task_table: false,
    can_use_time_tracking: false,
    can_use_task_dependencies: false,
    can_use_recurring_tasks: false,
    can_use_task_bulk_actions: false,
    can_use_task_analytics: false,
  },
  [SubscriptionTier.STARTER]: {
    max_deals: 500,
    max_users: 5,
    max_pipelines: 5,
    max_contacts: 1000,
    max_task_projects: 5,
    max_tasks: 500,
    max_task_statuses_per_project: 6,
    agi_monthly_quota: 200,
    scraping_monthly_credits: 75,
    scraping_initial_credits: 75,
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: false,
    can_use_round_robin: false,
    can_use_team_reports: false,
    can_use_task_kanban: true,
    can_use_task_calendar: true,
    can_use_task_table: false,
    can_use_time_tracking: false,
    can_use_task_dependencies: false,
    can_use_recurring_tasks: false,
    can_use_task_bulk_actions: false,
    can_use_task_analytics: false,
  },
  [SubscriptionTier.PRO]: {
    max_deals: 2500,
    max_users: 15,
    max_pipelines: 15,
    max_contacts: 5000,
    max_task_projects: 25,
    max_tasks: 5000,
    max_task_statuses_per_project: 15,
    agi_monthly_quota: 1000,
    scraping_monthly_credits: 300,
    scraping_initial_credits: 300,
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: false,
    can_use_round_robin: false,
    can_use_team_reports: true,
    can_use_task_kanban: true,
    can_use_task_calendar: true,
    can_use_task_table: true,
    can_use_time_tracking: true,
    can_use_task_dependencies: true,
    can_use_recurring_tasks: true,
    can_use_task_bulk_actions: true,
    can_use_task_analytics: true,
  },
  [SubscriptionTier.BUSINESS]: {
    max_deals: -1, // ilimitado
    max_users: 50,
    max_pipelines: 50,
    max_contacts: -1, // ilimitado
    max_task_projects: -1, // ilimitado
    max_tasks: -1, // ilimitado
    max_task_statuses_per_project: -1, // ilimitado
    agi_monthly_quota: 3000,
    scraping_monthly_credits: 1500,
    scraping_initial_credits: 1500,
    can_use_automation: true,
    can_use_agi: true,
    can_use_chat_interface: true,
    can_use_round_robin: true,
    can_use_team_reports: true,
    can_use_task_kanban: true,
    can_use_task_calendar: true,
    can_use_task_table: true,
    can_use_time_tracking: true,
    can_use_task_dependencies: true,
    can_use_recurring_tasks: true,
    can_use_task_bulk_actions: true,
    can_use_task_analytics: true,
  },
}

/**
 * Verifica se um tier pode usar uma feature específica
 * Aceita tanto 'chat_interface' quanto 'can_use_chat_interface'
 */
export function canUseFeature(tier: SubscriptionTier, feature: string): boolean {
  const features = PLAN_FEATURES[tier]
  // Remove prefixo can_use_ se existir para evitar duplicação
  const cleanFeature = feature.replace(/^can_use_/, '')
  const key = `can_use_${cleanFeature}` as keyof typeof features
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
