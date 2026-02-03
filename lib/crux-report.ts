/**
 * Chrome UX Report (CrUX) API Integration
 *
 * Fetches real user experience data from Chrome User Experience Report
 * Difference from PageSpeed Insights:
 * - PSI: Lab data (simulated)
 * - CrUX: Field data (real users, last 28 days)
 *
 * Docs: https://developers.google.com/web/tools/chrome-user-experience-report/api/reference
 */

export interface CrUXMetricHistogram {
  start: number
  end?: number
  density: number
}

export interface CrUXMetric {
  histogram: CrUXMetricHistogram[]
  percentiles: {
    p75: number
  }
}

export interface CrUXRecord {
  key: {
    origin?: string
    url?: string
    formFactor: 'PHONE' | 'DESKTOP' | 'TABLET'
  }
  metrics: {
    largest_contentful_paint?: CrUXMetric
    interaction_to_next_paint?: CrUXMetric
    cumulative_layout_shift?: CrUXMetric
    first_contentful_paint?: CrUXMetric
    first_input_delay?: CrUXMetric // Deprecated mas ainda retornado
    experimental_time_to_first_byte?: CrUXMetric
  }
  collectionPeriod: {
    firstDate: {
      year: number
      month: number
      day: number
    }
    lastDate: {
      year: number
      month: number
      day: number
    }
  }
}

export interface CrUXResponse {
  record?: CrUXRecord
  urlNormalizationDetails?: {
    originalUrl: string
    normalizedUrl: string
  }
  error?: {
    code: number
    message: string
    status: string
  }
}

export interface CrUXMetricSummary {
  name: string
  p75: number
  category: 'good' | 'needs-improvement' | 'poor'
  goodPercentage: number
  needsImprovementPercentage: number
  poorPercentage: number
}

export interface CrUXSummary {
  origin: string
  formFactor: 'PHONE' | 'DESKTOP' | 'TABLET'
  metrics: CrUXMetricSummary[]
  overallAssessment: 'passing' | 'failing'
  collectionPeriod: string
  fetchedAt: string
}

/**
 * Categoriza uma métrica baseada nos thresholds do Core Web Vitals
 */
