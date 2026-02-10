/**
 * Period Comparison with ML - Statistical Analysis Library
 * 
 * Best practices based on research:
 * - 7 days: Short-term analysis, anomaly detection
 * - 28 days: Monthly standard (4 complete weeks)
 * - 90 days: Quarterly trends, forecasting
 * - Match day-of-week for fair comparisons
 * - Use p < 0.05 (95% confidence) as significance threshold
 */

import { mean, standardDeviation, zScore } from 'simple-statistics'

export type PeriodRange = '7d' | '14d' | '28d' | '90d'

export interface PeriodConfig {
  value: PeriodRange
  label: string
  days: number
  description: string
  priority: 'high' | 'medium' | 'low'
}

export const PERIOD_CONFIGS: PeriodConfig[] = [
  {
    value: '7d',
    label: '7 dias',
    days: 7,
    description: 'Análise semanal - ideal para detecção rápida',
    priority: 'high',
  },
  {
    value: '28d',
    label: '28 dias',
    days: 28,
    description: '1 mês completo (4 semanas) - padrão GSC',
    priority: 'high',
  },
  {
    value: '90d',
    label: '90 dias',
    days: 90,
    description: 'Trimestre - análise de tendências',
    priority: 'medium',
  },
  {
    value: '14d',
    label: '14 dias',
    days: 14,
    description: '2 semanas - campanhas curtas',
    priority: 'medium',
  },
]

export interface ComparisonPeriods {
  base: {
    start: Date
    end: Date
    label: string
  }
  comparison: {
    start: Date
    end: Date
    label: string
  }
}

export interface StatisticalResult {
  baseMean: number
  comparisonMean: number
  delta: number
  deltaPercent: number
  pValue: number
  isSignificant: boolean
  confidenceLevel: number
  effectSize: number
  effectSizeLabel: 'negligible' | 'small' | 'medium' | 'large'
}

