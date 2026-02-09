/**
 * Sirius Scraping Server Provider
 * 
 * Conecta ao nosso próprio servidor de scraping (Puppeteer)
 * Roda self-hosted no EasyPanel ou VPS
 * 
 * Para instalar no EasyPanel:
 * 1. Create Service → Docker
 * 2. Source: Git Repository
 * 3. Repository: (fork do projeto) ou upload direto
 * 4. Dockerfile: /scraping-server/Dockerfile
 * 5. Port: 3000
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import logger from '@/lib/logger'

const SCRAPER_URL = process.env.SIRIUS_SCRAPER_URL

export class SiriusScraperProvider implements ScrapingProvider {
  name = 'SIRIUS_SCRAPER'

  isConfigured(): boolean {
    return !!SCRAPER_URL
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    if (!SCRAPER_URL) {
      logger.error({}, 'SIRIUS_SCRAPER_URL not configured')
      throw new Error('SIRIUS_SCRAPER_URL not configured')
    }

    logger.info({ url: SCRAPER_URL, query: params.query, city: params.city }, 'Sirius scraper search started')

    try {
      const response = await fetch(`${SCRAPER_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: params.query,
          city: params.city,
          limit: params.limit || 10,
        }),
        // Timeout de 60 segundos (Puppeteer demora)
        signal: AbortSignal.timeout(60000),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Scraper error: ${error}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Search failed')
      }

      const leads: ScrapingLead[] = data.leads.map((l: any) => ({
        name: l.name,
        phone: l.phone,
        email: l.email,
        website: l.website,
        source: 'SIRIUS_SCRAPER',
      }))

      logger.info({ found: leads.length }, 'Sirius scraper search completed')

      return {
        leads,
        totalFound: leads.length,
        creditsUsed: leads.length,
        provider: this.name,
      }

    } catch (error: any) {
      logger.error({ 
        error: error.message, 
        code: error.code,
        cause: error.cause?.message,
        scraperUrl: SCRAPER_URL,
      }, 'Sirius scraper error')
      
      if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        throw new Error('Scraper timeout - o servidor demorou muito para responder. Tente novamente.')
      }
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
        throw new Error(`Não foi possível conectar ao scraper em ${SCRAPER_URL}. Verifique se o serviço está rodando.`)
      }
      
      throw error
    }
  }

  async scrapeUrl(url: string): Promise<{ phones: string[]; emails: string[] }> {
    if (!SCRAPER_URL) {
      throw new Error('SIRIUS_SCRAPER_URL not configured')
    }

    const response = await fetch(`${SCRAPER_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error('Scrape failed')
    }

    return await response.json()
  }
}

export const siriusScraperProvider = new SiriusScraperProvider()
