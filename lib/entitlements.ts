/**
 * Entitlements System
 *
 * Define os limites e recursos disponíveis por tier de plano
 * FREE → STARTER → PRO → BUSINESS
 *
 * Trial: novos usuários recebem 7 dias com acesso PRO completo.
 * Após expirar sem pagamento: conta vai para read-only (pode ver, não pode criar/editar).
 *
 * Fonte única de limites de plano (US7, spec 002-remove-dead-code): absorve o que
 * antes vivia em `lib/feature-gates.ts` (enforcement server-side) e `lib/plan-limits.ts`
 * (limites de contatos/pipelines/deals), que só reliam PLAN_LIMITS/PLAN_FEATURES daqui.
 */

import { SubscriptionTier } from '@prisma/client'
import { prisma } from './prisma'

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

// ============================================================
// ENFORCEMENT SERVER-SIDE (absorvido de lib/feature-gates.ts, US7)
// ============================================================

/**
 * Erro quando uma feature está bloqueada
 */
export class FeatureBlockedError extends Error {
  constructor(
    public feature: string,
    public currentTier: SubscriptionTier,
    public requiredTier: SubscriptionTier
  ) {
    super(
      `Feature '${feature}' requires ${requiredTier} plan (you are on ${currentTier})`
    )
    this.name = 'FeatureBlockedError'
  }
}

/**
 * Erro quando um limite é atingido
 */
export class LimitReachedError extends Error {
  constructor(
    public resource: string,
    public limit: number,
    public current: number
  ) {
    super(`${resource} limit reached: ${current}/${limit}`)
    this.name = 'LimitReachedError'
  }
}

/**
 * Verifica se uma feature está disponível e lança erro se não estiver
 */
export async function requireFeature(
  organizationId: string,
  feature: string
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  if (!canUseFeature(org.tier, feature)) {
    const requiredTier = getRequiredPlanForFeature(feature)
    throw new FeatureBlockedError(feature, org.tier, requiredTier)
  }
}

/**
 * Verifica o limite de deals e lança erro se atingido
 */
export async function checkDealLimit(organizationId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      tier: true,
      grandfatheredDealLimit: true,
      grandfatheredAt: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Usar grandfatheredDealLimit se existir (clientes antigos)
  const limit = org.grandfatheredDealLimit ?? getLimit(org.tier, 'max_deals')

  // -1 = ilimitado
  if (limit === -1) {
    return
  }

  // Contar deals ativos (não arquivados)
  const activeDealCount = await prisma.deal.count({
    where: {
      organizationId,
      archived: false,
    },
  })

  if (activeDealCount >= limit) {
    throw new LimitReachedError('deals', limit, activeDealCount)
  }
}

/**
 * Verifica o limite de usuários e lança erro se atingido
 */
export async function checkUserLimit(organizationId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const limit = getLimit(org.tier, 'max_users')

  // -1 = ilimitado
  if (limit === -1) {
    return
  }

  const userCount = await prisma.user.count({
    where: { organizationId },
  })

  if (userCount >= limit) {
    throw new LimitReachedError('users', limit, userCount)
  }
}

/**
 * Verifica o limite de pipelines e lança erro se atingido
 */
export async function checkPipelineLimit(
  organizationId: string
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const limit = getLimit(org.tier, 'max_pipelines')

  // -1 = ilimitado
  if (limit === -1) {
    return
  }

  const pipelineCount = await prisma.pipeline.count({
    where: { organizationId },
  })

  if (pipelineCount >= limit) {
    throw new LimitReachedError('pipelines', limit, pipelineCount)
  }
}

/**
 * Verifica o limite de projetos de tarefas e lança erro se atingido
 */
export async function checkTaskProjectLimit(
  organizationId: string
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const limit = getLimit(org.tier, 'max_task_projects')

  if (limit === -1) {
    return
  }

  const projectCount = await prisma.taskProject.count({
    where: { organizationId, archived: false },
  })

  if (projectCount >= limit) {
    throw new LimitReachedError('task_projects', limit, projectCount)
  }
}

/**
 * Verifica o limite de tarefas e lança erro se atingido
 */
export async function checkTaskLimit(
  organizationId: string
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const limit = getLimit(org.tier, 'max_tasks')

  if (limit === -1) {
    return
  }

  const taskCount = await prisma.task.count({
    where: { organizationId, archived: false },
  })

  if (taskCount >= limit) {
    throw new LimitReachedError('tasks', limit, taskCount)
  }
}

