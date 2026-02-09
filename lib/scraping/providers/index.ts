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
  googlePlacesProvider,     // Prioridade 2: API do Google (confiável)
  scrapingBeeProvider,      // Prioridade 3: API paga (trial)
  hybridCrawlerProvider,    // Prioridade 4: Scraping direto
  cnpjApiProvider,          // Prioridade 5: Sempre disponível
]

/**
 * Busca com fallback automático
 * Se o primeiro falhar, tenta o próximo
 */
export async function searchLeadsWithFallback(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
  const errors: string[] = []
  
  for (const provider of providers) {
    if (!provider.isConfigured()) continue
    
    try {
      logger.info({ provider: provider.name }, 'Trying provider')
      const result = await provider.search(params)
      logger.info({ provider: provider.name, found: result.leads.length }, 'Provider succeeded')
      return result
    } catch (error: any) {
      logger.warn({ provider: provider.name, error: error.message }, 'Provider failed')
      errors.push(`${provider.name}: ${error.message}`)
      continue // Tentar próximo
    }
  }
  
  // Nenhum funcionou
  throw new Error(`Todos os providers falharam: ${errors.join('; ')}`)
}

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
 * Com fallback automático se o primeiro falhar
 */
export async function searchLeads(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
  return await searchLeadsWithFallback(params)
}

export * from './base'
export { siriusScraperProvider, scrapingBeeProvider, googlePlacesProvider, hybridCrawlerProvider, cnpjApiProvider }
