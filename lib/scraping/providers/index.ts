/**
 * Scraping Providers Factory
 * 
 * Ordem de prioridade:
 * 1. Sirius Scraper (nosso servidor self-hosted - GRATUITO)
 * 2. ScrapingBee (API paga com trial gratuito)
 * 3. Google Places API (gratuito até $200/mês)
 * 4. Hybrid Crawler (tenta scraping direto)
 * 5. CNPJ API (dados oficiais brasileiros)
 */

import { ScrapingProvider, ScrapingSearchParams, ScrapingSearchResult } from './base'
import { siriusScraperProvider } from './sirius-scraper-provider'
import { scrapingBeeProvider } from './scrapingbee-provider'
import { googlePlacesProvider } from './google-places'
import { hybridCrawlerProvider } from './hybrid-crawler'
import { cnpjApiProvider } from './cnpj-api'
import logger from '@/lib/logger'

// Lista de providers em ordem de prioridade
const providers: ScrapingProvider[] = [
  siriusScraperProvider,    // Prioridade 1: Nosso servidor (GRATUITO)
  scrapingBeeProvider,      // Prioridade 2: API paga (trial gratuito)
  googlePlacesProvider,     // Prioridade 3: API do Google
  hybridCrawlerProvider,    // Prioridade 4: Scraping direto
  cnpjApiProvider,          // Prioridade 5: Sempre disponível
]

export function getAvailableProvider(): ScrapingProvider | null {
  for (const provider of providers) {
    if (provider.isConfigured()) {
      return provider
    }
  }
  return null
}

export function getConfiguredProviders(): ScrapingProvider[] {
  return providers.filter(p => p.isConfigured())
}

export function isAnyProviderConfigured(): boolean {
  return true
}

export async function searchLeads(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
  const provider = getAvailableProvider()
  
  if (!provider) {
    throw new Error('Nenhum provider de prospecção disponível')
  }

  logger.info({ provider: provider.name, query: params.query }, 'Starting lead search')
  
  return await provider.search(params)
}

export * from './base'
export { siriusScraperProvider, scrapingBeeProvider, googlePlacesProvider, hybridCrawlerProvider, cnpjApiProvider }
