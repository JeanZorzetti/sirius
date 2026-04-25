import { google } from 'googleapis'

// Types
export interface SEOHistoryItem {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SEOKeyword {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SEOPage {
  page: string
  slug: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SEOMetrics {
  history: SEOHistoryItem[]
  keywords: SEOKeyword[]
  pages: SEOPage[]
  totals: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  dateRange: {
    startDate: string
    endDate: string
  }
}

export interface SEOMetricsParams {
  startDate?: string
  endDate?: string
}

export interface SEOCountryData {
  country: string
  countryName: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SEODeviceData {
  device: 'desktop' | 'mobile' | 'tablet'
  clicks: number
  impressions: number
  ctr: number
  position: number
  percentage: number
}

export interface SearchAppearanceData {
  type: string
  typeName: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  topQueries: Array<{
    query: string
    clicks: number
    impressions: number
  }>
}

export interface KeywordOpportunity {
  query: string
  page?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  opportunityType: 'page_2' | 'low_ctr'
  potentialClicks?: number
}

export interface KeywordOpportunitiesData {
  page2Keywords: KeywordOpportunity[]
  lowCTRKeywords: KeywordOpportunity[]
  totalPotential: number
}

// Get authenticated Search Console client
async function getSearchConsoleClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const projectId = process.env.GOOGLE_PROJECT_ID

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error('Missing Google Search Console credentials in environment variables')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
      project_id: projectId,
    },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })

  const searchConsole = google.searchconsole({
    version: 'v1',
    auth,
  })

  return searchConsole
}

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Get default date range (last 28 days)
function getDefaultDateRange() {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 1) // Yesterday (data delay)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 28)

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  }
}

// Validate date string format YYYY-MM-DD
function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

// Convert country code to country name
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    'bra': 'Brasil',
    'usa': 'Estados Unidos',
    'prt': 'Portugal',
    'arg': 'Argentina',
    'mex': 'México',
    'chl': 'Chile',
    'col': 'Colômbia',
    'per': 'Peru',
    'ury': 'Uruguai',
    'esp': 'Espanha',
    'gbr': 'Reino Unido',
    'fra': 'França',
    'deu': 'Alemanha',
    'ita': 'Itália',
    'can': 'Canadá',
    'aus': 'Austrália',
    'jpn': 'Japão',
    'chn': 'China',
    'ind': 'Índia',
    'rus': 'Rússia',
  }

  return countryNames[countryCode.toLowerCase()] || countryCode.toUpperCase()
}

// Convert search appearance type to readable name
function getSearchAppearanceName(type: string): string {
  const appearanceNames: Record<string, string> = {
    'AMP_BLUE_LINK': 'AMP (Links Azuis)',
    'AMP_TOP_STORIES': 'AMP Top Stories',
    'RICHCARD': 'Rich Cards',
    'VIDEO': 'Vídeos',
    'DISCOVERY': 'Google Discover',
    'WEB_LIGHT_RESULT': 'Web Light',
    'ANDROID_APP': 'App Android',
    'RECIPE': 'Receitas',
    'JOB_LISTING': 'Vagas de Emprego',
    'SPECIAL_ANNOUNCEMENT': 'Anúncios Especiais',
  }

  return appearanceNames[type] || type
}

