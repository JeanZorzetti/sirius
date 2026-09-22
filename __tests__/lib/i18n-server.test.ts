/**
 * Unit tests for resolveRequestLocale()
 *
 * O locale EN foi aposentado (spec 004), então os degraus 2 e 3 da antiga cadeia
 * de prioridade — prefixo /en na URL e Accept-Language — saíram da função. O que
 * estes testes provam agora é o inverso: nenhum sinal de entrada produz outro idioma.
 *
 *   1. Authenticated user's saved locale (requires DB — mocked out here)
 *   2. Default locale (pt-BR) para todo o resto
 */

import { vi } from 'vitest'
import type { Mock } from 'vitest'
import { NextRequest } from 'next/server'

// Mock DB and auth before importing the module under test
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

import { resolveRequestLocale } from '@/lib/i18n-server'
import { getSession } from '@/lib/auth'

const mockGetSession = getSession as Mock

describe('resolveRequestLocale()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // No authenticated session by default
    mockGetSession.mockResolvedValue(null)
  })

  describe('fallback — no session, no req', () => {
    it('returns default locale (pt-BR) when called with no arguments', async () => {
      const locale = await resolveRequestLocale()
      expect(locale).toBe('pt-BR')
    })
  })

  describe('URL prefix is no longer a locale signal', () => {
    it('returns pt-BR for a legacy /en path', async () => {
      const req = new NextRequest(new URL('/en', 'http://localhost:3000'))
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })

    it('returns pt-BR for a legacy /en/dashboard path', async () => {
      const req = new NextRequest(new URL('/en/dashboard', 'http://localhost:3000'))
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })

    it('returns default locale (pt-BR) for path /dashboard', async () => {
      const req = new NextRequest(new URL('/dashboard', 'http://localhost:3000'))
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })
  })

  describe('Accept-Language is no longer a locale signal', () => {
    it('returns pt-BR when Accept-Language: en-US is set', async () => {
      const req = new NextRequest(new URL('/dashboard', 'http://localhost:3000'), {
        headers: { 'accept-language': 'en-US,en;q=0.9' },
      })
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })

    it('returns pt-BR when Accept-Language: en is set', async () => {
      const req = new NextRequest(new URL('/dashboard', 'http://localhost:3000'), {
        headers: { 'accept-language': 'en' },
      })
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })

    it('returns default locale (pt-BR) when Accept-Language: pt-BR is set', async () => {
      const req = new NextRequest(new URL('/dashboard', 'http://localhost:3000'), {
        headers: { 'accept-language': 'pt-BR,pt;q=0.9' },
      })
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })
  })

  describe('nenhuma combinação de sinais produz outro idioma', () => {
    it('returns pt-BR for a legacy /en path with no Accept-Language header', async () => {
      const req = new NextRequest(new URL('/en/pricing', 'http://localhost:3000'))
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })
  })
})
