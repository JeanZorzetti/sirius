/**
 * Scraping Providers Factory
 * 
 * Ordem de prioridade:
 * 1. Google Places (melhor qualidade, $200/mês grátis)
 * 2. CNPJ API (dados oficiais brasileiros, gratuito)
 * 3. OpenStreetMap (totalmente gratuito, dados limitados)
 */

import { ScrapingProvider, ScrapingSearchParams, ScrapingSearchResult } from './base'
import { googlePlacesProvider } from './google-places'
import { cnpjApiProvider } from './cnpj-api'
import { openStreetMapProvider } from './openstreetmap'
import logger from '@/lib/logger'

// Lista de providers em ordem de prioridade
const providers: ScrapingProvider[] = [
  googlePlacesProvider,
  cnpjApiProvider,
  openStreetMapProvider,
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
 */
export function isAnyProviderConfigured(): boolean {
  return providers.some(p => p.isConfigured())
}

/**
 * Busca usando o melhor provider disponível
 */
export async function searchLeads(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
  const provider = getAvailableProvider()
  
  if (!provider) {
    throw new Error('Nenhum provider de prospecção configurado. Configure GOOGLE_PLACES_API_KEY ou use CNPJ/OpenStreetMap (sempre disponível).')
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
  
  if (configured.length === 0) {
    throw new Error('Nenhum provider configurado')
  }

  const results = await Promise.allSettled(
    configured.map(p => p.search(params))
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
export { googlePlacesProvider, cnpjApiProvider, openStreetMapProvider }
