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

export async function getSEOMetrics(params?: SEOMetricsParams): Promise<SEOMetrics> {
  const searchConsole = await getSearchConsoleClient()
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://sirius.roilabs.com.br/'

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