export async function getSEOMetrics(params?: SEOMetricsParams): Promise<SEOMetrics> {
  const searchConsole = await getSearchConsoleClient()
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://siriuscrm.com.br/'

  // Use provided dates or fall back to defaults
  const defaultRange = getDefaultDateRange()
  const startDate = params?.startDate && isValidDate(params.startDate)
    ? params.startDate
    : defaultRange.startDate
  const endDate = params?.endDate && isValidDate(params.endDate)
    ? params.endDate
    : defaultRange.endDate

  // Execute all queries in parallel
  const [historyResponse, keywordsResponse, pagesResponse] = await Promise.all([
    // 1. History: Clicks and Impressions by date
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
        rowLimit: 1000,
      },
    }),

    // 2. Top Keywords: Top 10 queries
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 10,
      },
    }),

    // 3. Performance of Niches: Top 20 pages with "/solucoes/"
    searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'contains',
                expression: '/solucoes/',
              },
            ],
          },
        ],
        rowLimit: 20,
      },
    }),
  ])

  // Process history data
  const history: SEOHistoryItem[] = (historyResponse.data.rows || []).map((row) => ({
    date: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: (row.ctr || 0) * 100,
    position: row.position || 0,
  })).sort((a, b) => a.date.localeCompare(b.date))

  // Process keywords data
  const keywords: SEOKeyword[] = (keywordsResponse.data.rows || []).map((row) => ({
    query: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: (row.ctr || 0) * 100,
    position: row.position || 0,
  }))

  // Process pages data
  const pages: SEOPage[] = (pagesResponse.data.rows || []).map((row) => {
    const fullUrl = row.keys?.[0] || ''
    const slug = fullUrl.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '')

    return {
      page: fullUrl,
      slug,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: (row.ctr || 0) * 100,
      position: row.position || 0,
    }
  })

  // Calculate totals
  const totals = history.reduce(
    (acc, item) => ({
      clicks: acc.clicks + item.clicks,
      impressions: acc.impressions + item.impressions,
      ctr: 0,
      position: 0,
    }),
    { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  )

  // Calculate average CTR and position
  if (totals.impressions > 0) {
    totals.ctr = (totals.clicks / totals.impressions) * 100
  }

  if (history.length > 0) {
    totals.position = history.reduce((sum, item) => sum + item.position, 0) / history.length
  }

  return {
    history,
    keywords,
    pages,
    totals,
    dateRange: {
      startDate,
      endDate,
    },
  }
}

/**
 * Get SEO metrics breakdown by country
 */
export async function getSEOByCountry(params?: SEOMetricsParams): Promise<SEOCountryData[]> {
  const searchConsole = await getSearchConsoleClient()
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://siriuscrm.com.br/'

  const defaultRange = getDefaultDateRange()
  const startDate = params?.startDate && isValidDate(params.startDate)
    ? params.startDate
    : defaultRange.startDate
  const endDate = params?.endDate && isValidDate(params.endDate)
    ? params.endDate
    : defaultRange.endDate

  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['country'],
      rowLimit: 20,
    },
  })

  const countries: SEOCountryData[] = (response.data.rows || []).map((row) => ({
    country: row.keys?.[0] || '',
    countryName: getCountryName(row.keys?.[0] || ''),
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: (row.ctr || 0) * 100,
    position: row.position || 0,
  }))

  return countries
}

/**
 * Get SEO metrics breakdown by device
 */
export async function getSEOByDevice(params?: SEOMetricsParams): Promise<SEODeviceData[]> {
  const searchConsole = await getSearchConsoleClient()
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://siriuscrm.com.br/'

  const defaultRange = getDefaultDateRange()
  const startDate = params?.startDate && isValidDate(params.startDate)
    ? params.startDate
    : defaultRange.startDate
  const endDate = params?.endDate && isValidDate(params.endDate)
    ? params.endDate
    : defaultRange.endDate

  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['device'],
      rowLimit: 10,
    },
  })

  const devices: SEODeviceData[] = (response.data.rows || []).map((row) => ({
    device: row.keys?.[0] as 'desktop' | 'mobile' | 'tablet',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: (row.ctr || 0) * 100,
    position: row.position || 0,
    percentage: 0, // Will be calculated after
  }))

  // Calculate percentages
  const totalClicks = devices.reduce((sum, d) => sum + d.clicks, 0)
  devices.forEach((device) => {
    device.percentage = totalClicks > 0 ? (device.clicks / totalClicks) * 100 : 0
  })

  return devices
}

/**
 * Get search appearances (rich results, AMP, video, etc.)
 */