/**
 * Verifica o limite de statuses por projeto de tarefas
 */
export async function checkTaskStatusLimit(
  projectId: string
): Promise<void> {
  const project = await prisma.taskProject.findUnique({
    where: { id: projectId },
    select: {
      organizationId: true,
      organization: { select: { tier: true } },
    },
  })

  if (!project) {
    throw new Error('Task project not found')
  }

  const limit = getLimit(project.organization.tier, 'max_task_statuses_per_project')

  if (limit === -1) {
    return
  }

  const statusCount = await prisma.taskStatus.count({
    where: { projectId },
  })

  if (statusCount >= limit) {
    throw new LimitReachedError('task_statuses', limit, statusCount)
  }
}

/**
 * Verifica a quota de IA (AGI) e lança erro se excedida
 */
export async function checkAgiQuota(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      tier: true,
      agiQuota: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const monthlyLimit = getQuota(org.tier, 'agi_monthly_quota')

  // -1 = ilimitado
  if (monthlyLimit === -1) {
    return true
  }

  // 0 = sem acesso
  if (monthlyLimit === 0) {
    return false
  }

  // Verificar ou criar quota
  if (!org.agiQuota) {
    await prisma.agiQuota.create({
      data: {
        organizationId,
        monthlyLimit,
        usedThisMonth: 0,
        lastReset: new Date(),
      },
    })
    return true
  }

  // Verificar se precisa resetar (novo mês)
  const lastReset = new Date(org.agiQuota.lastReset)
  const now = new Date()

  if (
    lastReset.getMonth() !== now.getMonth() ||
    lastReset.getFullYear() !== now.getFullYear()
  ) {
    await prisma.agiQuota.update({
      where: { organizationId },
      data: {
        usedThisMonth: 0,
        lastReset: now,
      },
    })
    return true
  }

  // Verificar se excedeu o limite
  return org.agiQuota.usedThisMonth < monthlyLimit
}

/**
 * Consome 1 crédito de quota de IA
 */
export async function consumeAgiQuota(organizationId: string): Promise<void> {
  // Garantir que quota existe
  const quota = await prisma.agiQuota.findUnique({
    where: { organizationId },
  })

  if (!quota) {
    // Criar se não existir
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { tier: true },
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    const monthlyLimit = getQuota(org.tier, 'agi_monthly_quota')

    await prisma.agiQuota.create({
      data: {
        organizationId,
        monthlyLimit,
        usedThisMonth: 1,
        lastReset: new Date(),
      },
    })
  } else {
    // Incrementar uso
    await prisma.agiQuota.update({
      where: { organizationId },
      data: {
        usedThisMonth: { increment: 1 },
      },
    })
  }
}

/**
 * Obtém a quota atual de IA
 */
export async function getAgiQuotaStatus(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      tier: true,
      agiQuota: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const monthlyLimit = getQuota(org.tier, 'agi_monthly_quota')
  const usedThisMonth = org.agiQuota?.usedThisMonth ?? 0

  return {
    limit: monthlyLimit,
    used: usedThisMonth,
    remaining: monthlyLimit === -1 ? -1 : monthlyLimit - usedThisMonth,
    isUnlimited: monthlyLimit === -1,
    hasAccess: monthlyLimit !== 0,
  }
}

/**
 * Verifica e consome créditos de scraping
 */
export async function checkAndConsumeScrapingCredits(
  organizationId: string,
  amount: number
): Promise<void> {
  const credits = await prisma.scrapingCredit.findUnique({
    where: { organizationId },
  })

  if (!credits) {
    throw new Error('Scraping credits not found')
  }

  if (credits.balance < amount) {
    throw new LimitReachedError('scraping_credits', credits.balance, amount)
  }

  // Deduzir créditos
  await prisma.scrapingCredit.update({
    where: { organizationId },
    data: {
      balance: { decrement: amount },
      usedThisMonth: { increment: amount },
    },
  })
}

/**
 * Obtém o status de créditos de scraping
 */
export async function getScrapingCreditsStatus(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      tier: true,
      scrapingCredit: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const monthlyQuota = getQuota(org.tier, 'scraping_monthly_credits')

  // Se não tem scraping credit, criar
  if (!org.scrapingCredit) {
    const initialCredits =
      org.tier === 'FREE'
        ? getQuota(org.tier, 'scraping_initial_credits')
        : monthlyQuota

    const newCredit = await prisma.scrapingCredit.create({
      data: {
        organizationId,
        balance: initialCredits,
        monthlyQuota,
        usedThisMonth: 0,
        lastRefill: new Date(),
      },
    })

    return {
      balance: newCredit.balance,
      monthlyQuota,
      usedThisMonth: 0,
      hasAccess: monthlyQuota > 0 || initialCredits > 0,
    }
  }

  return {
    balance: org.scrapingCredit.balance,
    monthlyQuota: org.scrapingCredit.monthlyQuota,
    usedThisMonth: org.scrapingCredit.usedThisMonth,
    hasAccess: org.scrapingCredit.monthlyQuota > 0,
  }
}

