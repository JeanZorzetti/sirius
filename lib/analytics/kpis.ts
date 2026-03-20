import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Constantes de negócio — preço mensal por tier
 */
const TIER_PRICES: Record<string, number> = {
  STARTER: 49,
  PRO: 97,
  BUSINESS: 149,
}

/**
 * Calcula o MRR (Monthly Recurring Revenue) atual
 * MRR = soma do preço mensal de cada organização paga
 */
export async function calculateMRR(): Promise<number> {
  const paidOrgs = await prisma.organization.findMany({
    where: { 
      tier: { in: ['STARTER', 'PRO', 'BUSINESS'] },
      isTestAccount: false
    },
    select: { tier: true },
  })

  return paidOrgs.reduce((sum, org) => sum + (TIER_PRICES[org.tier] || 0), 0)
}

/**
 * Calcula o ARR (Annual Recurring Revenue) atual
 * ARR = MRR * 12
 */
export async function calculateARR(): Promise<number> {
  const mrr = await calculateMRR()
  return mrr * 12
}

/**
 * Calcula o Churn Rate (taxa de cancelamento) de um período
 * Churn Rate = (organizações que cancelaram / organizações ativas no início) * 100
 *
 * @param startDate - Data de início do período
 * @param endDate - Data de fim do período
 * @returns Taxa de churn em porcentagem (0-100)
 */
export async function calculateChurnRate(
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Organizações ativas no início do período
  const organizationsAtStart = await prisma.organization.count({
    where: {
      createdAt: { lte: startDate },
      // Não temos campo de cancelamento ainda, então assumimos que todas estão ativas
    },
  })

  if (organizationsAtStart === 0) return 0

  // Organizações que "cancelaram" (downgrade de PRO para FREE)
  // Como não temos histórico de mudanças de plano, vamos simular usando UserActivity
  const downgrades = await prisma.userActivity.count({
    where: {
      type: 'FEATURE_USED',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      metadata: {
        path: ['action'],
        equals: 'downgrade',
      },
    },
  })

  const churnRate = (downgrades / organizationsAtStart) * 100
  return Math.round(churnRate * 100) / 100 // 2 casas decimais
}

/**
 * Calcula o LTV (Lifetime Value) médio
 * LTV = (MRR médio por cliente * margem de lucro) / churn rate mensal
 *
 * Simplificação: LTV = MRR médio por cliente / churn rate mensal
 * (assumindo margem de 100% para SaaS)
 *
 * @param monthlyChurnRate - Taxa de churn mensal (0-1)
 * @returns LTV médio em reais
 */
export async function calculateLTV(monthlyChurnRate: number = 0.05): Promise<number> {
  const paidOrgs = await prisma.organization.findMany({
    where: { 
      tier: { in: ['STARTER', 'PRO', 'BUSINESS'] },
      isTestAccount: false
    },
    select: { tier: true },
  })

  if (paidOrgs.length === 0 || monthlyChurnRate === 0) {
    return 0
  }

  const totalRevenue = paidOrgs.reduce((sum, org) => sum + (TIER_PRICES[org.tier] || 0), 0)
  const avgRevenuePerCustomer = totalRevenue / paidOrgs.length

  // LTV = Receita média por cliente / Churn rate mensal
  const ltv = avgRevenuePerCustomer / monthlyChurnRate

  return Math.round(ltv * 100) / 100
}

/**
 * Calcula o CAC (Customer Acquisition Cost) médio
 *
 * NOTA: Por enquanto retorna 0, pois não temos integração com gastos de marketing.
 * Quando integrar Google Ads, Facebook Ads, etc., devemos calcular:
 * CAC = Total de gastos em marketing / Número de novos clientes
 *
 * @param month - Mês (1-12)
 * @param year - Ano (ex: 2024)
 * @returns CAC médio em reais
 */