function categorizeCrUXMetric(
  value: number,
  metricName: string
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<
    string,
    { good: number; needsImprovement: number }
  > = {
    largest_contentful_paint: { good: 2500, needsImprovement: 4000 },
    interaction_to_next_paint: { good: 200, needsImprovement: 500 },
    cumulative_layout_shift: { good: 0.1, needsImprovement: 0.25 },
    first_contentful_paint: { good: 1800, needsImprovement: 3000 },
    experimental_time_to_first_byte: { good: 800, needsImprovement: 1800 },
    first_input_delay: { good: 100, needsImprovement: 300 },
  }

  const threshold = thresholds[metricName]
  if (!threshold) {
    return 'needs-improvement'
  }

  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

/**
 * Calcula percentuais de bom/médio/ruim de um histograma
 */
function calculatePercentages(
  histogram: CrUXMetricHistogram[],
  metricName: string
): {
  good: number
  needsImprovement: number
  poor: number
} {
  const thresholds: Record<string, { good: number; needsImprovement: number }> = {
    largest_contentful_paint: { good: 2500, needsImprovement: 4000 },
    interaction_to_next_paint: { good: 200, needsImprovement: 500 },
    cumulative_layout_shift: { good: 0.1, needsImprovement: 0.25 },
    first_contentful_paint: { good: 1800, needsImprovement: 3000 },
    experimental_time_to_first_byte: { good: 800, needsImprovement: 1800 },
  }

  const threshold = thresholds[metricName]
  if (!threshold) {
    return { good: 0, needsImprovement: 0, poor: 0 }
  }

  let good = 0
  let needsImprovement = 0
  let poor = 0

  histogram.forEach((bin) => {
    if (bin.start <= threshold.good) {
      good += bin.density
    } else if (bin.start <= threshold.needsImprovement) {
      needsImprovement += bin.density
    } else {
      poor += bin.density
    }
  })

  return {
    good: Math.round(good * 100),
    needsImprovement: Math.round(needsImprovement * 100),
    poor: Math.round(poor * 100),
  }
}

/**
 * Busca dados do Chrome UX Report
 *
 * @param origin - URL da origem (ex: https://sirius.roilabs.com.br)
 * @param formFactor - PHONE, DESKTOP, ou TABLET
 * @returns Dados de experiência de usuários reais
 */
export async function getCrUXMetrics(
  origin: string,
  formFactor: 'PHONE' | 'DESKTOP' | 'TABLET' = 'PHONE'
): Promise<CrUXSummary | { error: string }> {
  const apiKey = process.env.GOOGLE_CRUX_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY

  if (!apiKey) {
    return {
      error: 'GOOGLE_CRUX_API_KEY ou GOOGLE_PAGESPEED_API_KEY não configurada',
    }
  }

  try {
    const response = await fetch(
      `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          formFactor,
          metrics: [
            'largest_contentful_paint',
            'interaction_to_next_paint',
            'cumulative_layout_shift',
            'first_contentful_paint',
            'experimental_time_to_first_byte',
          ],
        }),
        next: { revalidate: 86400 }, // Cache por 24 horas
      }
    )

    if (!response.ok) {
      const errorData: CrUXResponse = await response.json().catch(() => ({}))
      return {
        error:
          errorData.error?.message ||
          'Erro ao buscar dados do Chrome UX Report. O site pode não ter dados suficientes no CrUX.',
      }
    }

    const data: CrUXResponse = await response.json()

    if (!data.record) {
      return {
        error:
          'Nenhum dado disponível no CrUX para este origin/formFactor. O site precisa ter volume suficiente de usuários Chrome.',
      }
    }

    const record = data.record

    // Processar métricas
    const metrics: CrUXMetricSummary[] = []

    const metricNames: (keyof typeof record.metrics)[] = [
      'largest_contentful_paint',
      'interaction_to_next_paint',
      'cumulative_layout_shift',
      'first_contentful_paint',
      'experimental_time_to_first_byte',
    ]

    metricNames.forEach((metricName) => {
      const metric = record.metrics[metricName]
      if (metric) {
        const p75 = metric.percentiles.p75
        const percentages = calculatePercentages(metric.histogram, metricName)

        metrics.push({
          name: metricName.replace(/_/g, ' ').toUpperCase(),
          p75,
          category: categorizeCrUXMetric(p75, metricName),
          goodPercentage: percentages.good,
          needsImprovementPercentage: percentages.needsImprovement,
          poorPercentage: percentages.poor,
        })
      }
    })

    // Avaliar se passa nos Core Web Vitals (75% dos usuários devem ter boa experiência)
    const coreMetrics = metrics.filter((m) =>
      ['LARGEST CONTENTFUL PAINT', 'INTERACTION TO NEXT PAINT', 'CUMULATIVE LAYOUT SHIFT'].includes(
        m.name
      )
    )

    const passingMetrics = coreMetrics.filter((m) => m.goodPercentage >= 75)
    const overallAssessment = passingMetrics.length === coreMetrics.length ? 'passing' : 'failing'

    // Formatar período de coleta
    const { firstDate, lastDate } = record.collectionPeriod
    const collectionPeriod = `${firstDate.year}-${String(firstDate.month).padStart(2, '0')}-${String(firstDate.day).padStart(2, '0')} a ${lastDate.year}-${String(lastDate.month).padStart(2, '0')}-${String(lastDate.day).padStart(2, '0')}`

    return {
      origin: data.urlNormalizationDetails?.normalizedUrl || origin,
      formFactor,
      metrics,
      overallAssessment,
      collectionPeriod,
      fetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Erro ao buscar CrUX Report:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar CrUX',
    }
  }
}

/**
 * Busca dados do CrUX para mobile e desktop em paralelo
 */
export async function getCrUXMetricsBoth(origin: string): Promise<{
  mobile: CrUXSummary | { error: string }
  desktop: CrUXSummary | { error: string }
}> {
  const [mobile, desktop] = await Promise.all([
    getCrUXMetrics(origin, 'PHONE'),
    getCrUXMetrics(origin, 'DESKTOP'),
  ])

  return { mobile, desktop }
}
