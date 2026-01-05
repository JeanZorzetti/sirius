import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Métodos de forecasting de receita
 */

/**
 * Calcula a previsão de receita usando média móvel simples
 * Usa os últimos N meses de RevenueSnapshots para prever os próximos períodos
 *
 * @param months - Número de meses históricos para calcular a média (default: 3)
 * @param forecastPeriods - Número de períodos futuros para prever (default: 3 para 30/60/90 dias)
 * @returns Array com previsões de receita
 */
export async function forecastRevenueSimpleMovingAverage(
  months: number = 3,
  forecastPeriods: number = 3
): Promise<number[]> {
  // Buscar últimos N meses de snapshots (global: organizationId = null)
  const recentSnapshots = await prisma.revenueSnapshot.findMany({
    where: {
      organizationId: null,
    },
    orderBy: {
      date: 'desc',
    },
    take: months,
    select: {
      mrr: true,
    },
  })

  if (recentSnapshots.length === 0) {
    // Se não há histórico, retorna array vazio
    return []
  }

  // Calcular média dos MRRs históricos
  const sum = recentSnapshots.reduce(
    (acc, snapshot) => acc + parseFloat(snapshot.mrr.toString()),
    0
  )
  const average = sum / recentSnapshots.length

  // Projetar a média para os próximos períodos
  // Simplificação: assume crescimento linear baseado na média
  const forecasts: number[] = []
  for (let i = 1; i <= forecastPeriods; i++) {
    forecasts.push(Math.round(average * 100) / 100)
  }

  return forecasts
}

/**
 * Calcula a previsão de receita usando crescimento linear
 * Analisa a tendência de crescimento dos últimos meses e projeta para o futuro
 *
 * @param months - Número de meses históricos para análise
 * @param forecastPeriods - Número de períodos futuros para prever
 * @returns Array com previsões de receita
 */
export async function forecastRevenueLinearGrowth(
  months: number = 6,
  forecastPeriods: number = 3
): Promise<number[]> {
  // Buscar últimos N meses de snapshots ordenados por data
  const snapshots = await prisma.revenueSnapshot.findMany({
    where: {
      organizationId: null,
    },
    orderBy: {
      date: 'asc',
    },
    take: months,
    select: {
      mrr: true,
      date: true,
    },
  })

  if (snapshots.length < 2) {
    // Não há dados suficientes para calcular tendência
    return []
  }

  // Calcular taxa de crescimento médio (growth rate)
  const growthRates: number[] = []
  for (let i = 1; i < snapshots.length; i++) {
    const previousMrr = parseFloat(snapshots[i - 1].mrr.toString())
    const currentMrr = parseFloat(snapshots[i].mrr.toString())

    if (previousMrr > 0) {
      const growthRate = (currentMrr - previousMrr) / previousMrr
      growthRates.push(growthRate)
    }
  }

  if (growthRates.length === 0) {
    return []
  }

  // Média da taxa de crescimento
  const avgGrowthRate =
    growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length

  // MRR mais recente como ponto de partida
  const latestMrr = parseFloat(snapshots[snapshots.length - 1].mrr.toString())

  // Projetar com crescimento composto
  const forecasts: number[] = []
  let projectedMrr = latestMrr

  for (let i = 1; i <= forecastPeriods; i++) {
    projectedMrr = projectedMrr * (1 + avgGrowthRate)
    forecasts.push(Math.round(projectedMrr * 100) / 100)
  }

  return forecasts
}

/**
 * Calcula a previsão usando média móvel ponderada exponencial (EMA)
 * Dá mais peso aos meses mais recentes
 *
 * @param alpha - Fator de suavização (0-1). Valores maiores dão mais peso aos dados recentes
 * @param forecastPeriods - Número de períodos futuros para prever
 * @returns Array com previsões de receita
 */
export async function forecastRevenueExponentialMovingAverage(
  alpha: number = 0.3,
  forecastPeriods: number = 3
): Promise<number[]> {
  // Buscar todos os snapshots históricos
  const snapshots = await prisma.revenueSnapshot.findMany({
    where: {
      organizationId: null,
    },
    orderBy: {
      date: 'asc',
    },
    select: {
      mrr: true,
    },
  })

  if (snapshots.length === 0) {
    return []
  }

  // Calcular EMA
  let ema = parseFloat(snapshots[0].mrr.toString())

  for (let i = 1; i < snapshots.length; i++) {
    const currentMrr = parseFloat(snapshots[i].mrr.toString())
    ema = alpha * currentMrr + (1 - alpha) * ema
  }

  // Projetar EMA para os próximos períodos
  // Simplificação: assume que a EMA se mantém constante
  const forecasts: number[] = []
  for (let i = 0; i < forecastPeriods; i++) {
    forecasts.push(Math.round(ema * 100) / 100)
  }

  return forecasts
}

/**
 * Calcula previsão baseada em taxa de conversão Free → Pro
 * Analisa quantas organizações Free existem e projeta conversões futuras
 *
 * @param conversionRate - Taxa de conversão histórica Free → Pro (0-1)
 * @param forecastPeriods - Número de meses para prever
 * @returns Array com previsões de MRR incremental
 */
