/**
 * Hybrid Crawler Provider
 * 
 * 1. Tenta scraping do Google (gratuito)
 * 2. Se bloqueado e GOOGLE_PLACES_API_KEY configurado, usa Places API
 * 3. Se não configurado, retorna mensagem informativa
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import { crawlAll } from '../crawler/simple-crawler'
import { googlePlacesProvider } from './google-places'
import logger from '@/lib/logger'

export class HybridCrawlerProvider implements ScrapingProvider {
  name = 'HYBRID_CRAWLER'

  isConfigured(): boolean {
    // Sempre "configurado" pois tenta scraping primeiro
    return true
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    logger.info({ query: params.query, city: params.city }, 'Hybrid search started')

    // PASSO 1: Tentar scraping
    const scrapedLeads = await crawlAll({
      query: params.query,
      city: params.city,
      maxResults: params.limit || 20,
    })

    // Se encontrou leads com scraping, retorna
    if (scrapedLeads.length > 0) {
      logger.info({ count: scrapedLeads.length, source: 'SCRAPING' }, 'Using scraping results')
      return {
        leads: scrapedLeads.map(l => ({
          name: l.name,
          phone: l.phone,
          email: l.email,
          website: l.website,
          address: l.address,
          city: l.city,
          state: l.state,
          category: l.category,
          source: l.source,
        })),
        totalFound: scrapedLeads.length,
        creditsUsed: scrapedLeads.length,
        provider: 'SIRIUS_CRAWLER',
      }
    }

    logger.warn({}, 'Scraping returned 0 results (likely blocked by Google)')

    // PASSO 2: Tentar Google Places API (se configurada)
    if (googlePlacesProvider.isConfigured()) {
      logger.info({}, 'Falling back to Google Places API')
      return await googlePlacesProvider.search(params)
    }

    // PASSO 3: Retornar vazio com instruções
    logger.warn({}, 'No API configured, returning empty with instructions')
    
    // Lançar erro especial que a UI vai interpretar
    throw new Error(
      'GOOGLE_PLACES_API_REQUIRED: O Google bloqueou o scraping. ' +
      'Para continuar buscando leads, configure GOOGLE_PLACES_API_KEY ' +
      '(gratuito até $200/mês). Entre em contato com o suporte.'
    )
  }
}

export const hybridCrawlerProvider = new HybridCrawlerProvider()
