/**
 * Anomaly Detection - TypeScript Native Implementation
 *
 * Detecção de anomalias em métricas de SEO usando Z-Score + IQR.
 * Roda diretamente no servidor Next.js sem dependência externa.
 *
 * Algoritmos:
 * 1. Z-Score: (x - mean) / std → detecta pontos a N desvios padrão da média
 * 2. IQR: Q1 - 1.5*IQR to Q3 + 1.5*IQR → robusto a outliers
 *
 * Referências:
 * - https://www.meegle.com/en_us/topics/anomaly-detection/anomaly-detection-in-seo-analytics
 * - https://nextflywebdesign.com/blog/ga4-anomaly-detection/
 */

// ============================================================================
// TYPES
// ============================================================================

export type Severity = 'critical' | 'warning' | 'info'

export type MetricType =
  | 'clicks'
  | 'impressions'
  | 'ctr'
  | 'position'
  | 'cwv_lcp'
  | 'cwv_inp'
  | 'cwv_cls'
  | 'indexed_pages'
  | 'crawl_errors'

export interface TimeSeriesPoint {
  date: string
  value: number
  segment?: Record<string, string>
}

export interface AnomalyAlert {
  metric: string
  severity: Severity
  detected_at: string
  baseline: number
  current: number
  deviation: number
  confidence: number
  segment?: Record<string, string>
  recommended_actions: string[]
  estimated_impact: Record<string, number>
  method: string
}

export interface DetectAnomaliesResponse {
  success: boolean
  alerts: AnomalyAlert[]
  total_alerts: number
  critical_count: number
  warning_count: number
  info_count: number
  processed_at: string
}

// ============================================================================
// CORE ALGORITHM
// ============================================================================

/**
 * Calcula média de um array de números
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Calcula desvio padrão de um array de números
 */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squaredDiffs = values.map((v) => Math.pow(v - avg, 2))
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1))
}

/**
 * Calcula quantil de um array de números
 */
function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

/**
 * Z-Score Detection
 *
 * Detecta valores que estão a mais de N desvios padrão da média do rolling window.
 */
function detectZScore(
  data: TimeSeriesPoint[],
  metricType: MetricType,
  windowSize: number,
  zThreshold: number
): AnomalyAlert[] {
  if (data.length < 7) return []

  const alerts: AnomalyAlert[] = []

  // Analisar os últimos 3 pontos (dias recentes)
  const recentCount = Math.min(3, data.length - windowSize)
  if (recentCount <= 0) return []

  for (let i = data.length - recentCount; i < data.length; i++) {
    // Pegar window anterior ao ponto atual
    const windowStart = Math.max(0, i - windowSize)
    const windowValues = data.slice(windowStart, i).map((p) => p.value)

    if (windowValues.length < 5) continue

    const avg = mean(windowValues)
    const std = stdDev(windowValues)

    if (std === 0) continue // Dados constantes, sem anomalia

    const zScore = Math.abs((data[i].value - avg) / std)

    if (zScore > zThreshold) {
      const deviation = avg !== 0 ? ((data[i].value - avg) / avg) * 100 : 0
      const confidence = Math.min(100, (zScore / zThreshold - 1) * 50 + 80)

      alerts.push({
        metric: metricType,
        severity: determineSeverity(metricType, deviation, zScore),
        detected_at: data[i].date,
        baseline: Math.round(avg * 100) / 100,
        current: data[i].value,
        deviation: Math.round(deviation * 10) / 10,
        confidence: Math.round(confidence * 10) / 10,
        segment: data[i].segment,
        recommended_actions: generateActions(metricType, deviation, data[i].segment),
        estimated_impact: estimateImpact(metricType, data[i].value, avg, deviation),
        method: 'z-score',
      })
    }
  }

  return alerts
}

/**
 * IQR Detection
 *
 * Mais robusto a outliers que Z-Score.
 * Detecta valores fora do range Q1 - 1.5*IQR .. Q3 + 1.5*IQR
 */
