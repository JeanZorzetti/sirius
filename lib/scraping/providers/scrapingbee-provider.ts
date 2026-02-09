/**
 * ScrapingBee Provider
 * 
 * API de scraping com plano gratuito (200 créditos)
 * Site: https://www.scrapingbee.com/
 * 
 * Plano gratuito: 200 requisições
 * Pago: $49/mês para 1000 requisições
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import logger from '@/lib/logger'

const API_KEY = process.env.SCRAPINGBEE_API_KEY
const BASE_URL = 'https://app.scrapingbee.com/api/v1'

export class ScrapingBeeProvider implements ScrapingProvider {
  name = 'SCRAPINGBEE'

  isConfigured(): boolean {
    return !!API_KEY
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    if (!API_KEY) {
      throw new Error('SCRAPINGBEE_API_KEY not configured')
    }

    logger.info({ query: params.query, city: params.city }, 'ScrapingBee search started')

    // Buscar no Google via ScrapingBee
    const searchQuery = params.city 
      ? `${params.query} ${params.city} telefone contato`
      : `${params.query} telefone contato`

    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=20&hl=pt-BR`

    try {
      const html = await this.scrapeUrl(googleUrl)
      const leads = this.parseGoogleResults(html)

      logger.info({ found: leads.length }, 'ScrapingBee search completed')

      return {
        leads,
        totalFound: leads.length,
        creditsUsed: leads.length,
        provider: this.name,
      }

    } catch (error: any) {
      logger.error({ error: error.message }, 'ScrapingBee error')
      throw error
    }
  }

  private async scrapeUrl(url: string): Promise<string> {
    const apiUrl = new URL(`${BASE_URL}/`)
    apiUrl.searchParams.set('api_key', API_KEY!)
    apiUrl.searchParams.set('url', url)
    apiUrl.searchParams.set('premium_proxy', 'true')
    apiUrl.searchParams.set('country_code', 'br')

    const response = await fetch(apiUrl.toString())

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ScrapingBee error: ${response.status} - ${error}`)
    }

    return response.text()
  }

  private parseGoogleResults(html: string): ScrapingLead[] {
    // Regex para extrair resultados do Google
    const leads: ScrapingLead[] = []
    
    // Padrão: <h3>Título</h3> ... <a href="URL"> ... snippet ...
    const titlePattern = /<h3[^>]*>([^<]+)<\/h3>/g
    const linkPattern = /<a[^>]*href="([^"]+)"[^>]*>/g
    
    const titles: string[] = []
    let match
    
    while ((match = titlePattern.exec(html)) !== null) {
      titles.push(match[1].trim())
    }

    // Extrair telefones e emails do HTML
    const phonePattern = /\(?\d{2}\)?[\s.-]?(?:9\d{4}|\d{4})[\s.-]?\d{4}/g
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi

    const phones = html.match(phonePattern) || []
    const emails = html.match(emailPattern) || []

    // Criar leads (simplificado)
    for (let i = 0; i < Math.min(titles.length, 10); i++) {
      const title = titles[i]
      const phone = phones[i] ? this.cleanPhone(phones[i]) : undefined
      const email = emails[i]

      if (phone || email) {
        leads.push({
          name: title.substring(0, 100),
          phone,
          email,
          source: 'SCRAPINGBEE',
        })
      }
    }

    return leads
  }

  private cleanPhone(phone: string): string {
    const cleaned = phone.replace(/[^\d]/g, '')
    if (!cleaned.startsWith('55') && cleaned.length >= 10) {
      return '55' + cleaned
    }
    return cleaned
  }
}

export const scrapingBeeProvider = new ScrapingBeeProvider()
