/**
 * OpenStreetMap / Nominatim Provider
 * 
 * Totalmente gratuito, dados abertos (Open Database License)
 * Rate limit: 1 requisição/segundo
 * Documentação: https://nominatim.org/release-docs/develop/api/Search/
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import logger from '@/lib/logger'

const BASE_URL = 'https://nominatim.openstreetmap.org'

export class OpenStreetMapProvider implements ScrapingProvider {
  name = 'OPENSTREETMAP'

  isConfigured(): boolean {
    // Sempre disponível, é uma API pública gratuita
    return true
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    logger.info({ query: params.query, city: params.city }, 'OpenStreetMap search started')

    // Buscar locais
    const places = await this.searchPlaces(params)
    
    const leads: ScrapingLead[] = []
    
    for (const place of places.slice(0, params.limit || 20)) {
      const lead = this.normalizeToLead(place)
      // OpenStreetMap raramente tem telefone/email, mas vamos tentar
      if (lead.phone || lead.website) {
        leads.push(lead)
      }
    }

    logger.info({ found: leads.length }, 'OpenStreetMap search completed')

    return {
      leads,
      totalFound: leads.length,
      creditsUsed: leads.length,
      provider: this.name,
    }
  }

  private async searchPlaces(params: ScrapingSearchParams): Promise<any[]> {
    const url = new URL(`${BASE_URL}/search`)
    url.searchParams.set('q', params.city ? `${params.query} ${params.city}` : params.query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('extratags', '1') // inclui telefone, website se disponível
    url.searchParams.set('limit', String(params.limit || 20))
    url.searchParams.set('countrycodes', 'br') // Brasil apenas
    
    // User-Agent obrigatório pela política de uso
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'SiriusCRM/1.0 (contato@roilabs.com.br)',
        'Accept-Language': 'pt-BR',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`)
    }

    return await response.json()
  }

  private normalizeToLead(place: any): ScrapingLead {
    const address = place.address || {}
    
    return {
      name: place.display_name?.split(',')[0] || 'Sem nome',
      phone: place.extratags?.phone || place.extratags?.['contact:phone'],
      email: place.extratags?.email || place.extratags?.['contact:email'],
      website: place.extratags?.website || place.extratags?.['contact:website'],
      address: place.display_name,
      category: place.type || place.class,
      city: address.city || address.town || address.municipality,
      state: address.state,
      source: 'OPENSTREETMAP',
      externalId: place.place_id,
    }
  }
}

export const openStreetMapProvider = new OpenStreetMapProvider()