function detectIQR(
  data: TimeSeriesPoint[],
  metricType: MetricType,
  windowSize: number,
  iqrMultiplier: number
): AnomalyAlert[] {
  if (data.length < 7) return []

  const alerts: AnomalyAlert[] = []
  const recentCount = Math.min(3, data.length - windowSize)
  if (recentCount <= 0) return []

  for (let i = data.length - recentCount; i < data.length; i++) {
    const windowStart = Math.max(0, i - windowSize)
    const windowValues = data.slice(windowStart, i).map((p) => p.value)

    if (windowValues.length < 5) continue

    const q1 = quantile(windowValues, 0.25)
    const q3 = quantile(windowValues, 0.75)
    const iqr = q3 - q1
    const lower = q1 - iqrMultiplier * iqr
    const upper = q3 + iqrMultiplier * iqr
    const med = quantile(windowValues, 0.5)

    const value = data[i].value
    const isAnomaly = value < lower || value > upper

    if (isAnomaly) {
      const deviation = med !== 0 ? ((value - med) / med) * 100 : 0
      const distance = iqr > 0
        ? (value < lower ? (lower - value) / iqr : (value - upper) / iqr)
        : 0
      const confidence = Math.min(100, distance * 30 + 70)

      alerts.push({
        metric: metricType,
        severity: determineSeverity(metricType, deviation, distance + iqrMultiplier),
        detected_at: data[i].date,
        baseline: Math.round(med * 100) / 100,
        current: value,
        deviation: Math.round(deviation * 10) / 10,
        confidence: Math.round(confidence * 10) / 10,
        segment: data[i].segment,
        recommended_actions: generateActions(metricType, deviation, data[i].segment),
        estimated_impact: estimateImpact(metricType, value, med, deviation),
        method: 'iqr',
      })
    }
  }

  return alerts
}

// ============================================================================
// SEVERITY & ACTIONS
// ============================================================================

function determineSeverity(
  metricType: MetricType,
  deviation: number,
  score: number
): Severity {
  // Clicks / Impressions: drops are critical
  if (metricType === 'clicks' || metricType === 'impressions') {
    if (deviation < -50 || score > 5) return 'critical'
    if (deviation < -20 || score > 4) return 'warning'
    return 'info'
  }

  // Position: getting worse (higher) is bad
  if (metricType === 'position') {
    if (deviation > 50 || score > 5) return 'critical'
    if (deviation > 20 || score > 4) return 'warning'
    return 'info'
  }

  // CTR: drops are concerning
  if (metricType === 'ctr') {
    if (deviation < -30 || score > 5) return 'critical'
    if (deviation < -15 || score > 4) return 'warning'
    return 'info'
  }

  // CWV: increases are bad
  if (metricType.startsWith('cwv_')) {
    if (deviation > 30 || score > 5) return 'critical'
    if (deviation > 15 || score > 4) return 'warning'
    return 'info'
  }

  // Crawl errors: increases are bad
  if (metricType === 'crawl_errors') {
    if (deviation > 50 || score > 4) return 'critical'
    if (deviation > 20 || score > 3) return 'warning'
    return 'info'
  }

  // Default
  if (score > 5) return 'critical'
  if (score > 4) return 'warning'
  return 'info'
}