/**
 * Verifica se uma organização pode criar mais instâncias WhatsApp
 */
export async function checkWhatsAppInstanceLimit(
  organizationId: string
): Promise<boolean> {
  const { prismaWa } = await import('@/lib/prisma-wa')

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      tier: true,
      whatsappInstances: true,
      addons: {
        where: {
          type: 'WHATSAPP_EXTRA_INSTANCE',
          status: 'ACTIVE',
        },
        select: { quantity: true },
      },
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Calcular limite total
  const baseLimit = org.whatsappInstances
  const addonInstances = org.addons.reduce(
    (sum, addon) => sum + addon.quantity,
    0
  )
  const totalLimit = baseLimit + addonInstances

  // Contar instâncias atuais (from WA DB)
  const currentCount = await prismaWa.whatsAppConnection.count({
    where: { organizationId },
  })

  return currentCount < totalLimit
}

/**
 * Tipo de retorno para entitlements completos
 */
export interface OrganizationEntitlements {
  tier: SubscriptionTier
  customPricing?: number | null
  features: {
    automation: boolean
    agi: boolean
    chatInterface: boolean
    roundRobin: boolean
    teamReports: boolean
    taskKanban: boolean
    taskCalendar: boolean
    taskTable: boolean
    timeTracking: boolean
    taskDependencies: boolean
    recurringTasks: boolean
    taskBulkActions: boolean
    taskAnalytics: boolean
  }
  limits: {
    deals: number // -1 = unlimited
    users: number
    pipelines: number
    taskProjects: number
    tasks: number
    taskStatusesPerProject: number
  }
  quotas: {
    agi: {
      limit: number
      used: number
      remaining: number
    }
    scraping: {
      balance: number
      monthlyQuota: number
      usedThisMonth: number
    }
  }
}

/**
 * Obtém todos os entitlements de uma organização em um único objeto
 */
export async function getOrganizationEntitlements(
  organizationId: string
): Promise<OrganizationEntitlements> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      tier: true,
      customPricing: true,
      grandfatheredDealLimit: true,
      agiQuota: true,
      scrapingCredit: true,
    },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const features = PLAN_FEATURES[org.tier]

  const agiQuotaStatus = await getAgiQuotaStatus(organizationId)
  const scrapingCreditsStatus = await getScrapingCreditsStatus(organizationId)

  return {
    tier: org.tier,
    customPricing: org.customPricing ? Number(org.customPricing) : null,
    features: {
      automation: features.can_use_automation,
      agi: features.can_use_agi,
      chatInterface: features.can_use_chat_interface,
      roundRobin: features.can_use_round_robin,
      teamReports: features.can_use_team_reports,
      taskKanban: features.can_use_task_kanban,
      taskCalendar: features.can_use_task_calendar,
      taskTable: features.can_use_task_table,
      timeTracking: features.can_use_time_tracking,
      taskDependencies: features.can_use_task_dependencies,
      recurringTasks: features.can_use_recurring_tasks,
      taskBulkActions: features.can_use_task_bulk_actions,
      taskAnalytics: features.can_use_task_analytics,
    },
    limits: {
      deals: org.grandfatheredDealLimit ?? features.max_deals,
      users: features.max_users,
      pipelines: features.max_pipelines,
      taskProjects: features.max_task_projects,
      tasks: features.max_tasks,
      taskStatusesPerProject: features.max_task_statuses_per_project,
    },
    quotas: {
      agi: {
        limit: agiQuotaStatus.limit,
        used: agiQuotaStatus.used,
        remaining: agiQuotaStatus.remaining,
      },
      scraping: {
        balance: scrapingCreditsStatus.balance,
        monthlyQuota: scrapingCreditsStatus.monthlyQuota,
        usedThisMonth: scrapingCreditsStatus.usedThisMonth,
      },
    },
  }
}

// ============================================================
// LIMITES DE CONTATOS/PIPELINES/DEALS (absorvido de lib/plan-limits.ts, US7)
// ============================================================

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
