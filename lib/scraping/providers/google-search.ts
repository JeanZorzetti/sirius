/**
 * Google Custom Search Provider
 * 
 * Busca no Google e extrai dados de sites de empresas
 * Gratuito: 100 queries/dia
 * 
 * Crie em: https://programmablesearchengine.google.com/controlpanel/create
 * E https://developers.google.com/custom-search/v1/overview
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import logger from '@/lib/logger'

const API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID
const BASE_URL = 'https://www.googleapis.com/customsearch/v1'

export class GoogleSearchProvider implements ScrapingProvider {
  name = 'GOOGLE_CUSTOM_SEARCH'

  isConfigured(): boolean {
    return !!API_KEY && !!SEARCH_ENGINE_ID
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    if (!this.isConfigured()) {
      throw new Error('GOOGLE_CUSTOM_SEARCH_API_KEY e GOOGLE_SEARCH_ENGINE_ID são necessários')
    }

    logger.info({ query: params.query, city: params.city }, 'Google Custom Search started')

    // Buscar empresas
    const searchQuery = params.city 
      ? `${params.query} ${params.city} contato telefone email`
      : `${params.query} contato telefone email`

    const results = await this.searchGoogle(searchQuery, params.limit || 10)
    
    const leads: ScrapingLead[] = []
    
    for (const item of results) {
      try {
        const lead = await this.extractLeadFromResult(item)
        if (lead && (lead.phone || lead.email)) {
          leads.push(lead)
        }
      } catch (error) {
        logger.warn({ url: item.link, error }, 'Failed to extract lead')
      }
    }

    return {
      leads,
      totalFound: leads.length,
      creditsUsed: leads.length,
      provider: this.name,
    }
  }

  private async searchGoogle(query: string, limit: number): Promise<any[]> {
    const url = new URL(BASE_URL)
    url.searchParams.set('key', API_KEY!)
    url.searchParams.set('cx', SEARCH_ENGINE_ID!)
    url.searchParams.set('q', query)
    url.searchParams.set('num', String(Math.min(limit, 10)))
    url.searchParams.set('hl', 'pt-BR')
    url.searchParams.set('gl', 'br')

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Search error: ${error}`)
    }

    const data = await response.json()
    return data.items || []
  }

  private async extractLeadFromResult(item: any): Promise<ScrapingLead | null> {
    const title = item.title || ''
    const snippet = item.snippet || ''
    const url = item.link || ''

    // Extrair nome da empresa do título
    const name = title.split(/[-|]/)[0].trim() || 'Empresa'

    // Extrair telefone do snippet
    const phone = this.extractPhone(snippet + ' ' + (item.pagemap?.metatags?.[0]?.['og:phone_number'] || ''))
    
    // Extrair email do snippet
    const email = this.extractEmail(snippet)

    return {
      name,
      phone,
      email,
      website: url,
      address: undefined,
      category: undefined,
      city: undefined,
      state: undefined,
      source: 'GOOGLE_SEARCH',
    }
  }

  private extractPhone(text: string): string | undefined {
    // Regex para telefones brasileiros
    const patterns = [
      /\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}/g, // (11) 99999-9999
      /\d{2}[\s-]?\d{4,5}[\s-]?\d{4}/g, // 11 99999-9999
    ]

    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches && matches.length > 0) {
        return this.cleanPhone(matches[0])
      }
    }
    return undefined
  }

  private extractEmail(text: string): string | undefined {
    const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const matches = text.match(pattern)
    
    if (matches && matches.length > 0) {
      // Filtrar emails genéricos
      const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
      const valid = matches.find(e => !genericDomains.some(d => e.toLowerCase().includes(d)))
      return valid || matches[0]
    }
    return undefined
  }

  private cleanPhone(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '')
    if (!cleaned.startsWith('55') && cleaned.length >= 10) {
      return '55' + cleaned
    }
    return cleaned
  }
}

export const googleSearchProvider = new GoogleSearchProvider()
