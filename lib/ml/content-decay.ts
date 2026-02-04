// ============================================================================
// CONTENT DECAY PREDICTION ENGINE (TypeScript nativo)
// Sprint 4 - Content Decay Detection
//
// Analisa páginas do GSC e calcula:
// - Probabilidade de decay (0-100%)
// - Dias até decay estimado
// - Fatores de decay (freshness, competition, performance)
// - Data recomendada de refresh
// - Impacto estimado se não atualizar
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface ContentDecayPrediction {
  url: string
  currentPosition: number
  currentClicks: number
  currentImpressions: number
  decayProbability: number // 0-100%
  daysUntilDecay: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  factors: DecayFactor[]
  recommendedRefreshDate: string
  estimatedTrafficLossIfNotRefreshed: number
  estimatedRevenueLossIfNotRefreshed: number
  positionTrend: 'improving' | 'stable' | 'declining'
  trafficTrend: 'growing' | 'stable' | 'declining'
}

export interface DecayFactor {
  factor: 'freshness' | 'performance_decline' | 'competition' | 'seasonality' | 'ctr_drop'
  impact: number // -100 to +100 (negative = contributes to decay)
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
}

export interface ContentDecayResponse {
  predictions: ContentDecayPrediction[]
  summary: DecaySummary
  processedAt: string
}

export interface DecaySummary {
  totalPagesAnalyzed: number
  criticalPages: number
  highRiskPages: number
  mediumRiskPages: number
  lowRiskPages: number
  totalEstimatedTrafficLoss: number
  totalEstimatedRevenueLoss: number
  averageDecayProbability: number
}

