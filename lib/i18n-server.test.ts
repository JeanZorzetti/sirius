import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('next-intl', () => ({
  createTranslator: vi.fn((opts: { locale: string; messages: Record<string, unknown>; namespace: string }) => {
    const ns = opts.messages[opts.namespace] as Record<string, string> | undefined
    return (key: string) => ns?.[key] ?? key
  }),
}))

import { resolveRequestLocale, resolveUserLocale, invalidateLocaleCache } from './i18n-server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockGetSession = vi.mocked(getSession)
const mockFindUnique = vi.mocked(prisma.user.findUnique)

function makeRequest(opts: { pathname?: string; acceptLanguage?: string } = {}) {
  return {
    nextUrl: { pathname: opts.pathname ?? '/' },
    headers: {
      get: (h: string) => (h === 'accept-language' ? (opts.acceptLanguage ?? null) : null),
    },
  } as unknown as import('next/server').NextRequest
}

describe('resolveRequestLocale', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // No authenticated session by default
    mockGetSession.mockResolvedValue(null)
  })

  // Locale EN aposentado (spec 004): nenhum sinal de entrada pode mais produzir
  // outro idioma. Estes três testes afirmavam o contrário e foram invertidos.
  it('ignores a legacy /en URL prefix', async () => {
    const locale = await resolveRequestLocale(makeRequest({ pathname: '/en/pricing' }))
    expect(locale).toBe('pt-BR')
  })

  it('ignores a bare /en pathname', async () => {
    const locale = await resolveRequestLocale(makeRequest({ pathname: '/en' }))
    expect(locale).toBe('pt-BR')
  })

  it('ignores Accept-Language: en', async () => {
    const locale = await resolveRequestLocale(makeRequest({ acceptLanguage: 'en-US,en;q=0.9' }))
    expect(locale).toBe('pt-BR')
  })

  it('returns pt-BR (default) for Accept-Language: pt-BR', async () => {
    const locale = await resolveRequestLocale(makeRequest({ acceptLanguage: 'pt-BR,pt;q=0.9' }))
    expect(locale).toBe('pt-BR')
  })

  it('returns pt-BR (default) when no Accept-Language and no prefix', async () => {
    const locale = await resolveRequestLocale(makeRequest())
    expect(locale).toBe('pt-BR')
  })

  it('returns pt-BR (default) with no request argument', async () => {
    const locale = await resolveRequestLocale()
    expect(locale).toBe('pt-BR')
  })

  it('authenticated user locale is what decides', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', email: 'a@b.com' } } as never)
    mockFindUnique.mockResolvedValue({ locale: 'pt-BR' } as never)
    // Even though URL says /en, user's saved locale wins
    const locale = await resolveRequestLocale(makeRequest({ pathname: '/en/pricing' }))
    expect(locale).toBe('pt-BR')
  })

  it('falls back to pt-BR when the session user locale lookup fails', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-2', email: 'a@b.com' } } as never)
    mockFindUnique.mockRejectedValue(new Error('DB down'))
    const locale = await resolveRequestLocale(makeRequest({ pathname: '/en/pricing' }))
    expect(locale).toBe('pt-BR')
  })
})

describe('resolveUserLocale cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateLocaleCache('user-cache-test')
  })

  it('returns locale from DB on first call', async () => {
    mockFindUnique.mockResolvedValue({ locale: 'pt-BR' } as never)
    const locale = await resolveUserLocale('user-cache-test')
    expect(locale).toBe('pt-BR')
    expect(mockFindUnique).toHaveBeenCalledTimes(1)
  })

  it('returns cached locale on second call without hitting DB again', async () => {
    mockFindUnique.mockResolvedValue({ locale: 'pt-BR' } as never)
    await resolveUserLocale('user-cache-test')
    await resolveUserLocale('user-cache-test')
    expect(mockFindUnique).toHaveBeenCalledTimes(1)
  })

  // FR-008: a coluna User.locale ainda guarda 'en' de antes da aposentadoria.
  // Sem a validação, esse valor seria casteado e só falharia depois, no import()
  // de messages/en/*.json — que não existe mais.
  it('falls back to pt-BR for a stale en value stored in the DB', async () => {
    mockFindUnique.mockResolvedValue({ locale: 'en' } as never)
    invalidateLocaleCache('user-stale-en')
    const locale = await resolveUserLocale('user-stale-en')
    expect(locale).toBe('pt-BR')
  })

  it('defaults to pt-BR when user not found', async () => {
    mockFindUnique.mockResolvedValue(null)
    invalidateLocaleCache('user-missing')
    const locale = await resolveUserLocale('user-missing')
    expect(locale).toBe('pt-BR')
  })
})
