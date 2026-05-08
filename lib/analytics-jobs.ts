/**
 * Analytics Jobs - Funções de agregação para snapshots diários
 *
 * Este módulo contém jobs que devem rodar via cron (diariamente)
 * para agregar dados e criar snapshots históricos.
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import { calculateLTV, calculateCAC, calculateChurnRate } from '@/lib/analytics/kpis'
import { calculateRevenueForecasts } from '@/lib/analytics/forecasting'

/**
 * Cria snapshot diário de todos os deals de uma organização
 * Deve rodar 1x por dia (ex: meia-noite) via cron job
 */
export async function createDailyDealSnapshot(organizationId: string, date: Date = new Date()) {
  // Normalizar data para meia-noite (sem hora)
  const snapshotDate = new Date(date)
  snapshotDate.setHours(0, 0, 0, 0)

  try {
    // Buscar todos os deals ativos
    const deals = await prisma.deal.findMany({
      where: {
        organizationId,
      },
      include: {
        stage: true,
        pipeline: true,
      },
    })

    // Buscar deals criados hoje
    const startOfDay = new Date(snapshotDate)
    const endOfDay = new Date(snapshotDate)
    endOfDay.setHours(23, 59, 59, 999)

    const dealsCreatedToday = await prisma.deal.count({
      where: {
        organizationId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    // Deals fechados hoje (closeDate preenchido hoje)
    const dealsClosedToday = await prisma.deal.count({
      where: {
        organizationId,
        closeDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    // FASE 13: Tracking de deals perdidos
    const dealsLostToday = await prisma.deal.count({
      where: {
        organizationId,
        status: 'LOST',
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    // Calcular métricas agregadas
    const totalDeals = deals.length
    const totalValue = deals.reduce((sum, deal) => {
      return sum + (deal.value ? parseFloat(deal.value.toString()) : 0)
    }, 0)
    const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0

    // Breakdown por stage
    const dealsByStage: Record<string, { count: number; value: number }> = {}
    deals.forEach((deal) => {
      const stageId = deal.stageId
      if (!dealsByStage[stageId]) {
        dealsByStage[stageId] = { count: 0, value: 0 }
      }
      dealsByStage[stageId].count++
      dealsByStage[stageId].value += deal.value ? parseFloat(deal.value.toString()) : 0
    })

    // Breakdown por pipeline
    const dealsByPipeline: Record<string, { count: number; value: number }> = {}
    deals.forEach((deal) => {
      const pipelineId = deal.pipelineId
      if (!dealsByPipeline[pipelineId]) {
        dealsByPipeline[pipelineId] = { count: 0, value: 0 }
      }
      dealsByPipeline[pipelineId].count++
      dealsByPipeline[pipelineId].value += deal.value ? parseFloat(deal.value.toString()) : 0
    })

    // Criar ou atualizar snapshot
    const snapshot = await prisma.dealSnapshot.upsert({
      where: {
        organizationId_date: {
          organizationId,
          date: snapshotDate,
        },
      },
      create: {
        organizationId,
        date: snapshotDate,
        totalDeals,
        totalValue: new Decimal(totalValue),
        avgDealValue: new Decimal(avgDealValue),
        dealsByStage,
        dealsByPipeline,
        dealsCreated: dealsCreatedToday,
        dealsClosed: dealsClosedToday,
        dealsLost: dealsLostToday, // ✅ FASE 13: Implementado
      },
      update: {
        totalDeals,
        totalValue: new Decimal(totalValue),
        avgDealValue: new Decimal(avgDealValue),
        dealsByStage,
        dealsByPipeline,
        dealsCreated: dealsCreatedToday,
        dealsClosed: dealsClosedToday,
        dealsLost: dealsLostToday, // ✅ FASE 13: Implementado
      },
    })

    return snapshot
  } catch (error) {
    console.error(`Error creating deal snapshot for org ${organizationId}:`, error)
    throw error
  }
}

/**
 * Cria snapshots para TODAS as organizações
 * Chamado pelo cron job diário
 */
export async function createDailyDealSnapshotsForAllOrgs(date: Date = new Date()) {
  try {
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true },
    })

    const results = []
    for (const org of organizations) {
      try {
        const snapshot = await createDailyDealSnapshot(org.id, date)
        results.push({ organizationId: org.id, success: true, snapshot })
      } catch (error) {
        results.push({
          organizationId: org.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return {
      total: organizations.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }
  } catch (error) {
    console.error('Error creating daily snapshots for all orgs:', error)
    throw error
  }
}

/**
 * Cria snapshot mensal de receita
 * Deve rodar 1x por mês (ex: último dia do mês)
 */
export async function createMonthlyRevenueSnapshot(year: number, month: number) {
  try {
    // Criar snapshot global (todas as organizações)
    const allOrgs = await prisma.organization.findMany({
      select: {
        plan: true,
        createdAt: true,
      },
    })

    const totalOrgs = allOrgs.length
    const proOrgs = allOrgs.filter((org) => org.plan === 'PRO').length
    const freeOrgs = totalOrgs - proOrgs

    // MRR simplificado (TODO: calcular por tier real com customPricing)
    const proPrice = 147
    const mrr = proOrgs * proPrice
    const arr = mrr * 12

    // Orgs criadas este mês
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)

    const newOrgs = allOrgs.filter((org) => {
      const createdAt = new Date(org.createdAt)
      return createdAt >= startOfMonth && createdAt <= endOfMonth
    }).length

    // Organizações que cancelaram (downgrade para FREE) neste mês
    const churnedOrgs = await prisma.transaction.count({
      where: {
        type: 'PLAN_DOWNGRADE',
        status: 'COMPLETED',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        metadata: { path: ['newTier'], equals: 'FREE' },
      },
    })

    // Calcular churn e métricas avançadas
    const churnRate = await calculateChurnRate(startOfMonth, endOfMonth)
    const monthlyChurnRateDecimal = churnRate / 100
    const [ltv, cac, forecasts] = await Promise.all([
      calculateLTV(monthlyChurnRateDecimal || 0.05),
      calculateCAC(month, year),
      calculateRevenueForecasts(),
    ])

    // Criar snapshot global
    const globalSnapshot = await prisma.revenueSnapshot.upsert({
      where: {
        organizationId_year_month: {
          organizationId: null as any, // Global snapshot
          year,
          month,
        },
      },
      create: {
        date: endOfMonth,
        year,
        month,
        mrr: new Decimal(mrr),
        arr: new Decimal(arr),
        totalOrganizations: totalOrgs,
        proOrganizations: proOrgs,
        freeOrganizations: freeOrgs,
        newOrganizations: newOrgs,
        churnedOrganizations: churnedOrgs,
        avgLtv: ltv > 0 ? new Decimal(ltv) : null,
        avgCac: cac > 0 ? new Decimal(cac) : null,
        forecastNext30d: forecasts.forecastNext30d > 0 ? new Decimal(forecasts.forecastNext30d) : null,
        forecastNext60d: forecasts.forecastNext60d > 0 ? new Decimal(forecasts.forecastNext60d) : null,
        forecastNext90d: forecasts.forecastNext90d > 0 ? new Decimal(forecasts.forecastNext90d) : null,
      },
      update: {
        mrr: new Decimal(mrr),
        arr: new Decimal(arr),
        totalOrganizations: totalOrgs,
        proOrganizations: proOrgs,
        freeOrganizations: freeOrgs,
        newOrganizations: newOrgs,
        churnedOrganizations: churnedOrgs,
        avgLtv: ltv > 0 ? new Decimal(ltv) : null,
        avgCac: cac > 0 ? new Decimal(cac) : null,
        forecastNext30d: forecasts.forecastNext30d > 0 ? new Decimal(forecasts.forecastNext30d) : null,
        forecastNext60d: forecasts.forecastNext60d > 0 ? new Decimal(forecasts.forecastNext60d) : null,
        forecastNext90d: forecasts.forecastNext90d > 0 ? new Decimal(forecasts.forecastNext90d) : null,
      },
    })

    return globalSnapshot
  } catch (error) {
    console.error('Error creating monthly revenue snapshot:', error)
    throw error
  }
}

/**
 * Registra atividade do usuário
 * Chamado em diversos pontos da aplicação
 */
export async function trackUserActivity(params: {
  userId: string | null
  organizationId: string
  type: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}) {
  try {
    const activity = await prisma.userActivity.create({
      data: {
        userId: params.userId || undefined,
        organizationId: params.organizationId,
        type: params.type as any,
        metadata: params.metadata || undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })

    return activity
  } catch (error) {
    // Não falhar a request principal se analytics falhar
    console.error('Error tracking user activity:', error)
    return null
  }
}

/**
 * Helper para registrar atividade de forma não-bloqueante
 * Usa fire-and-forget para não atrasar respostas
 */
export function trackActivityAsync(params: Parameters<typeof trackUserActivity>[0]) {
  // Fire and forget - não espera retorno
  trackUserActivity(params).catch((error) => {
    console.error('Failed to track activity async:', error)
  })
}
