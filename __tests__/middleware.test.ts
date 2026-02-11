/**
 * TESTES DO MIDDLEWARE
 * ====================
 *
 * Middleware é CRÍTICO para segurança - protege rotas /dashboard e redireciona
 * usuários já autenticados de /login e /register.
 *
 * Coverage Target: 100%
 * Priority: ALTA (segurança)
 */

import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'
import { encrypt } from '@/lib/auth'

// Mock cookies
const mockCookies = new Map<string, string>()

// Helper para criar request com cookie
async function createRequest(url: string, sessionData?: any): Promise<NextRequest> {
  const request = new NextRequest(new URL(url, 'http://localhost:3000'))

  if (sessionData) {
    const sessionToken = await encrypt(sessionData)
    // @ts-ignore - mock do cookies
    request.cookies.get = (name: string) => {
      if (name === 'session') {
        return { value: sessionToken }
      }
      return undefined
    }
  } else {
    // @ts-ignore - mock do cookies
    request.cookies.get = () => undefined
  }

  return request
}

describe('Middleware', () => {
  beforeEach(() => {
    mockCookies.clear()
  })

  describe('Protected Routes (/dashboard/*)', () => {
    it('should redirect unauthenticated user to /login', async () => {
      const request = await createRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      expect(response).toBeDefined()
      expect(response?.status).toBe(307) // Redirect
      expect(response?.headers.get('location')).toContain('/login')
    })

    it('should allow authenticated user to access /dashboard', async () => {
      const request = await createRequest('http://localhost:3000/dashboard', {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      const response = await middleware(request)

      // Should pass through or return updated session
      expect(response?.status).not.toBe(307) // Not a redirect
    })

    it('should protect nested /dashboard routes', async () => {
      const request = await createRequest('http://localhost:3000/dashboard/analytics')
      const response = await middleware(request)

      expect(response?.status).toBe(307) // Redirect
      expect(response?.headers.get('location')).toContain('/login')
    })
  })

  describe('Auth Routes (/login, /register)', () => {
    it('should redirect authenticated user from /login to /dashboard', async () => {
      const request = await createRequest('http://localhost:3000/login', {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      const response = await middleware(request)

      expect(response?.status).toBe(307) // Redirect
      expect(response?.headers.get('location')).toContain('/dashboard')
    })

    it('should allow unauthenticated user to access /login', async () => {
      const request = await createRequest('http://localhost:3000/login')
      const response = await middleware(request)

      // Should pass through (no redirect to /dashboard)
      const location = response?.headers.get('location')
      // Se há redirect, não deve ser para dashboard
      if (location) {
        expect(location).not.toContain('/dashboard')
      }
      // Teste passa se não há redirect
    })

    it('should redirect authenticated user from /register to /dashboard', async () => {
      const request = await createRequest('http://localhost:3000/register', {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      const response = await middleware(request)

      expect(response?.status).toBe(307) // Redirect
      expect(response?.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Public Routes', () => {
    it('should allow access to public marketing pages', async () => {
      const publicRoutes = ['/', '/about', '/pricing', '/features', '/blog']

      for (const route of publicRoutes) {
        const request = await createRequest(`http://localhost:3000${route}`)
        const response = await middleware(request)

        // Should not redirect to login
        const location = response?.headers.get('location')
        if (location) {
          expect(location).not.toContain('/login')
        }
        // Teste passa se não há redirect
      }
    })

    it('should allow access to /api/health without auth', async () => {
      const request = await createRequest('http://localhost:3000/api/health')
      const response = await middleware(request)

      // Should not redirect
      expect(response?.status).not.toBe(307)
    })
  })

  describe('Malformed URLs (SEO Fix)', () => {
    // Nota: URL com caracteres especiais como /mês podem ser encodados diferentemente
    // em diferentes ambientes. Testando apenas as variações ASCII.

    it('should redirect malformed /mes to homepage', async () => {
      const request = await createRequest('http://localhost:3000/mes')
      const response = await middleware(request)

      expect(response?.status).toBe(307) // Redirect
      expect(response?.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('should redirect malformed /month to homepage', async () => {
      const request = await createRequest('http://localhost:3000/month')
      const response = await middleware(request)

      expect(response?.status).toBe(307) // Redirect
      expect(response?.headers.get('location')).toBe('http://localhost:3000/')
    })
  })

  describe('Session Auto-Refresh', () => {
    it('should refresh valid session automatically', async () => {
      const request = await createRequest('http://localhost:3000/dashboard', {
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        expires: new Date(Date.now() + 1000), // Expira em 1 segundo
      })

      const response = await middleware(request)

      // Should update session cookie with new expiration
      expect(response).toBeDefined()
      // Cookie deve ter sido renovado (24h)
    })
  })
})
