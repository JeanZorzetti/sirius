import { linearRegression, linearRegressionLine } from 'simple-statistics'

export type TrendDirection = 'Alta' | 'Baixa' | 'Estavel'
export type EfficiencyTrend = 'Melhorando' | 'Piorando' | 'Estavel'

export interface ForecastDataPoint {
  date: string
  predictedClicks: number
  predictedImpressions: number
  predictedClicksFromEfficiency: number
}

export interface ForecastResult {
  trends: {
    clicks: TrendDirection
    impressions: TrendDirection
  }
  futureData: ForecastDataPoint[]
  velocity: {
    clicks: number
    impressions: number
  }
  predictedTotal: {
    clicks: number
    impressions: number
    clicksFromEfficiency: number
  }
  confidence: {
    clicks: number
    impressions: number
  }
  efficiency: {
    currentRatio: number
    trend: EfficiencyTrend
    forecastNext30d: number
  }
}

interface HistoryItem {
  date: string
  clicks: number
  impressions: number
}

/**
 * Determine trend direction based on slope
 */
function getTrendFromSlope(slope: number): TrendDirection {
  if (slope > 0.5) return 'Alta'
  if (slope < -0.5) return 'Baixa'
  return 'Estavel'
}

/**
 * Calculate R-squared (coefficient of determination) for model confidence
 */
function calculateRSquared(
  points: [number, number][],
  predict: (x: number) => number
): number {
  const meanY = points.reduce((sum, p) => sum + p[1], 0) / points.length
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p[1] - meanY, 2), 0)
  const ssResidual = points.reduce(
    (sum, p) => sum + Math.pow(p[1] - predict(p[0]), 2),
    0
  )
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0
  return Math.max(0, Math.min(100, Math.round(rSquared * 100)))
}

/**
 * Generate traffic forecast using Linear Regression for both clicks and impressions
 * @param history Historical data with date, clicks, and impressions
 * @param daysToProject Number of days to project into the future
 * @returns Forecast result with trends, future data, and velocities
 */
