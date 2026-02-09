/**
 * Outscraper API Client (LEGADO)
 * 
 * @deprecated Use providers/ index.ts instead
 * Mantido para compatibilidade
 */

import { searchLeads, isAnyProviderConfigured } from './providers'

export interface OutscraperSearchParams {
  query: string
  limit?: number
}

export interface OutscraperLead {
  name: string
  phone?: string
  email?: string
  website?: string
  address?: string
  rating?: number
  reviews_count?: number
  category?: string
  google_maps_url?: string
}

export interface OutscraperJob {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  results?: OutscraperLead[]
  error?: string
}

/**
 * @deprecated Use searchLeads from providers/index.ts
 */
export async function searchGoogleMaps(params: OutscraperSearchParams): Promise<OutscraperJob> {
  const result = await searchLeads({
    query: params.query,
    limit: params.limit || 50,
  })

  return {
    jobId: `legacy-${Date.now()}`,
    status: 'completed',
    results: result.leads.map(l => ({
      name: l.name,
      phone: l.phone,
      email: l.email,
      website: l.website,
      address: l.address,
      category: l.category,
    })),
  }
}

/**
 * @deprecated Use isAnyProviderConfigured from providers/index.ts
 */
export function isOutscraperConfigured(): boolean {
  return isAnyProviderConfigured()
}
