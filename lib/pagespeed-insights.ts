/**
 * PageSpeed Insights API Integration
 *
 * Fetches Core Web Vitals and performance metrics from Google PageSpeed Insights API v5
 * Docs: https://developers.google.com/speed/docs/insights/v5/about
 */

export interface CoreWebVitals {
  // Core Web Vitals 2026
  lcp: MetricValue // Largest Contentful Paint (ms)
  inp: MetricValue // Interaction to Next Paint (ms) - substituiu FID em 2024
  cls: MetricValue // Cumulative Layout Shift (score)
  fcp: MetricValue // First Contentful Paint (ms)
  ttfb: MetricValue // Time to First Byte (ms)
}

export interface MetricValue {
  value: number
  category: 'FAST' | 'AVERAGE' | 'SLOW' | null
  percentile: number
  distributions?: {
    min: number
    max: number
    proportion: number
  }[]
}

export interface PageSpeedMetrics {
  url: string
  strategy: 'mobile' | 'desktop'
  performanceScore: number // 0-100
  coreWebVitals: CoreWebVitals | null
  labData: {
    // Lighthouse lab data (simulado)
    fcp: number
    lcp: number
    cls: number
    speedIndex: number
    totalBlockingTime: number
    interactive: number
  }
  fieldData: boolean // true se tem dados de campo (CrUX), false se só lab
  fetchedAt: string
}

export interface PageSpeedError {
  error: string
  code: string
  url: string
}

/**
 * Categoriza uma métrica baseada nos thresholds do Core Web Vitals 2026
 */
function categorizeMetric(
  value: number,
  metric: 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb'
): 'FAST' | 'AVERAGE' | 'SLOW' {
  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    inp: { good: 200, poor: 500 },
    cls: { good: 0.1, poor: 0.25 },
    fcp: { good: 1800, poor: 3000 },
    ttfb: { good: 800, poor: 1800 },
  }

  const { good, poor } = thresholds[metric]

  if (value <= good) return 'FAST'
  if (value <= poor) return 'AVERAGE'
  return 'SLOW'
}

/**
 * Extrai Core Web Vitals dos dados de campo (CrUX)
 */
function extractCoreWebVitals(loadingExperience: any): CoreWebVitals | null {
  if (!loadingExperience || !loadingExperience.metrics) {
    return null
  }

  const metrics = loadingExperience.metrics

  const extractMetric = (
    key: string,
    metricType: 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb'
  ): MetricValue => {
    const data = metrics[key]
    if (!data) {
      return {
        value: 0,
        category: null,
        percentile: 0,
      }
    }

    const value = data.percentile || 0
    return {
      value,
      category: categorizeMetric(value, metricType),
      percentile: data.percentile || 0,
      distributions: data.distributions,
    }
  }

  return {
    lcp: extractMetric('LARGEST_CONTENTFUL_PAINT_MS', 'lcp'),
    inp: extractMetric('INTERACTION_TO_NEXT_PAINT', 'inp'),
    cls: extractMetric('CUMULATIVE_LAYOUT_SHIFT_SCORE', 'cls'),
    fcp: extractMetric('FIRST_CONTENTFUL_PAINT_MS', 'fcp'),
    ttfb: extractMetric('EXPERIMENTAL_TIME_TO_FIRST_BYTE', 'ttfb'),
  }
}

/**
 * Busca métricas do PageSpeed Insights API
 *
 * @param url - URL completa para analisar
 * @param strategy - 'mobile' ou 'desktop'
 * @returns Métricas de performance ou erro
 */
export async function getPageSpeedMetrics(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PageSpeedMetrics | PageSpeedError> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY

  if (!apiKey) {
    return {
      error: 'GOOGLE_PAGESPEED_API_KEY não configurada',
      code: 'MISSING_API_KEY',
      url,
    }
  }

  try {
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
    apiUrl.searchParams.set('url', url)
    apiUrl.searchParams.set('strategy', strategy)
    apiUrl.searchParams.set('category', 'performance')
    apiUrl.searchParams.set('key', apiKey)

    const response = await fetch(apiUrl.toString(), {
      next: { revalidate: 86400 }, // Cache por 24 horas
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        error: errorData.error?.message || 'Erro ao buscar dados do PageSpeed',
        code: errorData.error?.code || 'API_ERROR',
        url,
      }
    }

    const data = await response.json()

    // Extrair dados de laboratório (Lighthouse)
    const lighthouseResult = data.lighthouseResult
    const audits = lighthouseResult?.audits || {}

    const labData = {
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      speedIndex: audits['speed-index']?.numericValue || 0,
      totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
      interactive: audits['interactive']?.numericValue || 0,
    }

    // Extrair Core Web Vitals de campo (CrUX)
    const coreWebVitals = extractCoreWebVitals(data.loadingExperience)

    // Performance Score (0-100)
    const performanceScore =
      lighthouseResult?.categories?.performance?.score != null
        ? Math.round(lighthouseResult.categories.performance.score * 100)
        : 0

    return {
      url,
      strategy,
      performanceScore,
      coreWebVitals,
      labData,
      fieldData: !!data.loadingExperience?.metrics,
      fetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Erro ao buscar PageSpeed Insights:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      code: 'FETCH_ERROR',
      url,
    }
  }
}

/**
 * Busca métricas para múltiplas URLs em paralelo
 */
export async function getPageSpeedMetricsBatch(
  urls: string[],
  strategy: 'mobile' | 'desktop' = 'mobile'
): Promise<PageSpeedMetrics[]> {
  const results = await Promise.all(
    urls.map((url) => getPageSpeedMetrics(url, strategy))
  )

  // Filtrar erros e retornar apenas sucessos
  return results.filter((result): result is PageSpeedMetrics => !('error' in result))
}

/**
 * Calcula score geral de Core Web Vitals
 * Passa se todas as métricas estão em 'FAST'
 */
export function calculateCWVScore(vitals: CoreWebVitals | null): {
  passed: boolean
  score: number
  failing: string[]
} {
  if (!vitals) {
    return { passed: false, score: 0, failing: ['No field data'] }
  }

  const metrics = [
    { name: 'LCP', value: vitals.lcp },
    { name: 'INP', value: vitals.inp },
    { name: 'CLS', value: vitals.cls },
  ]

  const failing: string[] = []
  let passCount = 0

  metrics.forEach((metric) => {
    if (metric.value.category === 'FAST') {
      passCount++
    } else {
      failing.push(metric.name)
    }
  })

  return {
    passed: failing.length === 0,
    score: Math.round((passCount / metrics.length) * 100),
    failing,
  }
}
