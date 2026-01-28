/**
 * Revenue Simulator
 * Motor de ML/Estatística para projeção de metas e engenharia reversa do funil
 */

import { FunnelMetrics } from './funnel-service'

export interface RevenueGoalSimulation {
  targetRevenue: number
  targetCustomers: number
  requiredGrowth: {
    impressions: {
      current: number
      required: number
      growthRate: number // %
    }
    clicks: {
      current: number
      required: number
      growthRate: number
    }
    signups: {
      current: number
      required: number
      growthRate: number
    }
    activated: {
      current: number
      required: number
      growthRate: number
    }
  }
  feasibility: 'easy' | 'moderate' | 'hard' | 'unrealistic'
  primaryRecommendation: string
  alternativeStrategy: string
}

/**
 * Simula quanto tráfego é necessário para atingir uma meta de receita
 * Usa engenharia reversa com as taxas de conversão atuais
 */
export function simulateRevenueGoal(
  currentMetrics: FunnelMetrics,
  targetRevenue: number
): RevenueGoalSimulation {
  const { stages, unitEconomics } = currentMetrics

  // 1. Calcular quantos customers são necessários
  const targetCustomers = Math.ceil(targetRevenue / unitEconomics.averageTicket)

  // 2. Engenharia reversa usando as taxas de conversão atuais
  const currentCustomers = stages.customers.value
  const currentHitLimit = stages.hitLimit.value
  const currentActivated = stages.activated.value
  const currentSignups = stages.signups.value
  const currentClicks = stages.clicks.value
  const currentImpressions = stages.impressions.value

  // Taxas de conversão (usando || 1 para evitar divisão por zero)
  const customerRate = stages.customers.conversionRate || 1
  const hitLimitRate = stages.hitLimit.conversionRate || 1
  const activatedRate = stages.activated.conversionRate || 1
  const signupRate = stages.signups.conversionRate || 1
  const clickRate = stages.clicks.conversionRate || 1

  // Calcular necessidades em cada estágio (de baixo para cima)
  const requiredHitLimit = Math.ceil((targetCustomers / customerRate) * 100)
  const requiredActivated = Math.ceil((requiredHitLimit / hitLimitRate) * 100)
  const requiredSignups = Math.ceil((requiredActivated / activatedRate) * 100)
  const requiredClicks = Math.ceil((requiredSignups / signupRate) * 100)
  const requiredImpressions = Math.ceil((requiredClicks / clickRate) * 100)

  // Calcular % de crescimento necessário
  const impressionsGrowth =
    currentImpressions > 0
      ? ((requiredImpressions - currentImpressions) / currentImpressions) * 100
      : 0
  const clicksGrowth =
    currentClicks > 0
      ? ((requiredClicks - currentClicks) / currentClicks) * 100
      : 0
  const signupsGrowth =
    currentSignups > 0
      ? ((requiredSignups - currentSignups) / currentSignups) * 100
      : 0
  const activatedGrowth =
    currentActivated > 0
      ? ((requiredActivated - currentActivated) / currentActivated) * 100
      : 0

  // 3. Avaliar viabilidade
  let feasibility: 'easy' | 'moderate' | 'hard' | 'unrealistic'
  if (impressionsGrowth <= 50) {
    feasibility = 'easy'
  } else if (impressionsGrowth <= 150) {
    feasibility = 'moderate'
  } else if (impressionsGrowth <= 300) {
    feasibility = 'hard'
  } else {
    feasibility = 'unrealistic'
  }

  // 4. Gerar recomendações inteligentes
  const primaryRecommendation = generatePrimaryRecommendation(
    currentMetrics,
    impressionsGrowth
  )
  const alternativeStrategy = generateAlternativeStrategy(
    currentMetrics,
    targetRevenue
  )

  return {
    targetRevenue,
    targetCustomers,
    requiredGrowth: {
      impressions: {
        current: currentImpressions,
        required: requiredImpressions,
        growthRate: Math.round(impressionsGrowth),
      },
      clicks: {
        current: currentClicks,
        required: requiredClicks,
        growthRate: Math.round(clicksGrowth),
      },
      signups: {
        current: currentSignups,
        required: requiredSignups,
        growthRate: Math.round(signupsGrowth),
      },
      activated: {
        current: currentActivated,
        required: requiredActivated,
        growthRate: Math.round(activatedGrowth),
      },
    },
    feasibility,
    primaryRecommendation,
    alternativeStrategy,
  }
}

/**
 * Gera recomendação primária baseada no estado atual do funil
 */
