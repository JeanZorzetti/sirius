/**
 * Simple Crawler using Cheerio
 * 
 * Versão leve compatível com Vercel Serverless
 * Sem Crawlee (muito pesado), apenas cheerio + fetch
 */

import * as cheerio from 'cheerio'
import logger from '@/lib/logger'

export interface ScrapedLead {
  name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  state?: string
  category?: string
  source: string
  sourceUrl: string
  scrapedAt: string
}

export interface CrawlParams {
  query: string
  city?: string
  maxResults?: number
}

// Rate limiting simples
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Busca no Google e extrai dados dos resultados
 */
export async function searchGoogle(params: CrawlParams): Promise<ScrapedLead[]> {
  const leads: ScrapedLead[] = []
  const searchQuery = params.city 
    ? `${params.query} ${params.city} telefone contato`
    : `${params.query} telefone contato`

  logger.info({ query: searchQuery }, 'Google search started')

  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=20&hl=pt-BR`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    logger.info({ status: response.status }, 'Google response received')

    if (!response.ok) {
      throw new Error(`Google returned ${response.status}`)
    }

    const html = await response.text()
    
    // Log do tamanho do HTML para debug
    logger.info({ htmlLength: html.length }, 'HTML received')

    // Verificar se é página de verificação/bloqueio
    if (html.includes('detected unusual traffic') || 
        html.includes('sua pesquisa') === false ||
        html.includes('recaptcha') ||
        html.includes('before continuing')) {
      logger.warn({}, 'Google blocked or showing verification page')
      return []
    }

    const $ = cheerio.load(html)

    // Tentar múltiplos seletores que o Google usa
    const selectors = [
      'div.g',                           // Clássico
      'div.tF2Cxc',                      // Versão mais recente
      'div[data-header-feature]',        // Outra variação
      'div[data-result-index]',          // Estrutura data-attr
      'div.v7W49e',                      // Novo layout 2024
      'div.MjjYud',                      // Outra variação
    ]

    let results = $('')
    for (const selector of selectors) {
      const found = $(selector)
      if (found.length > 0) {
        results = found
        logger.info({ selector: selector, count: found.length }, 'Found results with selector')
        break
      }
    }

    // Se ainda não encontrou, tentar buscar qualquer link com título
    if (results.length === 0) {
      logger.warn({}, 'No standard selectors matched, trying fallback')
      // Fallback: buscar h3 dentro de elementos que tenham links
      results = $('h3').parent().parent()
    }

    logger.info({ totalResults: results.length }, 'Processing results')

    results.each((_, elem) => {
      const $el = $(elem)
      
      // Tentar múltiplas formas de extrair título
      let title = $el.find('h3').first().text().trim() ||
                  $el.find('a h3').first().text().trim() ||
                  $el.find('[role="heading"]').first().text().trim()
      
      // Link
      let link = $el.find('a[href^="http"]').first().attr('href') ||
                 $el.find('a').first().attr('href')
      
      // Remover prefixos do Google
      if (link && link.startsWith('/url?q=')) {
        link = link.split('/url?q=')[1].split('&')[0]
      }

      // Snippet - múltiplos seletores
      const snippet = $el.find('.VwiC3b, .s3v94d, span:not([class])').text() ||
                      $el.find('[data-sncf]').text() ||
                      $el.text()

      logger.debug({ title: title?.substring(0, 50), hasLink: !!link }, 'Processing result')

      if (!title) return

      const phone = extractPhone(snippet + ' ' + title)
      const email = extractEmail(snippet)

      // Extrair website do link
      let website: string | undefined = undefined
      if (link && !link.includes('google.com')) {
        try {
          const url = new URL(link)
          website = url.origin
        } catch {
          website = link
        }
      }

      if (phone || email) {
        leads.push({
          name: normalizeName(title),
          phone,
          email,
          website,
          source: 'GOOGLE_SEARCH',
          sourceUrl: link || '',
          scrapedAt: new Date().toISOString(),
        })
        logger.info({ name: title.substring(0, 30), phone: !!phone, email: !!email }, 'Lead found')
      }
    })

    logger.info({ count: leads.length }, 'Google search completed')
    return leads

  } catch (error: any) {
    logger.error({ error: error.message }, 'Google search failed')
    return []
  }
}

/**
 * Busca em múltiplas fontes
 */
export async function crawlAll(params: CrawlParams): Promise<ScrapedLead[]> {
  const allLeads: ScrapedLead[] = []

  // Google Search
  try {
    const googleLeads = await searchGoogle(params)
    allLeads.push(...googleLeads)
  } catch (error) {
    logger.warn({ error }, 'Google search failed')
  }

  await delay(1000)

  return removeDuplicates(allLeads)
}

// Helpers
function extractPhone(text: string): string | undefined {
  if (!text) return undefined
  
  const patterns = [
    /\(?\d{2}\)?[\s.-]?(?:9\d{4}|\d{4})[\s.-]?\d{4}/g,
    /\d{2}[\s.-]?9?\d{4}[\s.-]?\d{4}/g,
  ]

  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      return cleanPhone(matches[0])
    }
  }
  return undefined
}

function extractEmail(text: string): string | undefined {
  if (!text) return undefined
  
  const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi
  const matches = text.match(pattern)
  
  if (matches && matches.length > 0) {
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com']
    const corporate = matches.find(e => 
      !genericDomains.some(d => e.toLowerCase().includes(d))
    )
    return corporate || matches[0]
  }
  return undefined
}

function cleanPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '')
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    return '55' + cleaned
  }
  return cleaned
}

function normalizeName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/\n/g, '')
    .trim()
    .substring(0, 100)
}

function removeDuplicates(leads: ScrapedLead[]): ScrapedLead[] {
  const seen = new Map<string, ScrapedLead>()
  
  for (const lead of leads) {
    const key = `${lead.name.toLowerCase().trim()}-${(lead.phone || '')}`
    
    if (!seen.has(key)) {
      seen.set(key, lead)
    } else {
      const existing = seen.get(key)!
      if (!existing.phone && lead.phone) existing.phone = lead.phone
      if (!existing.email && lead.email) existing.email = lead.email
    }
  }
  
  return Array.from(seen.values())
}
