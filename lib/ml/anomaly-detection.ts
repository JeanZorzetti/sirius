/**
 * Anomaly Detection Client
 *
 * TypeScript client for the Python ML API anomaly detection service
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

export type DetectionMethod = 'z-score' | 'iqr' | 'combined'

export interface TimeSeriesPoint {
  date: string // ISO format (YYYY-MM-DD)
  value: number
  segment?: Record<string, string> // e.g., { country: "BR", device: "mobile" }
}

export interface AnomalyAlert {
  metric: string
  severity: Severity
  detected_at: string
  baseline: number
  current: number
  deviation: number // % change
  confidence: number // 0-100%
  segment?: Record<string, string>
  recommended_actions: string[]
  estimated_impact?: Record<string, number>
  method: string
}

export interface DetectAnomaliesRequest {
  data: TimeSeriesPoint[]
  metric_type: MetricType
  window_size?: number // default: 14
  z_threshold?: number // default: 3.0
  method?: DetectionMethod // default: "combined"
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
// CLIENT
// ============================================================================

/**
 * ML API client configuration
 */
const ML_API_URL =
  process.env.NEXT_PUBLIC_ML_API_URL ||
  process.env.ML_API_URL ||
  'http://localhost:8000'

/**
 * Detect anomalies in time series data
 *
 * @param request - Detection request with data and parameters
 * @returns Anomaly detection results
 */
export async function detectAnomalies(
  request: DetectAnomaliesRequest
): Promise<DetectAnomaliesResponse> {
  try {
    const response = await fetch(`${ML_API_URL}/api/ml/detect-anomalies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      // Cache for 5 minutes (anomalies don't change that fast)
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(`ML API error: ${error.detail || response.statusText}`)
    }

    const data: DetectAnomaliesResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error detecting anomalies:', error)

    // Return empty response on error (graceful degradation)
    return {
      success: false,
      alerts: [],
      total_alerts: 0,
      critical_count: 0,
      warning_count: 0,
      info_count: 0,
      processed_at: new Date().toISOString(),
    }
  }
}

/**
 * Detect anomalies in multiple metrics in parallel
 *
 * @param metrics - Array of metric requests
 * @returns Array of detection results
 */
export async function detectAnomaliesBatch(
  metrics: DetectAnomaliesRequest[]
): Promise<DetectAnomaliesResponse[]> {
  return Promise.all(metrics.map((request) => detectAnomalies(request)))
}

/**
 * Convert SEO history to time series format
 *
 * Helper to convert Google Search Console data to the format expected by ML API
 */
export function historyToTimeSeries(
  history: Array<{ date: string; clicks?: number; impressions?: number; ctr?: number; position?: number }>,
  metric: 'clicks' | 'impressions' | 'ctr' | 'position'
): TimeSeriesPoint[] {
  return history
    .map((item) => ({
      date: item.date,
      value: item[metric] || 0,
    }))
    .filter((point) => point.value !== null && point.value !== undefined)
}

/**
 * Group alerts by severity
 */
export function groupAlertsBySeverity(alerts: AnomalyAlert[]): Record<Severity, AnomalyAlert[]> {
  return {
    critical: alerts.filter((a) => a.severity === 'critical'),
    warning: alerts.filter((a) => a.severity === 'warning'),
    info: alerts.filter((a) => a.severity === 'info'),
  }
}

/**
 * Get the most recent alert for each metric
 */
export function getMostRecentAlerts(alerts: AnomalyAlert[]): AnomalyAlert[] {
  const alertsByMetric = new Map<string, AnomalyAlert>()

  for (const alert of alerts) {
    const key = `${alert.metric}-${JSON.stringify(alert.segment || {})}`
    const existing = alertsByMetric.get(key)

    if (
      !existing ||
      new Date(alert.detected_at) > new Date(existing.detected_at)
    ) {
      alertsByMetric.set(key, alert)
    }
  }

  return Array.from(alertsByMetric.values()).sort(
    (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
  )
}

/**
 * Check if ML API is available
 */
export async function checkMLAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_API_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Format deviation as percentage with sign
 */
export function formatDeviation(deviation: number): string {
  const sign = deviation > 0 ? '+' : ''
  return `${sign}${deviation.toFixed(1)}%`
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: Severity): {
  bg: string
  border: string
  text: string
  icon: string
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-600',
      }
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
      }
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600',
      }
  }
}

/**
 * Get friendly metric name
 */
export function getMetricName(metric: string): string {
  const names: Record<string, string> = {
    clicks: 'Cliques',
    impressions: 'Impressões',
    ctr: 'CTR',
    position: 'Posição',
    cwv_lcp: 'LCP (Core Web Vitals)',
    cwv_inp: 'INP (Core Web Vitals)',
    cwv_cls: 'CLS (Core Web Vitals)',
    indexed_pages: 'Páginas Indexadas',
    crawl_errors: 'Erros de Crawl',
  }

  return names[metric] || metric
}
