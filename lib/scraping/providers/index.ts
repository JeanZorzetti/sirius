/**
 * Scraping Providers Factory
 * 
 * Ordem de prioridade:
 * 1. Hybrid Crawler (tenta scraping → fallback para Places API)
 * 2. Google Places API (se configurada)
 * 3. CNPJ API (dados oficiais brasileiros)
 */

import { ScrapingProvider, ScrapingSearchParams, ScrapingSearchResult } from './base'
import { hybridCrawlerProvider } from './hybrid-crawler'
import { googlePlacesProvider } from './google-places'
import { cnpjApiProvider } from './cnpj-api'
import logger from '@/lib/logger'

// Lista de providers em ordem de prioridade
const providers: ScrapingProvider[] = [
  hybridCrawlerProvider,    // Tenta scraping, depois API
  googlePlacesProvider,     // API direta (se configurada)
  cnpjApiProvider,          // Sempre disponível
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
  return true // Sempre true, pelo menos o hybrid está disponível
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
export { hybridCrawlerProvider, googlePlacesProvider, cnpjApiProvider }
