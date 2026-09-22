import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/i18n-server', () => ({
  resolveRequestLocale: vi.fn(),
  t: vi.fn(),
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}))

import { apiError } from './api-error'
import { resolveRequestLocale, t } from '@/lib/i18n-server'

const mockResolveLocale = vi.mocked(resolveRequestLocale)
const mockT = vi.mocked(t)

describe('apiError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveLocale.mockResolvedValue('pt-BR')
    mockT.mockImplementation(async (_locale, _ns, key) => {
      const dict: Record<string, Record<string, string>> = {
        'pt-BR': { unauthorized: 'Não autorizado', notFound: 'Não encontrado' },
      }
      return dict[_locale]?.[key] ?? key
    })
  })

  it('returns Portuguese error by default (no locale override)', async () => {
    mockResolveLocale.mockResolvedValue('pt-BR')
    const res = await apiError('unauthorized', 401) as unknown as { body: { error: string }; status: number }
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Não autorizado')
  })

  // Locale EN aposentado (spec 004). Estes dois testes provavam "sai em inglês";
  // o que sobrou deles é o contrato de resolução, que continua valendo.
  it('does not call resolveRequestLocale when locale is passed explicitly', async () => {
    const res = await apiError('unauthorized', 401, { locale: 'pt-BR' }) as unknown as { body: { error: string }; status: number }
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Não autorizado')
    expect(mockResolveLocale).not.toHaveBeenCalled()
  })

  it('resolves the locale from the request when none is passed', async () => {
    mockResolveLocale.mockResolvedValue('pt-BR')
    const fakeReq = {} as import('next/server').NextRequest
    const res = await apiError('unauthorized', 401, { req: fakeReq }) as unknown as { body: { error: string }; status: number }
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Não autorizado')
    expect(mockResolveLocale).toHaveBeenCalledWith(fakeReq)
  })

  it('passes status code through correctly', async () => {
    const res = await apiError('notFound', 404) as unknown as { body: { error: string }; status: number }
    expect(res.status).toBe(404)
  })

  it('uses namespace "api" when calling t()', async () => {
    await apiError('unauthorized', 401, { locale: 'pt-BR' })
    expect(mockT).toHaveBeenCalledWith('pt-BR', 'api', 'unauthorized', undefined)
  })

  it('forwards interpolation params to t()', async () => {
    await apiError('unauthorized', 401, { locale: 'pt-BR', params: { field: 'email' } })
    expect(mockT).toHaveBeenCalledWith('pt-BR', 'api', 'unauthorized', { field: 'email' })
  })
})