function generateActions(
  metricType: MetricType,
  deviation: number,
  segment?: Record<string, string>
): string[] {
  const actions: string[] = []

  if (metricType === 'clicks' && deviation < -20) {
    actions.push('Verificar Google Search Console para erros de indexacao')
    actions.push('Comparar com dados de anos anteriores (sazonalidade?)')
    actions.push('Verificar se houve update do algoritmo do Google')

    if (segment?.country) {
      actions.push(`Verificar robots.txt e hreflang para ${segment.country}`)
    }
    if (segment?.device) {
      actions.push(`Verificar problemas especificos de ${segment.device}`)
    }
  } else if (metricType === 'impressions' && deviation < -20) {
    actions.push('Verificar se houve queda de visibilidade no Google')
    actions.push('Analisar se novas paginas de competidores apareceram')
    actions.push('Verificar se algum conteudo foi desindexado')
  } else if (metricType === 'ctr' && deviation < -15) {
    actions.push('Otimizar title e meta description das paginas afetadas')
    actions.push('Adicionar/melhorar structured data (rich snippets)')
    actions.push('Comparar snippet com competidores no SERP')
    actions.push('Verificar se intent da keyword mudou')
  } else if (metricType === 'position' && deviation > 20) {
    actions.push('Analisar competidores no SERP (novos players?)')
    actions.push('Verificar se conteudo precisa de atualizacao')
    actions.push('Revisar backlinks (perdeu algum importante?)')
    actions.push('Verificar Core Web Vitals da pagina')
  } else if (metricType === 'clicks' && deviation > 30) {
    actions.push('Spike positivo detectado! Analisar a causa')
    actions.push('Verificar se algum conteudo viralizou')
    actions.push('Aproveitar o momento para otimizar conversion')
  } else if (metricType === 'impressions' && deviation > 30) {
    actions.push('Aumento de visibilidade detectado!')
    actions.push('Otimizar CTR para aproveitar mais impressoes')
    actions.push('Verificar quais keywords subiram')
  }

  if (actions.length === 0) {
    actions.push('Investigar causa raiz da anomalia')
    actions.push('Monitorar metrica nas proximas 48h')
  }

  return actions
}

