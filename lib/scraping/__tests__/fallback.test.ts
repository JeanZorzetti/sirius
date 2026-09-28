import { describe, it, expect } from 'vitest'
import { searchLeadsWithFallback } from '../providers'
import type { ScrapingProvider } from '../providers/base'

const params = { query: 'dentistas em Goiânia' }

function provedor(name: string, search: ScrapingProvider['search']): ScrapingProvider {
  return { name, isConfigured: () => true, search }
}
const vazio = (name: string) =>
  provedor(name, async () => ({ leads: [], totalFound: 0, creditsUsed: 0, provider: name }))
const falha = (name: string, msg: string) =>
  provedor(name, async () => {
    throw new Error(msg)
  })
const acha = (name: string) =>
  provedor(name, async () => ({
    leads: [{ name: 'Clínica', phone: '5562999999999', source: name }],
    totalFound: 1,
    creditsUsed: 1,
    provider: name,
  }))

describe('searchLeadsWithFallback', () => {
  it('a blocked crawler followed by an empty CNPJ search is an error, not 0 leads', async () => {
    await expect(
      searchLeadsWithFallback(params, [
        falha('HYBRID_CRAWLER', 'GOOGLE_PLACES_API_REQUIRED: bloqueado'),
        vazio('CNPJ_API'),
      ]),
    ).rejects.toThrow('GOOGLE_PLACES_API_REQUIRED')
  })

  it('an empty provider hands over to the next one', async () => {
    const r = await searchLeadsWithFallback(params, [vazio('SIRIUS_SCRAPER'), acha('GOOGLE_PLACES')])
    expect(r.provider).toBe('GOOGLE_PLACES')
  })

  it('zero leads with no failure is a real empty answer', async () => {
    const r = await searchLeadsWithFallback(params, [vazio('GOOGLE_PLACES'), vazio('CNPJ_API')])
    expect(r.leads).toEqual([])
  })
})
