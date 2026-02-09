/**
 * Outscraper API Client
 * 
 * Integração com Outscraper para extração de leads do Google Maps
 */

import logger from '@/lib/logger'

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

const API_KEY = process.env.OUTSCRAPER_API_KEY

async function request<T>(endpoint: string): Promise<T> {
  if (!API_KEY) {
    throw new Error('OUTSCRAPER_API_KEY not configured')
  }

  const response = await fetch(`https://api.outscraper.com/v1${endpoint}`, {
    headers: { 'X-API-KEY': API_KEY },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Outscraper error: ${error}`)
  }

  return response.json()
}

export async function searchGoogleMaps(params: OutscraperSearchParams): Promise<OutscraperJob> {
  logger.info({ query: params.query }, 'Starting Google Maps search')

  const limit = params.limit || 50
  const data = await request<any>(
    `/google/maps/search?query=${encodeURIComponent(params.query)}&limit=${limit}&async=true`
  )

  // Se retornar array, é resultado imediato
  if (Array.isArray(data)) {
    return {
      jobId: `sync-${Date.now()}`,
      status: 'completed',
      results: normalizeResults(data),
    }
  }

  return {
    jobId: data.jobId || data.id,
    status: 'pending',
  }
}

export async function getJobResults(jobId: string): Promise<OutscraperJob> {
  const data = await request<any>(`/requests/${jobId}`)
  
  const statusMap: Record<string, any> = {
    'pending': 'pending', 'queued': 'pending', 'running': 'running',
    'processing': 'running', 'completed': 'completed', 'done': 'completed',
    'failed': 'failed', 'error': 'failed',
  }

  return {
    jobId,
    status: statusMap[data.status?.toLowerCase()] || 'pending',
    results: data.data ? normalizeResults(data.data) : undefined,
    error: data.error,
  }
}

function normalizeResults(data: any[]): OutscraperLead[] {
  return data.map(item => ({
    name: item.name || item.title || 'Sem nome',
    phone: cleanPhone(item.phone || item.phones?.[0]),
    email: item.email || item.emails?.[0],
    website: item.site || item.website,
    address: item.full_address || item.address,
    rating: item.rating ? parseFloat(item.rating) : undefined,
    reviews_count: item.reviews ? parseInt(item.reviews) : undefined,
    category: item.category || item.type,
    google_maps_url: item.link || item.url,
  }))
}

function cleanPhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (!cleaned.startsWith('55') && cleaned.length >= 10) {
    cleaned = '55' + cleaned
  }
  return cleaned
}

export function isOutscraperConfigured(): boolean {
  return !!API_KEY
}