export async function calculateCAC(month: number, year: number): Promise<number> {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  // Buscar gasto total em ads no mês (Google Ads + Facebook Ads + manual)
  const adSpendResult = await prisma.adsMetric.aggregate({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { spend: true },
  })

  const totalSpend = parseFloat(String(adSpendResult._sum.spend ?? 0))

  if (totalSpend === 0) return 0

  // Novos clientes pagantes adquiridos no mês
  const newPaidOrgs = await prisma.organization.count({
    where: {
      tier: { in: ['STARTER', 'PRO', 'BUSINESS'] },
      isTestAccount: false,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  })

  if (newPaidOrgs === 0) return totalSpend // CAC = gasto total se nenhum cliente novo

  return totalSpend / newPaidOrgs
}

/**
 * Calcula a Conversion Rate (taxa de conversão) por pipeline
 * Conversion Rate = (deals fechados / deals criados) * 100
 *
 * @param organizationId - ID da organização
 * @param pipelineId - ID do pipeline (opcional, se não informado calcula para todos)
 * @param startDate - Data de início do período
 * @param endDate - Data de fim do período
 * @returns Taxa de conversão em porcentagem (0-100)
 */
export async function calculateConversionRate(
  organizationId: string,
  pipelineId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const where: any = { organizationId }

  if (pipelineId) {
    where.pipelineId = pipelineId
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  }

  // Total de deals criados
  const totalDeals = await prisma.deal.count({ where })

  if (totalDeals === 0) return 0

  // Deals fechados (won)
  const closedDeals = await prisma.deal.count({
    where: {
      ...where,
      stage: {
        isClosedWon: true,
      },
    },
  })

  const conversionRate = (closedDeals / totalDeals) * 100
  return Math.round(conversionRate * 100) / 100 // 2 casas decimais
}

/**
 * Calcula o Win Rate (taxa de vitória) - similar ao Conversion Rate
 * mas considera apenas deals que foram finalizados (won ou lost)
 *
 * Win Rate = deals won / (deals won + deals lost) * 100
 */
export async function calculateWinRate(
  organizationId: string,
  pipelineId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const where: any = { organizationId }

  if (pipelineId) {
    where.pipelineId = pipelineId
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: startDate,
      lte: endDate,
    }
  }

  // Deals won
  const wonDeals = await prisma.deal.count({
    where: {
      ...where,
      stage: {
        isClosedWon: true,
      },
    },
  })

  // Deals lost
  const lostDeals = await prisma.deal.count({
    where: {
      ...where,
      stage: {
        isClosedLost: true,
      },
    },
  })

  const totalClosed = wonDeals + lostDeals

  if (totalClosed === 0) return 0

  const winRate = (wonDeals / totalClosed) * 100
  return Math.round(winRate * 100) / 100
}

/**
 * Calcula o Average Deal Value (valor médio de deal)
 */
export async function calculateAvgDealValue(
  organizationId: string,
  pipelineId?: string
): Promise<number> {
  const where: any = { organizationId }

  if (pipelineId) {
    where.pipelineId = pipelineId
  }

  const result = await prisma.deal.aggregate({
    where,
    _avg: {
      value: true,
    },
  })

  return result._avg.value ? parseFloat(result._avg.value.toString()) : 0
}

/**
 * Calcula o Sales Cycle Length (duração média do ciclo de vendas)
 * Tempo médio entre criação do deal e fechamento (won)
 *
 * @returns Duração em dias
 */
export async function calculateSalesCycleLength(
  organizationId: string,
  pipelineId?: string
): Promise<number> {
  const where: any = {
    organizationId,
    stage: {
      isClosedWon: true,
    },
  }

  if (pipelineId) {
    where.pipelineId = pipelineId
  }

  const closedDeals = await prisma.deal.findMany({
    where,
    select: {
      createdAt: true,
      updatedAt: true, // Assumindo que updatedAt é quando foi fechado
    },
  })

  if (closedDeals.length === 0) return 0

  const totalDays = closedDeals.reduce((sum, deal) => {
    const durationMs = deal.updatedAt.getTime() - deal.createdAt.getTime()
    const durationDays = durationMs / (1000 * 60 * 60 * 24)
    return sum + durationDays
  }, 0)

  const avgDays = totalDays / closedDeals.length
  return Math.round(avgDays * 10) / 10 // 1 casa decimal
}