interface PageInput {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface TimeSeriesPoint {
  date: string
  clicks: number
  impressions: number
  position: number
  ctr: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Freshness thresholds (days since last update - simulated by position stability)
const FRESHNESS_THRESHOLDS = {
  STALE: 180, // 6 months
  AGING: 90, // 3 months
  RECENT: 30, // 1 month
}

// Performance decline thresholds (% change)
const PERFORMANCE_THRESHOLDS = {
  CRITICAL_DECLINE: -30,
  HIGH_DECLINE: -20,
  MEDIUM_DECLINE: -10,
}

// Click value (average per click in BRL for revenue impact)
const CLICK_VALUE_BRL = 15

// ============================================================================
// CORE ALGORITHM
// ============================================================================

/**
 * Calcula tendência de uma série temporal (slope da regressão linear simples)
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0

  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = values

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

  return slope
}

/**
 * Calcula % de mudança entre dois valores
 */
function percentageChange(from: number, to: number): number {
  if (from === 0) return 0
  return ((to - from) / from) * 100
}

/**
 * Calcula média de um array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Detecta se série temporal é sazonal (simplificado)
 */
function detectSeasonality(values: number[]): boolean {
  if (values.length < 12) return false

  // Calcula variância
  const avg = mean(values)
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length

  // Se variância muito alta, provável sazonalidade
  return variance > avg * 0.5
}

/**
 * Calcula probabilidade de decay baseado em múltiplos fatores
 */
function calculateDecayProbability(
  page: PageInput,
  positionTrend: number,
  trafficTrend: number,
  ctrTrend: number,
  currentPosition: number
): number {
  let probability = 0

  // Factor 1: Performance decline (mais importante - 40% do peso)
  if (positionTrend > 1) {
    // Posição caindo (número aumentando)
    probability += 25
    if (positionTrend > 2) probability += 15 // Caindo rápido
  }

  if (trafficTrend < -10) {
    // Tráfego caindo 10%+
    probability += 20
    if (trafficTrend < -20) probability += 10 // Caindo muito
  }

  // Factor 2: CTR decline (20% do peso)
  if (ctrTrend < -5) {
    probability += 10
    if (ctrTrend < -15) probability += 10
  }

  // Factor 3: Current position vulnerability (20% do peso)
  // Páginas em posições 5-10 são mais vulneráveis
  if (currentPosition >= 5 && currentPosition <= 10) {
    probability += 15
  } else if (currentPosition > 10 && currentPosition <= 20) {
    probability += 10
  }

  // Factor 4: Simular "freshness" baseado em estabilidade de posição
  // Se posição muito estável (não muda), pode estar "estagnada"
  const positionStability = Math.abs(positionTrend)
  if (positionStability < 0.1 && currentPosition > 3) {
    // Muito estável mas não em posição top
    probability += 10
  }

  return Math.min(100, Math.max(0, probability))
}

/**
 * Calcula dias até decay estimado
 */
function estimateDaysUntilDecay(
  decayProbability: number,
  positionTrend: number,
  trafficTrend: number
): number {
  // Base: 90 dias
  let days = 90

  // Ajustar por probabilidade
  if (decayProbability > 80) days = 15
  else if (decayProbability > 60) days = 30
  else if (decayProbability > 40) days = 60
  else if (decayProbability > 20) days = 90
  else days = 180

  // Ajustar por velocidade de mudança
  const velocityFactor = Math.abs(positionTrend) + Math.abs(trafficTrend) / 10
  if (velocityFactor > 3) days = Math.round(days * 0.5) // Acelerando decay
  else if (velocityFactor < 0.5) days = Math.round(days * 1.5) // Decay lento

  return Math.max(7, days) // Mínimo 7 dias
}

/**
 * Identifica fatores de decay
 */
function identifyDecayFactors(
  positionTrend: number,
  trafficTrend: number,
  ctrTrend: number,
  currentPosition: number,
  decayProbability: number
): DecayFactor[] {
  const factors: DecayFactor[] = []

  // Factor: Performance decline
  if (positionTrend > 1 || trafficTrend < -10) {
    const impactScore = Math.round(positionTrend * -10 + trafficTrend)
    factors.push({
      factor: 'performance_decline',
      impact: impactScore,
      severity:
        impactScore < -30 ? 'critical' : impactScore < -15 ? 'high' : impactScore < -5 ? 'medium' : 'low',
      description:
        positionTrend > 2
          ? `Posição caindo rapidamente (${positionTrend.toFixed(1)} pos/mês)`
          : trafficTrend < -20
            ? `Tráfego caindo significativamente (${trafficTrend.toFixed(0)}%)`
            : `Performance em declínio`,
    })
  }

  // Factor: CTR drop
  if (ctrTrend < -5) {
    factors.push({
      factor: 'ctr_drop',
      impact: Math.round(ctrTrend * 2),
      severity: ctrTrend < -15 ? 'high' : ctrTrend < -10 ? 'medium' : 'low',
      description: `CTR caindo (${ctrTrend.toFixed(1)}%) - possível competição em snippets ou perda de relevância`,
    })
  }

  // Factor: Freshness (simulado)
  if (currentPosition > 3 && Math.abs(positionTrend) < 0.1) {
    factors.push({
      factor: 'freshness',
      impact: -15,
      severity: 'medium',
      description: 'Conteúdo estagnado - sem mudanças de posição recentes, pode estar desatualizado',
    })
  }

  // Factor: Competition (inferido de posição vulnerável)
  if (currentPosition >= 5 && currentPosition <= 10 && decayProbability > 40) {
    factors.push({
      factor: 'competition',
      impact: -20,
      severity: 'high',
      description: 'Posição vulnerável (5-10) - alta probabilidade de competidores ultrapassarem',
    })
  }

  // Se nenhum fator, adicionar "Seasonality" como placeholder
  if (factors.length === 0 && decayProbability > 10) {
    factors.push({
      factor: 'seasonality',
      impact: -10,
      severity: 'low',
      description: 'Possível variação sazonal ou algoritmo',
    })
  }

  return factors.sort((a, b) => a.impact - b.impact) // Mais negativos primeiro
}

/**
 * Calcula urgência baseada em probabilidade e dias até decay
 */
function calculateUrgency(decayProbability: number, daysUntilDecay: number): 'critical' | 'high' | 'medium' | 'low' {
  if (decayProbability > 70 && daysUntilDecay < 30) return 'critical'
  if (decayProbability > 50 && daysUntilDecay < 60) return 'high'
  if (decayProbability > 30 && daysUntilDecay < 90) return 'medium'
  return 'low'
}

/**
 * Estima perda de tráfego se não atualizar
 */
function estimateTrafficLoss(
  currentClicks: number,
  currentPosition: number,
  decayProbability: number,
  positionTrend: number
): number {
  // Estimar posição futura se não atualizar
  const estimatedPositionDrop = Math.max(1, Math.round(positionTrend * 3)) // 3 meses
  const futurePosition = currentPosition + estimatedPositionDrop

  // CTR por posição (simplificado)
  const getCTR = (pos: number): number => {
    if (pos <= 1) return 0.396
    if (pos === 2) return 0.185
    if (pos === 3) return 0.11
    if (pos <= 5) return 0.07
    if (pos <= 10) return 0.04
    if (pos <= 20) return 0.015
    return 0.005
  }

  const currentCTR = getCTR(currentPosition)
  const futureCTR = getCTR(futurePosition)
  const ctrDrop = currentCTR - futureCTR

  // Perda de cliques ajustada por probabilidade
  const estimatedLoss = (currentClicks * (ctrDrop / currentCTR) * decayProbability) / 100

  return Math.round(estimatedLoss)
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Prediz decay de conteúdo para todas as páginas
 */
export function predictContentDecay(
  pages: PageInput[],
  history?: TimeSeriesPoint[]
): ContentDecayResponse {
  const predictions: ContentDecayPrediction[] = []

  // Calcular trends baseado em histórico (se disponível)
  const trendsMap = new Map<string, { positionTrend: number; trafficTrend: number; ctrTrend: number }>()

  if (history && history.length >= 7) {
    // Agrupar por página (não disponível em history atual do GSC, então usar agregado)
    // Por enquanto, usar trends globais para todas as páginas
    const recentPoints = history.slice(-14) // Últimos 14 dias
    const olderPoints = history.slice(-28, -14) // 14 dias anteriores

    const recentAvgPosition = mean(recentPoints.map(p => p.position))
    const olderAvgPosition = mean(olderPoints.map(p => p.position))
    const recentAvgClicks = mean(recentPoints.map(p => p.clicks))
    const olderAvgClicks = mean(olderPoints.map(p => p.clicks))
    const recentAvgCTR = mean(recentPoints.map(p => p.ctr))
    const olderAvgCTR = mean(olderPoints.map(p => p.ctr))

    const globalPositionTrend = recentAvgPosition - olderAvgPosition
    const globalTrafficTrend = percentageChange(olderAvgClicks, recentAvgClicks)
    const globalCTRTrend = percentageChange(olderAvgCTR, recentAvgCTR)

    // Aplicar para todas páginas (aproximação)
    pages.forEach(page => {
      trendsMap.set(page.page, {
        positionTrend: globalPositionTrend,
        trafficTrend: globalTrafficTrend,
        ctrTrend: globalCTRTrend,
      })
    })
  }

  // Processar cada página
  for (const page of pages) {
    // Pular páginas com dados insuficientes
    if (page.clicks < 10 || page.impressions < 100) continue

    // Pular páginas já em posições muito ruins (>50)
    if (page.position > 50) continue

    // Get trends (ou usar padrão)
    const trends = trendsMap.get(page.page) || {
      positionTrend: 0,
      trafficTrend: 0,
      ctrTrend: 0,
    }

    // Calcular decay
    const decayProbability = calculateDecayProbability(
      page,
      trends.positionTrend,
      trends.trafficTrend,
      trends.ctrTrend,
      page.position
    )

    // Pular páginas com baixa probabilidade de decay (<10%)
    if (decayProbability < 10) continue

    const daysUntilDecay = estimateDaysUntilDecay(decayProbability, trends.positionTrend, trends.trafficTrend)

    const factors = identifyDecayFactors(
      trends.positionTrend,
      trends.trafficTrend,
      trends.ctrTrend,
      page.position,
      decayProbability
    )

    const urgency = calculateUrgency(decayProbability, daysUntilDecay)

    const estimatedTrafficLoss = estimateTrafficLoss(
      page.clicks,
      page.position,
      decayProbability,
      trends.positionTrend
    )

    const estimatedRevenueLoss = Math.round(estimatedTrafficLoss * CLICK_VALUE_BRL)

    // Recommended refresh date: 70% do tempo até decay
    const refreshDate = new Date()
    refreshDate.setDate(refreshDate.getDate() + Math.round(daysUntilDecay * 0.7))

    // Determine trends
    const positionTrendLabel: 'improving' | 'stable' | 'declining' =
      trends.positionTrend < -0.5 ? 'improving' : trends.positionTrend > 0.5 ? 'declining' : 'stable'

    const trafficTrendLabel: 'growing' | 'stable' | 'declining' =
      trends.trafficTrend > 5 ? 'growing' : trends.trafficTrend < -5 ? 'declining' : 'stable'

    predictions.push({
      url: page.page,
      currentPosition: Math.round(page.position),
      currentClicks: page.clicks,
      currentImpressions: page.impressions,
      decayProbability: Math.round(decayProbability),
      daysUntilDecay,
      urgency,
      factors,
      recommendedRefreshDate: refreshDate.toISOString(),
      estimatedTrafficLossIfNotRefreshed: estimatedTrafficLoss,
      estimatedRevenueLossIfNotRefreshed: estimatedRevenueLoss,
      positionTrend: positionTrendLabel,
      trafficTrend: trafficTrendLabel,
    })
  }

  // Sort by urgency and decay probability
  predictions.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    }
    return b.decayProbability - a.decayProbability
  })

  // Generate summary
  const summary: DecaySummary = {
    totalPagesAnalyzed: pages.length,
    criticalPages: predictions.filter(p => p.urgency === 'critical').length,
    highRiskPages: predictions.filter(p => p.urgency === 'high').length,
    mediumRiskPages: predictions.filter(p => p.urgency === 'medium').length,
    lowRiskPages: predictions.filter(p => p.urgency === 'low').length,
    totalEstimatedTrafficLoss: predictions.reduce((sum, p) => sum + p.estimatedTrafficLossIfNotRefreshed, 0),
    totalEstimatedRevenueLoss: predictions.reduce((sum, p) => sum + p.estimatedRevenueLossIfNotRefreshed, 0),
    averageDecayProbability:
      predictions.length > 0
        ? Math.round(predictions.reduce((sum, p) => sum + p.decayProbability, 0) / predictions.length)
        : 0,
  }

  return {
    predictions,
    summary,
    processedAt: new Date().toISOString(),
  }
}
