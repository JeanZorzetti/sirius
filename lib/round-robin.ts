/**
 * Round-Robin Lead Distribution
 * 
 * Distribui leads automaticamente entre os usuários da organização
 * Feature exclusiva do plano BUSINESS
 */

import { prisma } from './prisma'
import { SubscriptionTier } from '@prisma/client'
import logger from './logger'

export interface RoundRobinConfig {
  enabled: boolean
  userIds: string[]
  currentIndex: number
  assignToOwner: boolean // Se true, atribui ao dono do contato
  skipIfOffline: boolean
  notifyUsers: boolean
}

/**
 * Verifica se a organização pode usar round-robin
 */
export async function canUseRoundRobin(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { tier: true },
  })

  return org?.tier === SubscriptionTier.BUSINESS
}

/**
 * Obtém configuração de round-robin da organização
 */
export async function getRoundRobinConfig(organizationId: string): Promise<RoundRobinConfig> {
  const config = await prisma.roundRobinConfig.findUnique({
    where: { organizationId },
  })

  if (!config) {
    // Configuração padrão
    return {
      enabled: false,
      userIds: [],
      currentIndex: 0,
      assignToOwner: false,
      skipIfOffline: true,
      notifyUsers: true,
    }
  }

  return {
    enabled: config.enabled,
    userIds: config.userIds,
    currentIndex: config.currentIndex,
    assignToOwner: config.assignToOwner,
    skipIfOffline: config.skipIfOffline,
    notifyUsers: config.notifyUsers,
  }
}

/**
 * Salva configuração de round-robin
 */
export async function saveRoundRobinConfig(
  organizationId: string,
  config: Partial<RoundRobinConfig>
): Promise<void> {
  await prisma.roundRobinConfig.upsert({
    where: { organizationId },
    create: {
      organizationId,
      enabled: config.enabled ?? false,
      userIds: config.userIds ?? [],
      currentIndex: config.currentIndex ?? 0,
      assignToOwner: config.assignToOwner ?? false,
      skipIfOffline: config.skipIfOffline ?? true,
      notifyUsers: config.notifyUsers ?? true,
    },
    update: {
      enabled: config.enabled,
      userIds: config.userIds,
      currentIndex: config.currentIndex,
      assignToOwner: config.assignToOwner,
      skipIfOffline: config.skipIfOffline,
      notifyUsers: config.notifyUsers,
    },
  })
}

/**
 * Distribui um lead usando round-robin
 * Retorna o ID do usuário atribuído ou null
 */
export async function distributeLead(
  organizationId: string,
  leadId: string
): Promise<string | null> {
  // Verificar se pode usar round-robin
  if (!(await canUseRoundRobin(organizationId))) {
    return null
  }

  const config = await getRoundRobinConfig(organizationId)
  
  if (!config.enabled || config.userIds.length === 0) {
    return null
  }

  try {
    // Buscar usuários ativos
    let eligibleUsers = config.userIds

    if (config.skipIfOffline) {
      // Filtrar apenas usuários ativos recentemente (últimas 24 horas)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      const activeUsers = await prisma.user.findMany({
        where: {
          id: { in: config.userIds },
          organizationId,
          updatedAt: { gte: oneDayAgo },
        },
        select: { id: true },
      })

      eligibleUsers = activeUsers.map(u => u.id)

      // Se ninguém ativo, usar todos
      if (eligibleUsers.length === 0) {
        eligibleUsers = config.userIds
      }
    }

    if (eligibleUsers.length === 0) {
      return null
    }

    // Selecionar próximo usuário (round-robin)
    const currentIndex = config.currentIndex % eligibleUsers.length
    const assignedUserId = eligibleUsers[currentIndex]

    // Atualizar índice para próximo
    const nextIndex = (config.currentIndex + 1) % config.userIds.length
    await prisma.roundRobinConfig.update({
      where: { organizationId },
      data: { currentIndex: nextIndex },
    })

    // Atribuir lead ao usuário
    await prisma.contact.update({
      where: { id: leadId },
      data: { assignedToId: assignedUserId },
    })

    // Criar notificação
    if (config.notifyUsers) {
      await prisma.notification.create({
        data: {
          userId: assignedUserId,
          organizationId,
          type: 'SYSTEM',
          title: 'Novo lead atribuído',
          message: 'Um novo lead foi atribuído a você via round-robin',
        },
      })
    }

    logger.info({ 
      organizationId, 
      leadId, 
      assignedUserId,
      method: 'round-robin' 
    }, 'Lead distributed via round-robin')

    return assignedUserId

  } catch (error: any) {
    logger.error({ error: error.message, organizationId, leadId }, 'Round-robin distribution error')
    return null
  }
}

/**
 * Obtém estatísticas de distribuição round-robin
 */
export async function getRoundRobinStats(organizationId: string) {
  const config = await getRoundRobinConfig(organizationId)
  
  if (!config.enabled) {
    return null
  }

  // Contar leads atribuídos por usuário (últimos 30 dias)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const stats = await prisma.contact.groupBy({
    by: ['assignedToId'],
    where: {
      organizationId,
      assignedToId: { in: config.userIds },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: {
      id: true,
    },
  })

  // Mapear para usuários
  const users = await prisma.user.findMany({
    where: { id: { in: config.userIds } },
    select: { id: true, name: true, email: true },
  })

  return {
    config,
    distribution: users.map(user => {
      const stat = stats.find(s => s.assignedToId === user.id)
      return {
        user,
        leadsAssigned: stat?._count.id || 0,
      }
    }),
    totalDistributed: stats.reduce((sum, s) => sum + s._count.id, 0),
  }
}

/**
 * Força redistribuição de leads não atribuídos
 */
export async function redistributeUnassignedLeads(
  organizationId: string
): Promise<number> {
  const config = await getRoundRobinConfig(organizationId)
  
  if (!config.enabled || config.userIds.length === 0) {
    return 0
  }

  // Buscar leads não atribuídos
  const unassignedLeads = await prisma.contact.findMany({
    where: {
      organizationId,
      assignedToId: null,
    },
    select: { id: true },
  })

  let distributed = 0

  for (const lead of unassignedLeads) {
    const assigned = await distributeLead(organizationId, lead.id)
    if (assigned) {
      distributed++
    }
  }

  logger.info({ organizationId, distributed }, 'Redistributed unassigned leads')

  return distributed
}
