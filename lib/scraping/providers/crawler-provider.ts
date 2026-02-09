/**
 * Proprietary Crawler Provider
 * 
 * Usa nosso próprio sistema de scraping com Cheerio
 * 100% gratuito, código aberto, ético, compatível com Vercel
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import { crawlAll } from '../crawler/simple-crawler'
import logger from '@/lib/logger'

export class CrawlerProvider implements ScrapingProvider {
  name = 'SIRIUS_CRAWLER'

  isConfigured(): boolean {
    // Sempre disponível - é nosso próprio sistema
    return true
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    logger.info({ query: params.query, city: params.city }, 'Crawler search started')

    const startTime = Date.now()
    
    // Executar crawling
    const crawledLeads = await crawlAll({
      query: params.query,
      city: params.city,
      maxResults: params.limit || 20,
    })

    const duration = Date.now() - startTime

    // Converter para formato padrão
    const leads: ScrapingLead[] = crawledLeads.map(l => ({
      name: l.name,
      phone: l.phone,
      email: l.email,
      website: l.website,
      address: l.address,
      city: l.city,
      state: l.state,
      category: l.category,
      source: l.source,
    }))

    logger.info({ 
      found: leads.length, 
      duration: `${duration}ms`,
    }, 'Crawler search completed')

    return {
      leads,
      totalFound: leads.length,
      creditsUsed: leads.length,
      provider: this.name,
    }
  }
}

export const crawlerProvider = new CrawlerProvider()