function estimateImpact(
  metricType: MetricType,
  current: number,
  baseline: number,
  deviation: number
): Record<string, number> {
  const impact: Record<string, number> = {}

  if (metricType === 'clicks') {
    const diff = baseline - current
    if (diff > 0) {
      impact.cliques_perdidos_dia = Math.round(diff)
      impact.cliques_perdidos_mes = Math.round(diff * 30)
      impact.impacto_receita_estimado = Math.round(diff * 30 * 5) // ~R$5/click
    } else {
      impact.cliques_ganhos_dia = Math.round(Math.abs(diff))
    }
  } else if (metricType === 'impressions') {
    const diff = baseline - current
    if (diff > 0) {
      impact.impressoes_perdidas_dia = Math.round(diff)
      impact.cliques_potenciais_perdidos = Math.round(diff * 0.03) // ~3% CTR
    }
  } else if (metricType === 'position') {
    if (deviation > 0) {
      const positionsLost = current - baseline
      impact.posicoes_perdidas = Math.round(positionsLost * 10) / 10
      impact.perda_ctr_estimada_pct = Math.round(positionsLost * 3 * 10) / 10
    }
  } else if (metricType === 'ctr') {
    if (deviation < 0) {
      impact.perda_ctr_pct = Math.round(Math.abs(deviation) * 10) / 10
    }
  }

  return impact
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Detecta anomalias em dados de time series (TypeScript nativo)
 *
 * Roda diretamente no servidor sem dependência de API externa.
 */
export function detectAnomalies(
  data: TimeSeriesPoint[],
  metricType: MetricType,
  options: {
    windowSize?: number
    zThreshold?: number
    iqrMultiplier?: number
  } = {}
): AnomalyAlert[] {
  const { windowSize = 14, zThreshold = 3.0, iqrMultiplier = 1.5 } = options

  if (data.length < 7) return []

  // Z-Score detection
  const zAlerts = detectZScore(data, metricType, windowSize, zThreshold)

  // IQR detection
  const iqrAlerts = detectIQR(data, metricType, windowSize, iqrMultiplier)

  // Merge: deduplicate by date, boost confidence if detected by both
  const alertsByDate = new Map<string, AnomalyAlert>()

  for (const alert of zAlerts) {
    alertsByDate.set(alert.detected_at, alert)
  }

  for (const alert of iqrAlerts) {
    if (alertsByDate.has(alert.detected_at)) {
      const existing = alertsByDate.get(alert.detected_at)!
      existing.confidence = Math.min(100, existing.confidence + 10)
      existing.method = 'z-score+iqr'
    } else {
      alertsByDate.set(alert.detected_at, alert)
    }
  }

  return Array.from(alertsByDate.values())
}

/**
 * Detecta anomalias em múltiplas métricas do SEO de uma vez
 *
 * Retorna um DetectAnomaliesResponse consolidado com todos os alertas.
 */
export function detectAllAnomalies(
  history: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>,
  countryData?: Array<{ country: string; countryName: string; clicks: number; impressions: number; ctr: number; position: number }>,
  deviceData?: Array<{ device: string; clicks: number; impressions: number; ctr: number; position: number }>
): DetectAnomaliesResponse {
  const allAlerts: AnomalyAlert[] = []

  // 1. Clicks
  const clicksTS = history.map((h) => ({ date: h.date, value: h.clicks }))
  allAlerts.push(...detectAnomalies(clicksTS, 'clicks'))

  // 2. Impressions
  const impressionsTS = history.map((h) => ({ date: h.date, value: h.impressions }))
  allAlerts.push(...detectAnomalies(impressionsTS, 'impressions'))

  // 3. CTR
  const ctrTS = history.map((h) => ({ date: h.date, value: h.ctr }))
  allAlerts.push(...detectAnomalies(ctrTS, 'ctr'))

  // 4. Position
  const positionTS = history.map((h) => ({ date: h.date, value: h.position }))
  allAlerts.push(...detectAnomalies(positionTS, 'position'))

  // 5. Segmentos por país (comparar cliques de cada país vs seu próprio baseline)
  if (countryData && countryData.length > 0) {
    // Não temos time series por país, mas podemos detectar outliers
    // entre os países atuais (cross-sectional anomaly)
    const countryClicks = countryData.map((c) => ({
      date: new Date().toISOString().split('T')[0],
      value: c.clicks,
      segment: { country: c.countryName },
    }))

    // Detectar se algum país tem CTR anormalmente baixo vs média
    const avgCTR = mean(countryData.map((c) => c.ctr))
    const stdCTR = stdDev(countryData.map((c) => c.ctr))

    if (stdCTR > 0) {
      for (const country of countryData) {
        const z = (country.ctr - avgCTR) / stdCTR
        if (z < -2 && country.impressions > 50) {
          // CTR anormalmente baixo neste país
          const deviation = avgCTR !== 0 ? ((country.ctr - avgCTR) / avgCTR) * 100 : 0
          allAlerts.push({
            metric: 'ctr',
            severity: deviation < -50 ? 'critical' : 'warning',
            detected_at: new Date().toISOString().split('T')[0],
            baseline: Math.round(avgCTR * 1000) / 1000,
            current: Math.round(country.ctr * 1000) / 1000,
            deviation: Math.round(deviation * 10) / 10,
            confidence: Math.min(100, Math.abs(z) * 20 + 50),
            segment: { country: country.countryName },
            recommended_actions: [
              `CTR anormalmente baixo em ${country.countryName}`,
              'Verificar se snippets estao otimizados para esse mercado',
              'Verificar se idioma/hreflang esta correto',
              'Analisar competidores locais neste pais',
            ],
            estimated_impact: {
              impressoes_desperdicadas: Math.round(country.impressions * (1 - country.ctr / avgCTR)),
            },
            method: 'cross-sectional',
          })
        }
      }
    }
  }

  // 6. Segmentos por dispositivo
  if (deviceData && deviceData.length > 0) {
    const avgCTR = mean(deviceData.map((d) => d.ctr))

    for (const device of deviceData) {
      // Detectar se mobile tem CTR muito inferior a desktop
      if (device.ctr < avgCTR * 0.6 && device.impressions > 50) {
        const deviation = avgCTR !== 0 ? ((device.ctr - avgCTR) / avgCTR) * 100 : 0
        allAlerts.push({
          metric: 'ctr',
          severity: deviation < -40 ? 'warning' : 'info',
          detected_at: new Date().toISOString().split('T')[0],
          baseline: Math.round(avgCTR * 1000) / 1000,
          current: Math.round(device.ctr * 1000) / 1000,
          deviation: Math.round(deviation * 10) / 10,
          confidence: 75,
          segment: { device: device.device },
          recommended_actions: [
            `CTR de ${device.device} ${Math.abs(Math.round(deviation))}% abaixo da media`,
            'Verificar mobile usability no Google Search Console',
            'Testar Core Web Vitals neste dispositivo',
            'Otimizar snippets para telas menores',
          ],
          estimated_impact: {
            cliques_potenciais_perdidos: Math.round(
              device.impressions * (avgCTR - device.ctr)
            ),
          },
          method: 'cross-sectional',
        })
      }

      // Detectar se posição é muito pior em mobile vs desktop
      const avgPos = mean(deviceData.map((d) => d.position))
      if (device.position > avgPos * 1.3 && device.device === 'mobile') {
        const deviation = ((device.position - avgPos) / avgPos) * 100
        allAlerts.push({
          metric: 'position',
          severity: deviation > 30 ? 'warning' : 'info',
          detected_at: new Date().toISOString().split('T')[0],
          baseline: Math.round(avgPos * 10) / 10,
          current: Math.round(device.position * 10) / 10,
          deviation: Math.round(deviation * 10) / 10,
          confidence: 70,
          segment: { device: device.device },
          recommended_actions: [
            `Posicao media em mobile ${Math.round(deviation)}% pior que a media geral`,
            'Priorizar otimizacao mobile-first',
            'Verificar Core Web Vitals em mobile',
            'Garantir que conteudo e responsivo e rapido',
          ],
          estimated_impact: {
            posicoes_perdidas: Math.round((device.position - avgPos) * 10) / 10,
          },
          method: 'cross-sectional',
        })
      }
    }
  }

  // Sort by severity (critical first), then by confidence
  const severityOrder: Record<Severity, number> = { critical: 0, warning: 1, info: 2 }
  allAlerts.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (sevDiff !== 0) return sevDiff
    return b.confidence - a.confidence
  })

  const critical = allAlerts.filter((a) => a.severity === 'critical').length
  const warning = allAlerts.filter((a) => a.severity === 'warning').length
  const info = allAlerts.filter((a) => a.severity === 'info').length

  return {
    success: true,
    alerts: allAlerts,
    total_alerts: allAlerts.length,
    critical_count: critical,
    warning_count: warning,
    info_count: info,
    processed_at: new Date().toISOString(),
  }
}

