/**
 * Scraping Providers Factory
 * 
 * Ordem de prioridade:
 * 1. Crawler Próprio (SIRIUS_CRAWLER) - 100% gratuito, ético
 * 2. Google Places (melhor qualidade, $200/mês grátis)
 * 3. CNPJ API (dados oficiais brasileiros, gratuito)
 * 4. OpenStreetMap (totalmente gratuito, dados limitados)
 */

import { ScrapingProvider, ScrapingSearchParams, ScrapingSearchResult } from './base'
import { crawlerProvider } from './crawler-provider'
import { googlePlacesProvider } from './google-places'
import { cnpjApiProvider } from './cnpj-api'
import { openStreetMapProvider } from './openstreetmap'
import logger from '@/lib/logger'

// Lista de providers em ordem de prioridade
const providers: ScrapingProvider[] = [
  crawlerProvider,           // Nosso crawler próprio - sempre disponível
  googlePlacesProvider,      // Requer API key
  cnpjApiProvider,          // Sempre disponível
  openStreetMapProvider,    // Sempre disponível
]

/**
 * Retorna o primeiro provider configurado e disponível
 */
export function getAvailableProvider(): ScrapingProvider | null {
  for (const provider of providers) {
    if (provider.isConfigured()) {
      return provider
    }
  }
  return null
}

/**
 * Retorna todos os providers configurados
 */
export function getConfiguredProviders(): ScrapingProvider[] {
  return providers.filter(p => p.isConfigured())
}

/**
 * Verifica se existe algum provider configurado
 * (Sempre true pois o crawler próprio sempre está disponível)
 */
export function isAnyProviderConfigured(): boolean {
  return true
}

/**
 * Busca usando o melhor provider disponível
 * Por padrão usa nosso crawler próprio
 */
export async function searchLeads(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
  const provider = getAvailableProvider()
  
  if (!provider) {
    throw new Error('Nenhum provider de prospecção disponível')
  }

  logger.info({ provider: provider.name, query: params.query }, 'Starting lead search')
  
  return await provider.search(params)
}

/**
 * Busca usando múltiplos providers e combina resultados
 * (mais lento, mas mais completo)
 */
export async function searchLeadsMultiProvider(
  params: ScrapingSearchParams
): Promise<ScrapingSearchResult> {
  const configured = getConfiguredProviders()
  
  const results = await Promise.allSettled(
    configured.slice(0, 2).map(p => p.search(params)) // Limitar a 2 para não sobrecarregar
  )

  const allLeads: any[] = []
  let totalCredits = 0
  const usedProviders: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allLeads.push(...result.value.leads)
      totalCredits += result.value.creditsUsed
      usedProviders.push(configured[index].name)
    } else {
      logger.warn({ provider: configured[index].name, error: result.reason }, 'Provider failed')
    }
  })

  // Remover duplicados pelo nome/endereço
  const uniqueLeads = removeDuplicates(allLeads)

  return {
    leads: uniqueLeads,
    totalFound: uniqueLeads.length,
    creditsUsed: totalCredits,
    provider: usedProviders.join('+'),
  }
}

function removeDuplicates(leads: any[]): any[] {
  const seen = new Set<string>()
  return leads.filter(lead => {
    const key = `${lead.name.toLowerCase()}-${lead.city?.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Re-exportar tipos
export * from './base'
export { crawlerProvider, googlePlacesProvider, cnpjApiProvider, openStreetMapProvider }