export function generateForecast(
  history: HistoryItem[],
  daysToProject = 30
): ForecastResult {
  // Need at least 7 days of data for meaningful prediction
  if (history.length < 7) {
    return {
      trends: {
        clicks: 'Estavel',
        impressions: 'Estavel',
      },
      futureData: [],
      velocity: {
        clicks: 0,
        impressions: 0,
      },
      predictedTotal: {
        clicks: 0,
        impressions: 0,
        clicksFromEfficiency: 0,
      },
      confidence: {
        clicks: 0,
        impressions: 0,
      },
      efficiency: {
        currentRatio: 0,
        trend: 'Estavel',
        forecastNext30d: 0,
      },
    }
  }

  // Convert history to [x, y] points where x is day index
  const clicksPoints: [number, number][] = history.map((item, index) => [
    index,
    item.clicks,
  ])

  const impressionsPoints: [number, number][] = history.map((item, index) => [
    index,
    item.impressions,
  ])

  // Calculate linear regressions (y = mx + b) for both metrics
  const clicksRegression = linearRegression(clicksPoints)
  const clicksPredict = linearRegressionLine(clicksRegression)

  const impressionsRegression = linearRegression(impressionsPoints)
  const impressionsPredict = linearRegressionLine(impressionsRegression)

  // Extract slopes and determine trends
  const clicksSlope = clicksRegression.m
  const impressionsSlope = impressionsRegression.m

  const clicksTrend = getTrendFromSlope(clicksSlope)
  const impressionsTrend = getTrendFromSlope(impressionsSlope)

  // Calculate confidence scores (R-squared)
  const clicksConfidence = calculateRSquared(clicksPoints, clicksPredict)
  const impressionsConfidence = calculateRSquared(impressionsPoints, impressionsPredict)

  // Calculate Efficiency Ratio (Impressions per Click) - BEFORE futureData loop
  // Lower is better (means higher CTR)
  const efficiencyPoints: [number, number][] = history.map((item, index) => {
    const ratio = item.clicks > 0 ? item.impressions / item.clicks : item.impressions
    return [index, ratio]
  })

  // Get the last date from history
  const lastDate = new Date(history[history.length - 1].date)
  const startIndex = history.length

  // Calculate current ratio (average of entire period)
  const totalClicks = history.reduce((sum, item) => sum + item.clicks, 0)
  const totalImpressions = history.reduce((sum, item) => sum + item.impressions, 0)
  const currentRatio = totalClicks > 0 ? Math.round(totalImpressions / totalClicks) : 0

  // Linear regression on efficiency ratio to detect trend
  const efficiencyRegression = linearRegression(efficiencyPoints)
  const efficiencyPredict = linearRegressionLine(efficiencyRegression)
  const efficiencySlope = efficiencyRegression.m

  // Determine efficiency trend
  // If slope is negative, ratio is decreasing (GOOD - getting more efficient)
  // If slope is positive, ratio is increasing (BAD - getting less efficient)
  let efficiencyTrend: EfficiencyTrend
  if (efficiencySlope < -1) {
    efficiencyTrend = 'Melhorando'
  } else if (efficiencySlope > 1) {
    efficiencyTrend = 'Piorando'
  } else {
    efficiencyTrend = 'Estavel'
  }

  // Forecast efficiency ratio 30 days out
  const forecastNext30d = Math.max(0, Math.round(efficiencyPredict(startIndex + 29)))

  // Generate future data points with BOTH prediction methods
  const futureData: ForecastDataPoint[] = []
  let predictedClicksTotal = 0
  let predictedImpressionsTotal = 0
  let predictedClicksFromEfficiencyTotal = 0

  for (let i = 0; i < daysToProject; i++) {
    const futureDate = new Date(lastDate)
    futureDate.setDate(futureDate.getDate() + i + 1)

    // Method 1: Direct linear regression on clicks
    const predictedClicks = Math.max(0, Math.round(clicksPredict(startIndex + i)))

    // Method 2: Predicted impressions divided by predicted efficiency ratio
    const predictedImpressions = Math.max(0, Math.round(impressionsPredict(startIndex + i)))
    const predictedEfficiencyRatio = Math.max(1, efficiencyPredict(startIndex + i))
    const predictedClicksFromEfficiency = Math.max(0, Math.round(predictedImpressions / predictedEfficiencyRatio))

    predictedClicksTotal += predictedClicks
    predictedImpressionsTotal += predictedImpressions
    predictedClicksFromEfficiencyTotal += predictedClicksFromEfficiency

    futureData.push({
      date: futureDate.toISOString().split('T')[0],
      predictedClicks,
      predictedImpressions,
      predictedClicksFromEfficiency,
    })
  }

  return {
    trends: {
      clicks: clicksTrend,
      impressions: impressionsTrend,
    },
    futureData,
    velocity: {
      clicks: Math.round(clicksSlope * 100) / 100,
      impressions: Math.round(impressionsSlope * 100) / 100,
    },
    predictedTotal: {
      clicks: predictedClicksTotal,
      impressions: predictedImpressionsTotal,
      clicksFromEfficiency: predictedClicksFromEfficiencyTotal,
    },
    confidence: {
      clicks: clicksConfidence,
      impressions: impressionsConfidence,
    },
    efficiency: {
      currentRatio,
      trend: efficiencyTrend,
      forecastNext30d,
    },
  }
}

/**
 * Combine historical data with forecast for chart visualization
 * The last point of history connects to the first point of forecast
 */
export function combineDataForChart(
  history: HistoryItem[],
  forecast: ForecastResult
): Array<{
  date: string
  formattedDate: string
  clicks?: number
  impressions?: number
  predictedClicks?: number
  predictedImpressions?: number
  predictedClicksFromEfficiency?: number
}> {
  // Format date from YYYY-MM-DD to DD/MM
  const formatDate = (dateStr: string): string => {
    const [, month, day] = dateStr.split('-')
    return `${day}/${month}`
  }

  // Historical data
  const historicalData = history.map((item) => ({
    date: item.date,
    formattedDate: formatDate(item.date),
    clicks: item.clicks,
    impressions: item.impressions,
    predictedClicks: undefined as number | undefined,
    predictedImpressions: undefined as number | undefined,
    predictedClicksFromEfficiency: undefined as number | undefined,
  }))

  // Add the last historical point to forecast to connect the lines
  if (historicalData.length > 0 && forecast.futureData.length > 0) {
    const lastHistorical = historicalData[historicalData.length - 1]
    // Set the predicted values on the last historical point to connect the lines
    lastHistorical.predictedClicks = lastHistorical.clicks
    lastHistorical.predictedImpressions = lastHistorical.impressions
    lastHistorical.predictedClicksFromEfficiency = lastHistorical.clicks
  }

  // Forecast data
  const forecastData = forecast.futureData.map((item) => ({
    date: item.date,
    formattedDate: formatDate(item.date),
    clicks: undefined as number | undefined,
    impressions: undefined as number | undefined,
    predictedClicks: item.predictedClicks,
    predictedImpressions: item.predictedImpressions,
    predictedClicksFromEfficiency: item.predictedClicksFromEfficiency,
  }))

  return [...historicalData, ...forecastData]
}