export async function getSearchAppearances(
  params?: SEOMetricsParams
): Promise<SearchAppearanceData[]> {
  const searchConsole = await getSearchConsoleClient()
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://siriuscrm.com.br/'

  const defaultRange = getDefaultDateRange()
  const startDate = params?.startDate && isValidDate(params.startDate)
    ? params.startDate
    : defaultRange.startDate
  const endDate = params?.endDate && isValidDate(params.endDate)
    ? params.endDate
    : defaultRange.endDate

  // First, get all search appearance types
  const appearanceTypesResponse = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['searchAppearance'],
      rowLimit: 50,
    },
  })

  const appearances: SearchAppearanceData[] = []

  // For each appearance type, get top queries
  for (const row of appearanceTypesResponse.data.rows || []) {
    const appearanceType = row.keys?.[0] || ''

    // Get top 5 queries for this appearance type
    const queriesResponse = await searchConsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'searchAppearance',
                operator: 'equals',
                expression: appearanceType,
              },
            ],
          },
        ],
        rowLimit: 5,
      },
    })

    appearances.push({
      type: appearanceType,
      typeName: getSearchAppearanceName(appearanceType),
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: (row.ctr || 0) * 100,
      position: row.position || 0,
      topQueries: (queriesResponse.data.rows || []).map((queryRow) => ({
        query: queryRow.keys?.[0] || '',
        clicks: queryRow.clicks || 0,
        impressions: queryRow.impressions || 0,
      })),
    })
  }

  // Sort by impressions (most visible first)
  return appearances.sort((a, b) => b.impressions - a.impressions)
}

/**
 * Get keyword opportunities (page 2 keywords and low CTR keywords)
 */
export async function getKeywordOpportunities(
  params?: SEOMetricsParams
): Promise<KeywordOpportunitiesData> {
  const searchConsole = await getSearchConsoleClient()
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://siriuscrm.com.br/'

  const defaultRange = getDefaultDateRange()
  const startDate = params?.startDate && isValidDate(params.startDate)
    ? params.startDate
    : defaultRange.startDate
  const endDate = params?.endDate && isValidDate(params.endDate)
    ? params.endDate
    : defaultRange.endDate

  // Query 1: Keywords on page 2 (position 11-20) - Quick wins
  const page2Response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 50,
    },
  })

  // Filter for page 2 positions (11-20)
  const page2Keywords: KeywordOpportunity[] = (page2Response.data.rows || [])
    .filter((row) => {
      const position = row.position || 0
      return position > 10 && position <= 20
    })
    .map((row) => {
      const currentPosition = row.position || 0
      const currentCTR = (row.ctr || 0) * 100
      const impressions = row.impressions || 0

      // Estimate potential clicks if moved to position 5 (assume 5% CTR)
      const potentialCTR = 5
      const potentialClicks = Math.round((impressions * potentialCTR) / 100)

      return {
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions,
        ctr: currentCTR,
        position: currentPosition,
        opportunityType: 'page_2' as const,
        potentialClicks,
      }
    })
    .sort((a, b) => (b.potentialClicks || 0) - (a.potentialClicks || 0))
    .slice(0, 20)

  // Query 2: Keywords with high impressions but low CTR
  const lowCTRResponse = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 100,
    },
  })

  // Filter for high impressions (>50) but low CTR (<2%)
  const lowCTRKeywords: KeywordOpportunity[] = (lowCTRResponse.data.rows || [])
    .filter((row) => {
      const impressions = row.impressions || 0
      const ctr = (row.ctr || 0) * 100
      const position = row.position || 0
      return impressions > 50 && ctr < 2 && position <= 10 // Only top 10 positions
    })
    .map((row) => {
      const currentCTR = (row.ctr || 0) * 100
      const impressions = row.impressions || 0

      // Estimate potential clicks with improved CTR (3%)
      const targetCTR = 3
      const potentialClicks = Math.round((impressions * targetCTR) / 100)

      return {
        query: row.keys?.[0] || '',
        page: row.keys?.[1],
        clicks: row.clicks || 0,
        impressions,
        ctr: currentCTR,
        position: row.position || 0,
        opportunityType: 'low_ctr' as const,
        potentialClicks,
      }
    })
    .sort((a, b) => (b.potentialClicks || 0) - (a.potentialClicks || 0))
    .slice(0, 20)

  // Calculate total potential
  const totalPotential =
    page2Keywords.reduce((sum, k) => sum + (k.potentialClicks || 0), 0) +
    lowCTRKeywords.reduce((sum, k) => sum + (k.potentialClicks || 0), 0)

  return {
    page2Keywords,
    lowCTRKeywords,
    totalPotential,
  }
}
