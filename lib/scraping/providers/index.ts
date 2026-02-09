/**
 * Scraping Providers Factory
 * 
 * Ordem de prioridade:
 * 1. Firecrawl (self-hosted no EasyPanel - gratuito, melhor qualidade)
 * 2. Hybrid Crawler (tenta scraping → fallback Places API)
 * 3. Google Places API (direta)
 * 4. CNPJ API (dados oficiais brasileiros)
 */

import { ScrapingProvider, ScrapingSearchParams, ScrapingSearchResult } from './base'
import { firecrawlProvider } from './firecrawl-provider'
import { hybridCrawlerProvider } from './hybrid-crawler'
import { googlePlacesProvider } from './google-places'
import { cnpjApiProvider } from './cnpj-api'
import logger from '@/lib/logger'

// Lista de providers em ordem de prioridade
const providers: ScrapingProvider[] = [
  firecrawlProvider,        // Prioridade 1: Self-hosted (melhor)
  hybridCrawlerProvider,    // Prioridade 2: Scraping/Places API
  googlePlacesProvider,     // Prioridade 3: API direta
  cnpjApiProvider,          // Prioridade 4: Sempre disponível
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

/**
 * Busca usando o melhor provider disponível
 */
export async function searchLeads(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
  const provider = getAvailableProvider()
  
  if (!provider) {
    throw new Error('Nenhum provider de prospecção disponível')
  }

  logger.info({ provider: provider.name, query: params.query }, 'Starting lead search')
  
  return await provider.search(params)
}

// Re-exportar tipos e providers
export * from './base'
export { firecrawlProvider, hybridCrawlerProvider, googlePlacesProvider, cnpjApiProvider }