export async function forecastRevenueByConversion(
  conversionRate: number = 0.05, // 5% ao mês
  forecastPeriods: number = 3,
  proPlanPrice: number = 97
): Promise<number[]> {
  const freeOrganizations = await prisma.organization.count({
    where: { plan: 'FREE' },
  })

  const currentProOrgs = await prisma.organization.count({
    where: { plan: 'PRO' },
  })

  let currentMrr = currentProOrgs * proPlanPrice
  const forecasts: number[] = []

  let remainingFree = freeOrganizations

  for (let i = 0; i < forecastPeriods; i++) {
    // Novos upgrades
    const newProOrgs = Math.floor(remainingFree * conversionRate)
    currentMrr += newProOrgs * proPlanPrice
    remainingFree -= newProOrgs

    // Assumir que novas organizações Free entram (para manter pool)
    // Estimativa: 10% de crescimento em novas signups Free
    const newFreeOrgs = Math.floor(freeOrganizations * 0.1)
    remainingFree += newFreeOrgs

    forecasts.push(Math.round(currentMrr * 100) / 100)
  }

  return forecasts
}

/**
 * Calcula previsão híbrida combinando múltiplos métodos
 * Usa weighted average de diferentes técnicas de forecasting
 *
 * @param forecastPeriods - Número de períodos para prever
 * @returns Array com previsões de receita
 */
export async function forecastRevenueHybrid(
  forecastPeriods: number = 3
): Promise<number[]> {
  const [smaForecasts, linearForecasts, emaForecasts, conversionForecasts] =
    await Promise.all([
      forecastRevenueSimpleMovingAverage(3, forecastPeriods),
      forecastRevenueLinearGrowth(6, forecastPeriods),
      forecastRevenueExponentialMovingAverage(0.3, forecastPeriods),
      forecastRevenueByConversion(0.05, forecastPeriods),
    ])

  // Se algum método não retornou resultados, usar apenas os que retornaram
  const validForecasts = [
    smaForecasts,
    linearForecasts,
    emaForecasts,
    conversionForecasts,
  ].filter((f) => f.length > 0)

  if (validForecasts.length === 0) {
    return []
  }

  // Calcular weighted average (pesos diferentes para cada método)
  const weights = {
    sma: 0.2,
    linear: 0.3,
    ema: 0.25,
    conversion: 0.25,
  }

  const forecasts: number[] = []

  for (let period = 0; period < forecastPeriods; period++) {
    let weightedSum = 0
    let totalWeight = 0

    if (smaForecasts.length > period) {
      weightedSum += smaForecasts[period] * weights.sma
      totalWeight += weights.sma
    }
    if (linearForecasts.length > period) {
      weightedSum += linearForecasts[period] * weights.linear
      totalWeight += weights.linear
    }
    if (emaForecasts.length > period) {
      weightedSum += emaForecasts[period] * weights.ema
      totalWeight += weights.ema
    }
    if (conversionForecasts.length > period) {
      weightedSum += conversionForecasts[period] * weights.conversion
      totalWeight += weights.conversion
    }

    const forecast = totalWeight > 0 ? weightedSum / totalWeight : 0
    forecasts.push(Math.round(forecast * 100) / 100)
  }

  return forecasts
}

/**
 * Calcula forecasts de 30, 60 e 90 dias usando método híbrido
 * Retorna objeto estruturado para armazenar no RevenueSnapshot
 */
export async function calculateRevenueForecasts(): Promise<{
  forecastNext30d: number
  forecastNext60d: number
  forecastNext90d: number
}> {
  const forecasts = await forecastRevenueHybrid(3)

  return {
    forecastNext30d: forecasts[0] || 0,
    forecastNext60d: forecasts[1] || 0,
    forecastNext90d: forecasts[2] || 0,
  }
}

/**
 * Calcula previsão de Churn baseado em tendência histórica
 *
 * @param months - Número de meses históricos para análise
 * @returns Taxa de churn prevista (0-100)
 */
export async function forecastChurnRate(months: number = 3): Promise<number> {
  const snapshots = await prisma.revenueSnapshot.findMany({
    where: {
      organizationId: null,
    },
    orderBy: {
      date: 'desc',
    },
    take: months,
    select: {
      churnedOrganizations: true,
      totalOrganizations: true,
    },
  })

  if (snapshots.length === 0) {
    return 0
  }

  // Calcular taxa de churn de cada mês
  const churnRates = snapshots
    .map((snapshot) => {
      if (snapshot.totalOrganizations === 0) return 0
      return (snapshot.churnedOrganizations / snapshot.totalOrganizations) * 100
    })
    .filter((rate) => rate > 0)

  if (churnRates.length === 0) {
    return 0
  }

  // Média das taxas de churn
  const avgChurnRate =
    churnRates.reduce((sum, rate) => sum + rate, 0) / churnRates.length

  return Math.round(avgChurnRate * 100) / 100
}

/**
 * Calcula previsão de crescimento de usuários (new signups)
 * Baseado em tendência de novas organizações
 *
 * @param months - Meses históricos para análise
 * @param forecastPeriods - Períodos futuros
 * @returns Array com número previsto de novas organizações por período
 */
export async function forecastNewOrganizations(
  months: number = 3,
  forecastPeriods: number = 3
): Promise<number[]> {
  const snapshots = await prisma.revenueSnapshot.findMany({
    where: {
      organizationId: null,
    },
    orderBy: {
      date: 'asc',
    },
    take: months,
    select: {
      newOrganizations: true,
    },
  })

  if (snapshots.length === 0) {
    return []
  }

  // Média de novas organizações por mês
  const avgNewOrgs =
    snapshots.reduce((sum, s) => sum + s.newOrganizations, 0) / snapshots.length

  // Projetar média para próximos períodos
  // Simplificação: assume que a taxa de crescimento se mantém
  const forecasts: number[] = []
  for (let i = 0; i < forecastPeriods; i++) {
    forecasts.push(Math.round(avgNewOrgs))
  }

  return forecasts
}
