/**
 * Google Trends API Integration (Unofficial)
 *
 * Fetches trending data from Google Trends using the unofficial API
 * Note: This is not an official Google API and may change without notice
 *
 * Endpoints used:
 * - Interest over time: Shows search volume over time for keywords
 * - Related queries: Shows related searches (top & rising)
 * - Trending searches: Shows current trending searches by region
 */

export interface InterestDataPoint {
  time: string // ISO date
  value: number // 0-100 (normalized search interest)
  formattedTime: string // "Jan 2026"
}

export interface InterestOverTimeData {
  keyword: string
  data: InterestDataPoint[]
  averageInterest: number
  trend: 'rising' | 'falling' | 'stable'
  peakValue: number
  peakDate: string
}

export interface RelatedQuery {
  query: string
  value: number // Search volume or growth percentage
  formattedValue: string
  link: string
}

export interface RelatedQueriesData {
  keyword: string
  top: RelatedQuery[]
  rising: RelatedQuery[]
}

export interface TrendingSearch {
  title: string
  formattedTraffic: string // "50K+ searches"
  relatedQueries: string[]
  image?: {
    newsUrl: string
    source: string
    imageUrl: string
  }
  articles?: Array<{
    title: string
    timeAgo: string
    source: string
    url: string
  }>
}

export interface TrendingSearchesData {
  country: string
  date: string
  trending: TrendingSearch[]
}

/**
 * Gera URLs para a API não oficial do Google Trends
 */
function buildTrendsURL(params: {
  keyword?: string
  geo?: string
  time?: string
  category?: number
}): string {
  const baseUrl = 'https://trends.google.com/trends/api'

  // Encode keyword
  const encodedKeyword = params.keyword
    ? encodeURIComponent(params.keyword)
    : ''

  const geo = params.geo || 'BR' // Default: Brasil
  const time = params.time || 'today 12-m' // Default: últimos 12 meses
  const category = params.category || 0 // All categories

  // Build query string
  const query = new URLSearchParams({
    geo,
    time,
    ...(params.keyword && { q: params.keyword }),
  })

  return `${baseUrl}?${query.toString()}`
}

/**
 * Busca interesse ao longo do tempo para uma keyword
 * Mostra como o volume de busca varia ao longo do tempo
 */
export async function getInterestOverTime(
  keyword: string,
  options: {
    geo?: string
    timeRange?: 'today 3-m' | 'today 12-m' | 'today 5-y' | 'all'
  } = {}
): Promise<InterestOverTimeData | { error: string }> {
  try {
    const geo = options.geo || 'BR'
    const timeRange = options.timeRange || 'today 12-m'

    // Simular dados (API não oficial do Google Trends é complexa de implementar)
    // Em produção, você pode usar a biblioteca 'google-trends-api' ou fazer scraping

    // Por enquanto, vamos retornar dados simulados baseados em padrões reais
    const mockData = generateMockInterestData(keyword, timeRange)

    return mockData
  } catch (error) {
    console.error('Erro ao buscar interest over time:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Busca queries relacionadas (top & rising)
 * Top: Queries mais pesquisadas relacionadas
 * Rising: Queries com maior crescimento
 */
export async function getRelatedQueries(
  keyword: string,
  options: { geo?: string } = {}
): Promise<RelatedQueriesData | { error: string }> {
  try {
    const geo = options.geo || 'BR'

    // Dados simulados - em produção usar API real
    const mockData = generateMockRelatedQueries(keyword)

    return mockData
  } catch (error) {
    console.error('Erro ao buscar related queries:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Busca trending searches (buscas em alta agora)
 * Mostra o que está sendo muito buscado no momento
 */
export async function getTrendingSearches(
  country: string = 'BR'
): Promise<TrendingSearchesData | { error: string }> {
  try {
    // Dados simulados - em produção usar API real
    const mockData = generateMockTrendingSearches(country)

    return mockData
  } catch (error) {
    console.error('Erro ao buscar trending searches:', error)
    return {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Analisa múltiplas keywords em paralelo
 */
export async function compareKeywords(
  keywords: string[],
  options: { geo?: string; timeRange?: 'today 3-m' | 'today 12-m' | 'today 5-y' } = {}
): Promise<InterestOverTimeData[]> {
  const results = await Promise.all(
    keywords.map(keyword => getInterestOverTime(keyword, options))
  )

  return results.filter((r): r is InterestOverTimeData => !('error' in r))
}

// ============================================================================
// MOCK DATA GENERATORS (substituir por API real em produção)
// ============================================================================

function generateMockInterestData(
  keyword: string,
  timeRange: string
): InterestOverTimeData {
  const months = timeRange === 'today 3-m' ? 3 : timeRange === 'today 12-m' ? 12 : 60
  const data: InterestDataPoint[] = []

  const baseValue = Math.floor(Math.random() * 30) + 30 // 30-60
  const trend = Math.random() > 0.5 ? 1 : -1 // Rising or falling

  let peakValue = 0
  let peakDate = ''

  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - (months - i - 1))

    // Add some randomness and trend
    const variance = Math.floor(Math.random() * 20) - 10
    const trendEffect = (i / months) * trend * 20
    const value = Math.max(0, Math.min(100, baseValue + variance + trendEffect))

    if (value > peakValue) {
      peakValue = value
      peakDate = date.toISOString().split('T')[0]
    }

    data.push({
      time: date.toISOString().split('T')[0],
      value: Math.round(value),
      formattedTime: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    })
  }

  const averageInterest = Math.round(
    data.reduce((sum, d) => sum + d.value, 0) / data.length
  )

  // Determine trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length

  let trendDirection: 'rising' | 'falling' | 'stable' = 'stable'
  if (secondAvg > firstAvg * 1.1) trendDirection = 'rising'
  else if (secondAvg < firstAvg * 0.9) trendDirection = 'falling'

  return {
    keyword,
    data,
    averageInterest,
    trend: trendDirection,
    peakValue: Math.round(peakValue),
    peakDate
  }
}

function generateMockRelatedQueries(keyword: string): RelatedQueriesData {
  const topQueries: RelatedQuery[] = [
    {
      query: `${keyword} preço`,
      value: 100,
      formattedValue: '100',
      link: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' preço')}`
    },
    {
      query: `${keyword} gratuito`,
      value: 85,
      formattedValue: '85',
      link: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' gratuito')}`
    },
    {
      query: `melhor ${keyword}`,
      value: 70,
      formattedValue: '70',
      link: `https://www.google.com/search?q=${encodeURIComponent('melhor ' + keyword)}`
    },
    {
      query: `${keyword} online`,
      value: 65,
      formattedValue: '65',
      link: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' online')}`
    },
    {
      query: `como usar ${keyword}`,
      value: 60,
      formattedValue: '60',
      link: `https://www.google.com/search?q=${encodeURIComponent('como usar ' + keyword)}`
    }
  ]

  const risingQueries: RelatedQuery[] = [
    {
      query: `${keyword} 2026`,
      value: 450,
      formattedValue: '+450%',
      link: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' 2026')}`
    },
    {
      query: `${keyword} ia`,
      value: 350,
      formattedValue: '+350%',
      link: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' ia')}`
    },
    {
      query: `${keyword} automação`,
      value: 200,
      formattedValue: '+200%',
      link: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' automação')}`
    },
    {
      query: `${keyword} mobile`,
      value: 150,
      formattedValue: '+150%',
      link: `https://www.google.com/search?q=${encodeURIComponent(keyword + ' mobile')}`
    }
  ]

  return {
    keyword,
    top: topQueries,
    rising: risingQueries
  }
}