/**
 * Calcula o Pipeline Velocity (velocidade do pipeline)
 * Número de deals fechados (won) por período / duração do período
 *
 * @returns Deals fechados por dia
 */
export async function calculatePipelineVelocity(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  pipelineId?: string
): Promise<number> {
  const where: any = {
    organizationId,
    stage: {
      isClosedWon: true,
    },
    updatedAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (pipelineId) {
    where.pipelineId = pipelineId
  }

  const closedDeals = await prisma.deal.count({ where })

  const durationMs = endDate.getTime() - startDate.getTime()
  const durationDays = durationMs / (1000 * 60 * 60 * 24)

  if (durationDays === 0) return 0

  const velocity = closedDeals / durationDays
  return Math.round(velocity * 100) / 100
}

/**
 * Objeto agregado com todos os KPIs de uma organização
 */
export interface OrganizationKPIs {
  // Revenue metrics
  conversionRate: number
  winRate: number
  avgDealValue: number

  // Sales metrics
  salesCycleLength: number
  pipelineVelocity: number

  // Period info
  period: {
    start: Date
    end: Date
  }
}

/**
 * Calcula todos os KPIs de uma organização em um período
 */
export async function calculateOrganizationKPIs(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  pipelineId?: string
): Promise<OrganizationKPIs> {
  const [
    conversionRate,
    winRate,
    avgDealValue,
    salesCycleLength,
    pipelineVelocity,
  ] = await Promise.all([
    calculateConversionRate(organizationId, pipelineId, startDate, endDate),
    calculateWinRate(organizationId, pipelineId, startDate, endDate),
    calculateAvgDealValue(organizationId, pipelineId),
    calculateSalesCycleLength(organizationId, pipelineId),
    calculatePipelineVelocity(organizationId, startDate, endDate, pipelineId),
  ])

  return {
    conversionRate,
    winRate,
    avgDealValue,
    salesCycleLength,
    pipelineVelocity,
    period: {
      start: startDate,
      end: endDate,
    },
  }
}

/**
 * Objeto agregado com KPIs globais da plataforma
 */
export interface PlatformKPIs {
  // Revenue metrics
  mrr: number
  arr: number

  // Customer metrics
  totalOrganizations: number
  proOrganizations: number
  freeOrganizations: number

  // Growth metrics
  churnRate: number
  ltv: number
  cac: number

  // Calculated
  ltvCacRatio: number // LTV / CAC (ideal: > 3)

  // Period info
  month: number
  year: number
}

/**
 * Calcula todos os KPIs da plataforma para um mês específico
 */
export async function calculatePlatformKPIs(
  month: number,
  year: number
): Promise<PlatformKPIs> {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const [mrr, arr, totalOrgs, proOrgs, churnRate, cac] = await Promise.all([
    calculateMRR(),
    calculateARR(),
    prisma.organization.count(),
    prisma.organization.count({ 
      where: { 
        tier: { in: ['STARTER', 'PRO', 'BUSINESS'] },
        isTestAccount: false
      } 
    }),
    calculateChurnRate(startOfMonth, endOfMonth),
    calculateCAC(month, year),
  ])

  const freeOrgs = totalOrgs - proOrgs

  // Churn rate mensal como decimal (5% = 0.05)
  const monthlyChurnRateDecimal = churnRate / 100
  const ltv = await calculateLTV(monthlyChurnRateDecimal || 0.05)

  const ltvCacRatio = cac > 0 ? ltv / cac : 0

  return {
    mrr,
    arr,
    totalOrganizations: totalOrgs,
    proOrganizations: proOrgs,
    freeOrganizations: freeOrgs,
    churnRate,
    ltv,
    cac,
    ltvCacRatio,
    month,
    year,
  }
}
