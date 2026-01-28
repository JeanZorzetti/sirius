import { linearRegression, linearRegressionLine } from 'simple-statistics'

export type TrendDirection = 'Alta' | 'Baixa' | 'Estavel'

export interface ForecastDataPoint {
  date: string
  predictedClicks: number
}

export interface ForecastResult {
  trend: TrendDirection
  futureData: ForecastDataPoint[]
  velocity: number // Daily growth rate (slope)
  predictedTotal: number // Total clicks projected for next 30 days
  confidence: number // R-squared approximation (0-100)
}

interface HistoryItem {
  date: string
  clicks: number
}

/**
 * Generate traffic forecast using Linear Regression
 * @param history Historical data with date and clicks
 * @param daysToProject Number of days to project into the future
 * @returns Forecast result with trend, future data, and velocity
 */
export function generateForecast(
  history: HistoryItem[],
  daysToProject = 30
): ForecastResult {
  // Need at least 7 days of data for meaningful prediction
  if (history.length < 7) {
    return {
      trend: 'Estavel',
      futureData: [],
      velocity: 0,
      predictedTotal: 0,
      confidence: 0,
    }
  }

  // Convert history to [x, y] points where x is day index
  const points: [number, number][] = history.map((item, index) => [
    index,
    item.clicks,
  ])

  // Calculate linear regression (y = mx + b)
  const regression = linearRegression(points)
  const predict = linearRegressionLine(regression)

  // m = slope (velocity), b = intercept
  const { m: slope, b: intercept } = regression

  // Determine trend based on slope
  let trend: TrendDirection
  if (slope > 0.5) {
    trend = 'Alta'
  } else if (slope < -0.5) {
    trend = 'Baixa'
  } else {
    trend = 'Estavel'
  }

  // Get the last date from history
  const lastDate = new Date(history[history.length - 1].date)
  const startIndex = history.length

  // Generate future data points
  const futureData: ForecastDataPoint[] = []
  let predictedTotal = 0

  for (let i = 0; i < daysToProject; i++) {
    const futureDate = new Date(lastDate)
    futureDate.setDate(futureDate.getDate() + i + 1)

    const predictedClicks = Math.max(0, Math.round(predict(startIndex + i)))
    predictedTotal += predictedClicks

    futureData.push({
      date: futureDate.toISOString().split('T')[0],
      predictedClicks,
    })
  }

  // Calculate R-squared (coefficient of determination) for confidence
  const meanY = points.reduce((sum, p) => sum + p[1], 0) / points.length
  const ssTotal = points.reduce((sum, p) => sum + Math.pow(p[1] - meanY, 2), 0)
  const ssResidual = points.reduce(
    (sum, p) => sum + Math.pow(p[1] - predict(p[0]), 2),
    0
  )
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0
  const confidence = Math.max(0, Math.min(100, Math.round(rSquared * 100)))

  return {
    trend,
    futureData,
    velocity: Math.round(slope * 100) / 100,
    predictedTotal,
    confidence,
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
  predictedClicks?: number
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
    predictedClicks: undefined as number | undefined,
  }))

  // Add the last historical point to forecast to connect the lines
  if (historicalData.length > 0 && forecast.futureData.length > 0) {
    const lastHistorical = historicalData[historicalData.length - 1]
    // Set the predicted clicks on the last historical point to connect the lines
    lastHistorical.predictedClicks = lastHistorical.clicks
  }

  // Forecast data
  const forecastData = forecast.futureData.map((item) => ({
    date: item.date,
    formattedDate: formatDate(item.date),
    clicks: undefined as number | undefined,
    predictedClicks: item.predictedClicks,
  }))

  return [...historicalData, ...forecastData]
}
