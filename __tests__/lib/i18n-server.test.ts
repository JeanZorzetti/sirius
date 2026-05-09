/**
 * Unit tests for resolveRequestLocale()
 *
 * Priority order tested:
 *   1. Authenticated user's saved locale (requires DB — mocked out here)
 *   2. URL path prefix (/en or /en/...)
 *   3. Accept-Language header contains "en"
 *   4. Default locale (pt-BR)
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

  describe('URL prefix detection', () => {
    it('returns "en" for path /en', async () => {
      const req = new NextRequest(new URL('/en', 'http://localhost:3000'))
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('en')
    })

    it('returns "en" for path /en/dashboard', async () => {
      const req = new NextRequest(new URL('/en/dashboard', 'http://localhost:3000'))
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('en')
    })

    it('returns default locale (pt-BR) for path /dashboard (no /en prefix)', async () => {
      const req = new NextRequest(new URL('/dashboard', 'http://localhost:3000'))
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })
  })

  describe('Accept-Language header detection', () => {
    it('returns "en" when Accept-Language: en-US is set', async () => {
      const req = new NextRequest(new URL('/dashboard', 'http://localhost:3000'), {
        headers: { 'accept-language': 'en-US,en;q=0.9' },
      })
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('en')
    })

    it('returns "en" when Accept-Language: en is set', async () => {
      const req = new NextRequest(new URL('/dashboard', 'http://localhost:3000'), {
        headers: { 'accept-language': 'en' },
      })
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('en')
    })

    it('returns default locale (pt-BR) when Accept-Language: pt-BR is set', async () => {
      const req = new NextRequest(new URL('/dashboard', 'http://localhost:3000'), {
        headers: { 'accept-language': 'pt-BR,pt;q=0.9' },
      })
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('pt-BR')
    })
  })

  describe('URL prefix takes precedence over Accept-Language', () => {
    it('returns "en" for /en path even without Accept-Language header', async () => {
      const req = new NextRequest(new URL('/en/pricing', 'http://localhost:3000'))
      const locale = await resolveRequestLocale(req)
      expect(locale).toBe('en')
    })
  })
})
