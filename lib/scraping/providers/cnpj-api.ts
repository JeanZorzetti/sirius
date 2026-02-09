/**
 * CNPJ API Provider - Dados oficiais brasileiros
 * 
 * APIs gratuitas disponíveis:
 * - cnpj.ws (3 consultas/segundo, gratuito)
 * - receitaws.com.br (3 consultas/minuto, gratuito)
 * - minhareceita.org (sem limites documentados, open source)
 * 
 * Este provider faz busca por termo e retorna empresas reais do Brasil
 */

import { ScrapingProvider, ScrapingLead, ScrapingSearchParams, ScrapingSearchResult } from './base'
import logger from '@/lib/logger'

const CNPJ_WS_TOKEN = process.env.CNPJ_WS_TOKEN // opcional, para mais requisições

export class CNPJApiProvider implements ScrapingProvider {
  name = 'CNPJ_API'

  isConfigured(): boolean {
    // Sempre disponível pois usa APIs públicas
    return true
  }

  async search(params: ScrapingSearchParams): Promise<ScrapingSearchResult> {
    logger.info({ query: params.query, city: params.city }, 'CNPJ API search started')

    // Buscar CNPJs por termo usando minhareceita.org (open source)
    const cnpjs = await this.searchCNPJs(params)
    
    const leads: ScrapingLead[] = []
    
    for (const cnpj of cnpjs.slice(0, params.limit || 10)) {
      try {
        const company = await this.getCompanyData(cnpj)
        if (company && this.isValidCompany(company)) {
          leads.push(this.normalizeToLead(company))
        }
      } catch (error) {
        logger.warn({ cnpj, error }, 'Failed to get company data')
      }
    }

    logger.info({ found: leads.length }, 'CNPJ API search completed')

    return {
      leads,
      totalFound: leads.length,
      creditsUsed: leads.length,
      provider: this.name,
    }
  }

  private async searchCNPJs(params: ScrapingSearchParams): Promise<string[]> {
    // minhareceita.org permite busca por termo
    const term = encodeURIComponent(params.query)
    const url = `https://minhareceita.org/${term}`

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        // Fallback: tentar buscar no Google e extrair CNPJs (simulado)
        return this.simulateCNPJSearch(params)
      }

      const data = await response.json()
      
      // Se retornar array de CNPJs
      if (Array.isArray(data)) {
        return data.map((item: any) => item.cnpj || item)
      }
      
      // Se retornar objeto único
      if (data.cnpj) {
        return [data.cnpj]
      }

      return []
    } catch (error) {
      return this.simulateCNPJSearch(params)
    }
  }

  private async getCompanyData(cnpj: string): Promise<any> {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
    
    // Tentar minhareceita.org primeiro (mais estável)
    try {
      const response = await fetch(`https://minhareceita.org/${cleanCNPJ}`, {
        headers: { 'Accept': 'application/json' },
      })
      
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      logger.warn({ cnpj }, 'minhareceita failed, trying receitaws')
    }

    // Fallback para receitaws
    try {
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
        headers: { 'Accept': 'application/json' },
      })
      
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      logger.warn({ cnpj }, 'receitaws failed')
    }

    return null
  }

  private isValidCompany(company: any): boolean {
    // Filtrar empresas sem contato ou situação inválida
    if (company.situacao && company.situacao !== 'ATIVA') {
      return false
    }
    return true
  }

  private normalizeToLead(company: any): ScrapingLead {
    const telefone = this.formatPhone(company.ddd_telefone_1 || company.telefone)
    const email = company.email

    return {
      name: company.razao_social || company.nome,
      phone: telefone,
      email: email,
      website: undefined,
      address: [
        company.logradouro,
        company.numero,
        company.bairro,
        company.municipio,
        company.uf,
      ].filter(Boolean).join(', '),
      category: company.cnae_fiscal_descricao || company.atividade_principal?.[0]?.text,
      city: company.municipio,
      state: company.uf,
      source: 'CNPJ_RECEITA',
      externalId: company.cnpj,
    }
  }

  private formatPhone(phone: string | undefined): string | undefined {
    if (!phone) return undefined
    const cleaned = phone.replace(/[^\d]/g, '')
    if (cleaned.length >= 10) {
      return '55' + cleaned
    }
    return cleaned
  }

  // Fallback quando API de busca não funciona
  private async simulateCNPJSearch(params: ScrapingSearchParams): Promise<string[]> {
    // Por enquanto, retorna vazio - em produção poderia usar
    // scraping controlado ou outra fonte
    logger.warn({ query: params.query }, 'CNPJ search API unavailable, returning empty')
    return []
  }
}

export const cnpjApiProvider = new CNPJApiProvider()