// ============================================================================
// HELPERS (UI)
// ============================================================================

export function groupAlertsBySeverity(alerts: AnomalyAlert[]): Record<Severity, AnomalyAlert[]> {
  return {
    critical: alerts.filter((a) => a.severity === 'critical'),
    warning: alerts.filter((a) => a.severity === 'warning'),
    info: alerts.filter((a) => a.severity === 'info'),
  }
}

export function formatDeviation(deviation: number): string {
  const sign = deviation > 0 ? '+' : ''
  return `${sign}${deviation.toFixed(1)}%`
}

export function getSeverityColor(severity: Severity): {
  bg: string
  border: string
  text: string
  icon: string
} {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' }
    case 'warning':
      return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' }
    case 'info':
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' }
  }
}

export function getMetricName(metric: string): string {
  const names: Record<string, string> = {
    clicks: 'Cliques',
    impressions: 'Impressoes',
    ctr: 'CTR',
    position: 'Posicao',
    cwv_lcp: 'LCP (Core Web Vitals)',
    cwv_inp: 'INP (Core Web Vitals)',
    cwv_cls: 'CLS (Core Web Vitals)',
    indexed_pages: 'Paginas Indexadas',
    crawl_errors: 'Erros de Crawl',
  }
  return names[metric] || metric
}