function generatePrimaryRecommendation(
  metrics: FunnelMetrics,
  impressionsGrowth: number
): string {
  const { stages } = metrics

  // Identificar o gargalo (menor conversion rate)
  const conversionRates = {
    click: stages.clicks.conversionRate || 0,
    signup: stages.signups.conversionRate || 0,
    activation: stages.activated.conversionRate || 0,
    engagement: stages.hitLimit.conversionRate || 0,
    payment: stages.customers.conversionRate || 0,
  }

  const bottleneck = Object.entries(conversionRates).reduce((min, [key, rate]) =>
    rate < (conversionRates[min[0] as keyof typeof conversionRates] || Infinity)
      ? [key, rate]
      : min
  )

  const recommendations: Record<string, string> = {
    click: `CTR (${bottleneck[1].toFixed(2)}%) está abaixo do benchmark (3%). Atualize títulos das páginas /solucoes/ com ano "2026" e números.`,
    signup: `Conversão Clique→Cadastro (${bottleneck[1].toFixed(2)}%) precisa melhorar. Adicione CTA mais visível e reduza campos no formulário.`,
    activation: `Apenas ${bottleneck[1].toFixed(2)}% completam onboarding. Simplifique para 3 steps obrigatórios e adicione gamificação.`,
    engagement: `${bottleneck[1].toFixed(2)}% dos ativados ficam engajados. Implemente email drip campaign "Como criar seu 1º negócio".`,
    payment: `Conversão para pagante (${bottleneck[1].toFixed(2)}%) é crítica. Adicione trial de 14 dias e "Upgrade" CTA no dashboard.`,
  }

  const baseRec = recommendations[bottleneck[0]]

  if (impressionsGrowth > 200) {
    return `${baseRec} ATENÇÃO: Crescer ${impressionsGrowth.toFixed(0)}% em impressões demanda investimento em conteúdo (20+ artigos/mês).`
  }

  return baseRec
}

/**
 * Gera estratégia alternativa caso o crescimento orgânico seja inviável
 */
function generateAlternativeStrategy(
  metrics: FunnelMetrics,
  targetRevenue: number
): string {
  const { unitEconomics, stages } = metrics

  // Se o LTV é bom (> R$ 500), vale a pena considerar paid ads
  if (unitEconomics.estimatedLTV > 500) {
    const targetCustomers = Math.ceil(targetRevenue / unitEconomics.averageTicket)
    const maxCAC = unitEconomics.estimatedLTV * 0.33 // LTV / 3 (regra padrão)
    const paidBudget = targetCustomers * maxCAC

    return `Estratégia Paid: Com LTV de R$ ${unitEconomics.estimatedLTV}, você pode gastar até R$ ${maxCAC.toFixed(0)}/cliente. Orçamento total: R$ ${paidBudget.toFixed(0)} para Google Ads + Meta Ads.`
  }

  // Se a conversão signup→customer é boa (>10%), foque em aumentar tráfego
  const signupToCustomerRate =
    stages.signups.value > 0
      ? (stages.customers.value / stages.signups.value) * 100
      : 0

  if (signupToCustomerRate > 10) {
    return `Conversão Signup→Customer (${signupToCustomerRate.toFixed(1)}%) está ótima! Priorize: SEO programático (criar 50+ landing pages de nicho) + Backlinks (guest posts).`
  }

  // Fallback: melhorar produto
  return `Antes de escalar tráfego, melhore a retenção: implemente feature flags, onboarding interativo e suporte via WhatsApp. Converta melhor antes de crescer.`
}

/**
 * Calcula o ROI de otimizar uma etapa específica do funil
 */
export function calculateOptimizationROI(
  currentMetrics: FunnelMetrics,
  stage: 'click' | 'signup' | 'activation' | 'engagement' | 'payment',
  improvementPercent: number // Ex: 50 (para 50% de melhoria)
): {
  currentRevenue: number
  projectedRevenue: number
  additionalRevenue: number
  roi: number // % de retorno
} {
  const { stages, unitEconomics } = currentMetrics

  const currentRevenue = stages.customers.value * unitEconomics.averageTicket

  // Simular melhoria na conversão
  let projectedCustomers = stages.customers.value

  switch (stage) {
    case 'click': {
      const newClickRate = (stages.clicks.conversionRate || 0) * (1 + improvementPercent / 100)
      const newClicks = (stages.impressions.value * newClickRate) / 100
      const clickImpact = newClicks / stages.clicks.value
      projectedCustomers = stages.customers.value * clickImpact
      break
    }
    case 'signup': {
      const newSignupRate = (stages.signups.conversionRate || 0) * (1 + improvementPercent / 100)
      const newSignups = (stages.clicks.value * newSignupRate) / 100
      const signupImpact = newSignups / stages.signups.value
      projectedCustomers = stages.customers.value * signupImpact
      break
    }
    case 'activation': {
      const newActivationRate =
        (stages.activated.conversionRate || 0) * (1 + improvementPercent / 100)
      const newActivated = (stages.signups.value * newActivationRate) / 100
      const activationImpact = newActivated / stages.activated.value
      projectedCustomers = stages.customers.value * activationImpact
      break
    }
    case 'engagement': {
      const newEngagementRate =
        (stages.hitLimit.conversionRate || 0) * (1 + improvementPercent / 100)
      const newEngaged = (stages.activated.value * newEngagementRate) / 100
      const engagementImpact = newEngaged / stages.hitLimit.value
      projectedCustomers = stages.customers.value * engagementImpact
      break
    }
    case 'payment': {
      const newPaymentRate =
        (stages.customers.conversionRate || 0) * (1 + improvementPercent / 100)
      const newCustomers = (stages.hitLimit.value * newPaymentRate) / 100
      projectedCustomers = newCustomers
      break
    }
  }

  const projectedRevenue = projectedCustomers * unitEconomics.averageTicket
  const additionalRevenue = projectedRevenue - currentRevenue

  // ROI simplificado (assumindo custo de otimização de R$ 500)
  const optimizationCost = 500
  const roi = (additionalRevenue / optimizationCost) * 100

  return {
    currentRevenue: Math.round(currentRevenue),
    projectedRevenue: Math.round(projectedRevenue),
    additionalRevenue: Math.round(additionalRevenue),
    roi: Math.round(roi),
  }
}
