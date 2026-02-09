/**
 * Base interface for scraping providers
 */

export interface ScrapingLead {
  name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  category?: string
  city?: string
  state?: string
  source: string
  externalId?: string
}

export interface ScrapingSearchParams {
  query: string
  city?: string
  state?: string
  category?: string
  limit?: number
}

export interface ScrapingSearchResult {
  leads: ScrapingLead[]
  totalFound: number
  creditsUsed: number
  provider: string
}

export interface ScrapingProvider {
  name: string
  isConfigured(): boolean
  search(params: ScrapingSearchParams): Promise<ScrapingSearchResult>
}