export interface AnomalyPoint {
  date: Date
  value: number
  expectedValue: number
  deviation: number
  zScore: number
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface ForecastPoint {
  date: Date
  predicted: number
  lowerBound: number
  upperBound: number
  confidence: number
}

export interface PeriodComparisonResult {
  periods: ComparisonPeriods
  metrics: {
    clicks: StatisticalResult
    impressions: StatisticalResult
    ctr: StatisticalResult
    position: StatisticalResult
  }
  anomalies: {
    base: AnomalyPoint[]
    comparison: AnomalyPoint[]
  }
  forecast: ForecastPoint[]
  insights: string[]
  recommendation: string
}

/**
 * Calculate date ranges for period comparison
 */
export function calculatePeriodRanges(
  endDate: Date,
  range: PeriodRange,
  matchDayOfWeek: boolean = true
): ComparisonPeriods {
  const config = PERIOD_CONFIGS.find(p => p.value === range) || PERIOD_CONFIGS[0]
  const days = config.days

  // Base period ends at endDate
  const baseEnd = new Date(endDate)
  const baseStart = new Date(endDate)
  baseStart.setDate(baseStart.getDate() - days + 1)

  // Comparison period ends right before base period starts
  const comparisonEnd = new Date(baseStart)
  comparisonEnd.setDate(comparisonEnd.getDate() - 1)
  const comparisonStart = new Date(comparisonEnd)
  comparisonStart.setDate(comparisonStart.getDate() - days + 1)

  // If matching day-of-week, adjust comparison period
  if (matchDayOfWeek) {
    const baseStartDay = baseStart.getDay()
    const comparisonStartDay = comparisonStart.getDay()
    const dayDiff = baseStartDay - comparisonStartDay
    comparisonStart.setDate(comparisonStart.getDate() + dayDiff)
    comparisonEnd.setDate(comparisonEnd.getDate() + dayDiff)
  }

  return {
    base: {
      start: baseStart,
      end: baseEnd,
      label: `${formatDate(baseStart)} - ${formatDate(baseEnd)}`,
    },
    comparison: {
      start: comparisonStart,
      end: comparisonEnd,
      label: `${formatDate(comparisonStart)} - ${formatDate(comparisonEnd)}`,
    },
  }
}

/**
 * Perform two-sample t-test for period comparison
 */
export function performTTest(
  baseValues: number[],
  comparisonValues: number[]
): StatisticalResult {
  const baseMean = mean(baseValues)
  const comparisonMean = mean(comparisonValues)
  const delta = baseMean - comparisonMean
  const deltaPercent = comparisonMean !== 0 ? (delta / comparisonMean) * 100 : 0

  // Calculate standard deviations
  const baseStd = standardDeviation(baseValues) || 0
  const comparisonStd = standardDeviation(comparisonValues) || 0

  // Calculate pooled standard error
  const n1 = baseValues.length
  const n2 = comparisonValues.length
  const pooledSE = Math.sqrt((baseStd ** 2) / n1 + (comparisonStd ** 2) / n2)

  // Calculate t-statistic
  const tStat = pooledSE !== 0 ? delta / pooledSE : 0

  // Approximate p-value using normal distribution (for larger samples)
  // For small samples, this is a simplification
  const pValue = approximatePValue(Math.abs(tStat))

  // Determine significance (p < 0.05 is standard for 95% confidence)
  const isSignificant = pValue < 0.05
  const confidenceLevel = (1 - pValue) * 100

  // Calculate effect size (Cohen's d approximation)
  const pooledStd = Math.sqrt(((n1 - 1) * baseStd ** 2 + (n2 - 1) * comparisonStd ** 2) / (n1 + n2 - 2)) || 1
  const effectSize = pooledStd !== 0 ? delta / pooledStd : 0
  const effectSizeLabel = getEffectSizeLabel(Math.abs(effectSize))

  return {
    baseMean,
    comparisonMean,
    delta,
    deltaPercent,
    pValue,
    isSignificant,
    confidenceLevel,
    effectSize,
    effectSizeLabel,
  }
}

/**
 * Detect anomalies using Z-score method
 */
export function detectAnomalies(
  dates: Date[],
  values: number[],
  threshold: number = 2.5
): AnomalyPoint[] {
  if (values.length < 7) return []

  const meanValue = mean(values)
  const stdValue = standardDeviation(values) || 1

  const anomalies: AnomalyPoint[] = []

  values.forEach((value, index) => {
    const z = (value - meanValue) / stdValue
    const isAnomaly = Math.abs(z) > threshold

    if (isAnomaly) {
      const deviation = value - meanValue
      const severity = Math.abs(z) > 3 ? 'high' : Math.abs(z) > 2.5 ? 'medium' : 'low'
      const direction = z > 0 ? 'acima' : 'abaixo'

      anomalies.push({
        date: dates[index],
        value,
        expectedValue: meanValue,
        deviation,
        zScore: z,
        severity,
        description: `Valor ${Math.abs(deviation).toFixed(0)} ${direction} da média (${Math.abs(z).toFixed(1)}σ)`,
      })
    }
  })

  return anomalies
}

/**
 * Generate simple forecast using linear regression
 */
export function generateForecast(
  dates: Date[],
  values: number[],
  daysAhead: number = 7
): ForecastPoint[] {
  if (values.length < 2) return []

  // Simple linear regression
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = mean(values)

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean)
    denominator += (i - xMean) ** 2
  }

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = yMean - slope * xMean

  // Calculate standard error
  const residuals = values.map((v, i) => v - (slope * i + intercept))
  const residualStd = standardDeviation(residuals) || 0

  // Generate forecast
  const forecast: ForecastPoint[] = []
  const lastDate = dates[dates.length - 1]

  for (let i = 1; i <= daysAhead; i++) {
    const predicted = slope * (n - 1 + i) + intercept
    const margin = 1.96 * residualStd * Math.sqrt(1 + 1 / n + i / n) // 95% CI

    const forecastDate = new Date(lastDate)
    forecastDate.setDate(forecastDate.getDate() + i)

    forecast.push({
      date: forecastDate,
      predicted: Math.max(0, predicted),
      lowerBound: Math.max(0, predicted - margin),
      upperBound: Math.max(0, predicted + margin),
      confidence: Math.max(0, 95 - i * 2), // Confidence decreases with distance
    })
  }

  return forecast
}

/**
 * Generate insights based on comparison results
 */
export function generateInsights(
  result: PeriodComparisonResult
): string[] {
  const insights: string[] = []

  // Traffic trend insight
  const clicksResult = result.metrics.clicks
  if (clicksResult.isSignificant) {
    const direction = clicksResult.delta > 0 ? 'aumento' : 'queda'
    insights.push(
      `📊 Trafego organico com ${direction} significativo de ${Math.abs(clicksResult.deltaPercent).toFixed(1)}% (p=${clicksResult.pValue.toFixed(3)})`
    )
  } else {
    insights.push(
      `📊 Trafego organico estavel: variacao de ${Math.abs(clicksResult.deltaPercent).toFixed(1)}% nao e estatisticamente significativa`
    )
  }

  // Visibility insight
  const impressionsResult = result.metrics.impressions
  if (impressionsResult.isSignificant && impressionsResult.delta < 0) {
    insights.push(
      `👁️ Visibilidade caindo ${Math.abs(impressionsResult.deltaPercent).toFixed(1)}% - monitorar posicoes de keywords`
    )
  } else if (impressionsResult.isSignificant && impressionsResult.delta > 0) {
    insights.push(
      `👁️ Visibilidade aumentando ${impressionsResult.deltaPercent.toFixed(1)}% - boa oportunidade de crescimento`
    )
  }

  // CTR insight
  const ctrResult = result.metrics.ctr
  if (ctrResult.isSignificant) {
    const direction = ctrResult.delta > 0 ? 'melhorou' : 'piorou'
    insights.push(
      `🎯 CTR ${direction} ${Math.abs(ctrResult.deltaPercent).toFixed(1)}% - snippets estao ${direction === 'melhorou' ? 'mais atrativos' : 'menos atrativos'}`
    )
  }

  // Anomalies
  const totalAnomalies = result.anomalies.base.length + result.anomalies.comparison.length
  if (totalAnomalies > 0) {
    insights.push(
      `⚠️ ${totalAnomalies} anomalia(s) detectada(s) nos periodos analisados`
    )
  }

  return insights
}