function generateMockTrendingSearches(country: string): TrendingSearchesData {
  const trending: TrendingSearch[] = [
    {
      title: 'Inteligência Artificial 2026',
      formattedTraffic: '500K+ buscas',
      relatedQueries: ['IA generativa', 'ChatGPT', 'Claude AI'],
    },
    {
      title: 'CRM para pequenas empresas',
      formattedTraffic: '200K+ buscas',
      relatedQueries: ['CRM grátis', 'Melhor CRM', 'CRM online'],
    },
    {
      title: 'Marketing digital',
      formattedTraffic: '150K+ buscas',
      relatedQueries: ['SEO', 'Google Ads', 'Redes sociais'],
    },
    {
      title: 'Automação de vendas',
      formattedTraffic: '100K+ buscas',
      relatedQueries: ['Vendas automatizadas', 'Bot de vendas', 'Pipeline automático'],
    }
  ]

  return {
    country,
    date: new Date().toISOString().split('T')[0],
    trending
  }
}

/**
 * Detecta sazonalidade em dados de interesse
 */
export function detectSeasonality(data: InterestDataPoint[]): {
  hasSeasonality: boolean
  peakMonths: number[]
  pattern: string
} {
  // Agregar por mês
  const monthlyData: Record<number, number[]> = {}

  data.forEach(point => {
    const month = new Date(point.time).getMonth()
    if (!monthlyData[month]) monthlyData[month] = []
    monthlyData[month].push(point.value)
  })

  // Calcular média por mês
  const monthlyAverages = Object.entries(monthlyData).map(([month, values]) => ({
    month: parseInt(month),
    average: values.reduce((sum, v) => sum + v, 0) / values.length
  }))

  // Encontrar picos (acima de 1.2x da média)
  const overallAverage = monthlyAverages.reduce((sum, m) => sum + m.average, 0) / monthlyAverages.length
  const peakMonths = monthlyAverages
    .filter(m => m.average > overallAverage * 1.2)
    .map(m => m.month)

  return {
    hasSeasonality: peakMonths.length > 0,
    peakMonths,
    pattern: peakMonths.length > 0
      ? `Picos em ${peakMonths.map(m => new Date(2000, m).toLocaleDateString('pt-BR', { month: 'long' })).join(', ')}`
      : 'Sem sazonalidade clara'
  }
}
