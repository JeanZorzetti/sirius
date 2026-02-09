/**
 * Firecrawl Provider (Self-Hosted)
 * 
 * Firecrawl é um serviço de scraping/crawling open source
 * que pode ser self-hosted no EasyPanel (template oficial)
 * 
 * Features:
 * - Web search integrado (busca no Google)
 * - Anti-bot mechanisms
 * - JavaScript rendering (Playwright)
 * - Gratuito e open source
 * 
 * Instalação EasyPanel: Templates → Firecrawl → Install
 * Docs: https://docs.firecrawl.dev/
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import logger from '@/lib/logger'

const FIRECRAWL_URL = process.env.FIRECRAWL_URL
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'optional'

export class FirecrawlProvider implements ScrapingProvider {
  name = 'FIRECRAWL'

  isConfigured(): boolean {
    return !!FIRECRAWL_URL
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    if (!FIRECRAWL_URL) {
      throw new Error('FIRECRAWL_URL not configured')
    }

    logger.info({ query: params.query, city: params.city }, 'Firecrawl search started')

    // Usar a API de search do Firecrawl
    const searchQuery = params.city 
      ? `${params.query} ${params.city}`
      : params.query

    try {
      // 1. Buscar no Google via Firecrawl
      const searchResults = await this.searchWeb(searchQuery, params.limit || 10)
      
      const leads: ScrapingLead[] = []
      
      // 2. Extrair dados de cada resultado
      for (const result of searchResults) {
        try {
          const lead = await this.extractFromUrl(result.url || result.link)
          if (lead && (lead.phone || lead.email)) {
            leads.push({
              ...lead,
              name: lead.name || result.title || 'Empresa',
              source: 'FIRECRAWL',
            })
          }
        } catch (error) {
          logger.warn({ url: result.url, error }, 'Failed to extract from URL')
        }
      }

      logger.info({ found: leads.length }, 'Firecrawl search completed')

      return {
        leads,
        totalFound: leads.length,
        creditsUsed: leads.length,
        provider: this.name,
      }

    } catch (error: any) {
      logger.error({ error: error.message }, 'Firecrawl error')
      throw error
    }
  }

  /**
   * Busca na web usando Firecrawl
   */
  private async searchWeb(query: string, limit: number): Promise<any[]> {
    const url = `${FIRECRAWL_URL}/v1/search`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        limit,
        lang: 'pt',
        country: 'BR',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Firecrawl search error: ${error}`)
    }

    const data = await response.json()
    return data.data || []
  }

  /**
   * Extrai dados de uma URL
   */
  private async extractFromUrl(url: string): Promise<Partial<ScrapingLead>> {
    const apiUrl = `${FIRECRAWL_URL}/v1/scrape`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 2000, // aguardar JS renderizar
      }),
    })

    if (!response.ok) {
      throw new Error(`Scrape error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.data?.markdown || ''
    const title = data.data?.metadata?.title || ''

    return {
      name: this.extractName(title),
      phone: this.extractPhone(content + ' ' + title),
      email: this.extractEmail(content),
      website: url,
    }
  }

  private extractName(title: string): string {
    return title.split(/[-|]/)[0].trim().substring(0, 100)
  }

  private extractPhone(text: string): string | undefined {
    const patterns = [
      /\(?\d{2}\)?[\s.-]?(?:9\d{4}|\d{4})[\s.-]?\d{4}/g,
    ]

    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        const cleaned = matches[0].replace(/[^\d]/g, '')
        if (!cleaned.startsWith('55') && cleaned.length >= 10) {
          return '55' + cleaned
        }
        return cleaned
      }
    }
    return undefined
  }

  private extractEmail(text: string): string | undefined {
    const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
    const matches = text.match(pattern)
    
    if (matches && matches.length > 0) {
      const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
      const corporate = matches.find(e => 
        !genericDomains.some(d => e.toLowerCase().includes(d))
      )
      return corporate || matches[0]
    }
    return undefined
  }
}

export const firecrawlProvider = new FirecrawlProvider()