/**
 * Generate recommendation based on analysis
 */
export function generateRecommendation(result: PeriodComparisonResult): string {
  const clicks = result.metrics.clicks
  const impressions = result.metrics.impressions
  const ctr = result.metrics.ctr

  // Dangerous divergence: clicks up but impressions down
  if (clicks.delta > 0 && impressions.delta < -10) {
    return '⚠️ Alerta: Trafego crescendo mas visibilidade caindo. O CTR esta compensando, mas isso e insustentavel. Priorizar acoes de SEO para recuperar impressions.'
  }

  // Both declining
  if (clicks.delta < -5 && impressions.delta < -5) {
    return '🚨 Ambas as metricas em queda. Recomendado: (1) Auditar technical SEO, (2) Verificar penalizacoes, (3) Analisar concorrencia.'
  }

  // Good growth
  if (clicks.isSignificant && clicks.delta > 5 && impressions.delta > 5) {
    return '✅ Crescimento sustentavel. Recomendado: (1) Acelerar producao de conteudo, (2) Expandir para keywords relacionadas, (3) Monitorar posicoes.'
  }

  // CTR improving
  if (ctr.isSignificant && ctr.delta > 10) {
    return '🎯 CTR em alta. Os snippets estao mais atrativos. Recomendado: (1) Aplicar mesma estrategia de meta tags em outras paginas, (2) Testar rich snippets.'
  }

  // Stable
  return '➡️ Performance estavel. Recomendado: (1) Focar em oportunidades de keywords, (2) Melhorar conteudo existente, (3) Buscar backlinks.'
}

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function approximatePValue(tStat: number): number {
  // Simplified approximation of p-value from t-statistic
  // Using normal approximation for larger samples
  if (tStat < 1) return 0.317
  if (tStat < 1.645) return 0.1
  if (tStat < 1.96) return 0.05
  if (tStat < 2.576) return 0.01
  if (tStat < 3.291) return 0.001
  return 0.0001
}

function getEffectSizeLabel(d: number): 'negligible' | 'small' | 'medium' | 'large' {
  if (d < 0.2) return 'negligible'
  if (d < 0.5) return 'small'
  if (d < 0.8) return 'medium'
  return 'large'
}

/**
 * Compare two periods with full ML analysis
 */
export function comparePeriods(
  baseData: { date: Date; clicks: number; impressions: number; position: number }[],
  comparisonData: { date: Date; clicks: number; impressions: number; position: number }[],
  periods: ComparisonPeriods
): PeriodComparisonResult {
  // Calculate CTR for each data point
  const baseWithCTR = baseData.map(d => ({
    ...d,
    ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
  }))

  const comparisonWithCTR = comparisonData.map(d => ({
    ...d,
    ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
  }))

  // Statistical tests for each metric
  const metrics = {
    clicks: performTTest(
      baseWithCTR.map(d => d.clicks),
      comparisonWithCTR.map(d => d.clicks)
    ),
    impressions: performTTest(
      baseWithCTR.map(d => d.impressions),
      comparisonWithCTR.map(d => d.impressions)
    ),
    ctr: performTTest(
      baseWithCTR.map(d => d.ctr),
      comparisonWithCTR.map(d => d.ctr)
    ),
    position: performTTest(
      baseWithCTR.map(d => d.position),
      comparisonWithCTR.map(d => d.position)
    ),
  }

  // Detect anomalies
  const anomalies = {
    base: detectAnomalies(
      baseWithCTR.map(d => d.date),
      baseWithCTR.map(d => d.clicks)
    ),
    comparison: detectAnomalies(
      comparisonWithCTR.map(d => d.date),
      comparisonWithCTR.map(d => d.clicks)
    ),
  }

  // Generate forecast from base period
  const forecast = generateForecast(
    baseWithCTR.map(d => d.date),
    baseWithCTR.map(d => d.clicks),
    7
  )

  // Create result object
  const result: PeriodComparisonResult = {
    periods,
    metrics,
    anomalies,
    forecast,
    insights: [],
    recommendation: '',
  }

  // Generate insights and recommendation
  result.insights = generateInsights(result)
  result.recommendation = generateRecommendation(result)

  return result
}
