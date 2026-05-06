/**
 * Feature Gates - v2.0 Modular Plans
 *
 * Middleware e utilidades para controlar acesso às features por plano.
 */

import { Organization, SubscriptionTier } from '@prisma/client'
import {
  canUseFeature,
  getLimit,
  getQuota,
  PLAN_FEATURES,
  getRequiredPlanForFeature,
} from './entitlements'
import { prisma } from './prisma'

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
