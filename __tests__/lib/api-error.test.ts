/**
 * Unit tests for apiError()
 *
 * apiError(key, status, opts?) returns a NextResponse with:
 *   - { error: <translated message> } as JSON body
 *   - the given HTTP status code
 *
 * Locale resolution:
 *   - opts.locale provided  → uses that locale directly (no session/header lookup)
 *   - no opts               → resolveRequestLocale() → falls back to 'pt-BR' (default)
 */

import { vi } from 'vitest'
import type { Mock } from 'vitest'

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

import { apiError } from '@/lib/api-error'
import { getSession } from '@/lib/auth'

const mockGetSession = getSession as Mock

describe('apiError()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // No authenticated session — forces fallback to default locale
    mockGetSession.mockResolvedValue(null)
  })

  describe('default locale (pt-BR)', () => {
    it('returns Portuguese error message when no locale is specified', async () => {
      const response = await apiError('unauthorized', 401)
      const body = await response.json()

      expect(body.error).toBe('Não autorizado')
    })

    it('returns 401 status for unauthorized', async () => {
      const response = await apiError('unauthorized', 401)
      expect(response.status).toBe(401)
    })

    it('returns Portuguese message for forbidden with no locale', async () => {
      const response = await apiError('forbidden', 403)
      const body = await response.json()

      expect(body.error).toBe('Acesso negado')
    })
  })

  // Locale EN aposentado (spec 004): o bloco que afirmava mensagem em inglês saiu.
  // O que sobrevive dele — status 403 e 404 — continua coberto abaixo, em pt-BR.
  describe('status codes', () => {
    it('returns 403 status for forbidden', async () => {
      const response = await apiError('forbidden', 403, { locale: 'pt-BR' })
      expect(response.status).toBe(403)
    })

    it('returns 404 status and message for notFound', async () => {
      const response = await apiError('notFound', 404, { locale: 'pt-BR' })
      const body = await response.json()

      expect(body.error).toBe('Não encontrado')
      expect(response.status).toBe(404)
    })
  })

  describe('explicit locale: pt-BR', () => {
    it('returns Portuguese error message when locale is explicitly "pt-BR"', async () => {
      const response = await apiError('unauthorized', 401, { locale: 'pt-BR' })
      const body = await response.json()

      expect(body.error).toBe('Não autorizado')
    })
  })

  describe('response shape', () => {
    it('returns JSON with "error" key', async () => {
      const response = await apiError('badRequest', 400, { locale: 'pt-BR' })
      const body = await response.json()

      expect(body).toHaveProperty('error')
      expect(typeof body.error).toBe('string')
      expect(body.error).toBe('Requisição inválida')
    })

    it('uses the provided status code', async () => {
      const response = await apiError('internalError', 500, { locale: 'pt-BR' })
      expect(response.status).toBe(500)
    })
  })
})
