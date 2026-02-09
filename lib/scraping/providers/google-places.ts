/**
 * Google Places API Provider
 * 
 * Gratuito: $200 USD em créditos mensais
 * ~10,000 requisições de place details por mês
 * Documentação: https://developers.google.com/maps/documentation/places/web-service/overview
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import logger from '@/lib/logger'

const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const BASE_URL = 'https://maps.googleapis.com/maps/api/place'

export class GooglePlacesProvider implements ScrapingProvider {
  name = 'GOOGLE_PLACES'

  isConfigured(): boolean {
    return !!API_KEY
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    if (!API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY not configured')
    }

    logger.info({ query: params.query, city: params.city }, 'Google Places search started')

    // Build search query
    const searchQuery = params.city 
      ? `${params.query} em ${params.city}`
      : params.query

    // Step 1: Text Search para encontrar lugares
    const places = await this.textSearch(searchQuery, params.limit || 20)
    
    // Step 2: Place Details para cada lugar (pegar telefone, site, etc)
    const leads: ScrapingLead[] = []
    
    for (const place of places) {
      try {
        const details = await this.getPlaceDetails(place.place_id)
        const lead = this.normalizeToLead(details, place)
        if (lead.phone || lead.email) { // Só incluir se tiver contato
          leads.push(lead)
        }
      } catch (error) {
        logger.warn({ placeId: place.place_id, error }, 'Failed to get place details')
      }
    }

    logger.info({ found: leads.length }, 'Google Places search completed')

    return {
      leads,
      totalFound: leads.length,
      creditsUsed: leads.length, // 1 crédito por lead com contato
      provider: this.name,
    }
  }

  private async textSearch(query: string, maxResults: number): Promise<any[]> {
    const url = new URL(`${BASE_URL}/textsearch/json`)
    url.searchParams.set('query', query)
    url.searchParams.set('key', API_KEY!)
    url.searchParams.set('language', 'pt-BR')
    url.searchParams.set('region', 'br')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places error: ${data.status} - ${data.error_message || ''}`)
    }

    return (data.results || []).slice(0, maxResults)
  }

  private async getPlaceDetails(placeId: string): Promise<any> {
    const url = new URL(`${BASE_URL}/details/json`)
    url.searchParams.set('place_id', placeId)
    url.searchParams.set('key', API_KEY!)
    url.searchParams.set('language', 'pt-BR')
    url.searchParams.set('fields', 'name,formatted_phone_number,international_phone_number,website,formatted_address,types,url,vicinity')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Place details error: ${data.status}`)
    }

    return data.result
  }

  private normalizeToLead(details: any, place: any): ScrapingLead {
    // Extrair cidade/estado do endereço
    const addressParts = details.formatted_address?.split(',') || []
    const city = addressParts[addressParts.length - 3]?.trim() || ''
    const stateZip = addressParts[addressParts.length - 2]?.trim() || ''
    const state = stateZip.split(' ')[0] || ''

    return {
      name: details.name,
      phone: this.cleanPhone(details.international_phone_number || details.formatted_phone_number),
      email: undefined, // Google Places não fornece email
      website: details.website,
      address: details.formatted_address,
      category: details.types?.[0]?.replace(/_/g, ' '),
      city,
      state,
      source: 'GOOGLE_PLACES',
      externalId: place.place_id,
    }
  }

  private cleanPhone(phone: string | undefined): string | undefined {
    if (!phone) return undefined
    // Remover tudo exceto dígitos e +
    let cleaned = phone.replace(/[^\d+]/g, '')
    // Garantir formato brasileiro
    if (cleaned.startsWith('+55')) {
      cleaned = cleaned.substring(1) // remover o +
    }
    if (!cleaned.startsWith('55') && cleaned.length >= 10) {
      cleaned = '55' + cleaned
    }
    return cleaned
  }
}

export const googlePlacesProvider = new GooglePlacesProvider()
