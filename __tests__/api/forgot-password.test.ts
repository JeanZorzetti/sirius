/**
 * TESTES DA ROTA FORGOT PASSWORD
 * ===============================
 *
 * Esta rota é CRÍTICA para segurança:
 * - Não deve revelar se email existe (user enumeration)
 * - Deve ter rate limiting (prevenir spam)
 * - Deve enviar email de reset apenas para usuários válidos
 *
 * Coverage Target: 100%
 * Priority: ALTA (segurança + UX crítica)
 */

import { vi } from 'vitest'

// Mock do Resend (deve ser antes do import da rota)
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = {
        send: async () => ({ id: 'mock-email-id', success: true }),
      }
    },
  }
})

// Mock do Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

// Mock do logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock do rate limiting
vi.mock('@/lib/ratelimit', () => ({
  authRateLimit: vi.fn().mockResolvedValue(null), // null = não bloqueado
}))

import { POST } from '@/app/api/auth/forgot-password/route'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authRateLimit } from '@/lib/ratelimit'

function createRequest(email: string, ip: string = '127.0.0.1'): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
  })

  return request
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Security - User Enumeration', () => {
    it('should return same response for valid email', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
        id: '123',
        email: 'exists@example.com',
        name: 'Test User',
      })
      ;(prisma.passwordResetToken.deleteMany as vi.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.passwordResetToken.create as vi.Mock).mockResolvedValue({
        token: 'reset-token-123',
      })

      const request = createRequest('exists@example.com')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return same response for non-existent email (prevent enumeration)', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)

      const request = createRequest('notexists@example.com')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // IMPORTANTE: Não deve revelar que o email não existe!
    })

    it('should NOT send email for non-existent user', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)

      const request = createRequest('notexists@example.com')
      await POST(request)

      // Token NÃO deve ser criado
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled()
    })

    it('should send email for valid user', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
        id: '123',
        email: 'exists@example.com',
        name: 'Test User',
      })
      ;(prisma.passwordResetToken.deleteMany as vi.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.passwordResetToken.create as vi.Mock).mockResolvedValue({
        token: 'reset-token-123',
        email: 'exists@example.com',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })

      const request = createRequest('exists@example.com')
      await POST(request)

      expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1)
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'exists@example.com',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      ;(authRateLimit as vi.Mock).mockResolvedValueOnce(
        NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
      )

      const request = createRequest('test@example.com', '192.168.1.1')
      const response = await POST(request)

      expect(response.status).toBe(429)

      const data = await response.json()
      expect(data.error).toContain('tentativas')
    })

    it('should allow request when under rate limit', async () => {
      ;(authRateLimit as vi.Mock).mockResolvedValueOnce(null) // null = não bloqueado
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      })
      ;(prisma.passwordResetToken.deleteMany as vi.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.passwordResetToken.create as vi.Mock).mockResolvedValue({
        token: 'reset-token',
      })

      const request = createRequest('test@example.com')
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should use IP address for rate limiting', async () => {
      ;(authRateLimit as vi.Mock).mockResolvedValueOnce(null)
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      })
      ;(prisma.passwordResetToken.deleteMany as vi.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.passwordResetToken.create as vi.Mock).mockResolvedValue({
        token: 'token',
      })

      const request = createRequest('test@example.com', '192.168.1.100')
      await POST(request)

      expect(authRateLimit).toHaveBeenCalledWith(request)
    })
  })

  describe('Validation', () => {
    it('should return 400 for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Email')
    })

    it('should accept valid email format', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)

      const validEmails = [
        'test@example.com',
        'user+tag@domain.co.uk',
        'first.last@company.com',
      ]

      for (const email of validEmails) {
        const request = createRequest(email)
        const response = await POST(request)

        expect(response.status).toBe(200)
      }
    })
  })

  describe('Token Generation', () => {
    it('should create reset token in database', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      })
      ;(prisma.passwordResetToken.deleteMany as vi.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.passwordResetToken.create as vi.Mock).mockResolvedValue({
        token: 'reset-token-123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })

      const request = createRequest('test@example.com')
      await POST(request)

      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    })

    it('should generate unique token', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      })
      ;(prisma.passwordResetToken.deleteMany as vi.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.passwordResetToken.create as vi.Mock).mockResolvedValue({
        token: 'unique-token',
      })

      const request = createRequest('test@example.com')
      await POST(request)

      const createCall = (prisma.passwordResetToken.create as vi.Mock).mock.calls[0][0]
      const token = createCall.data.token

      expect(token).toBeDefined()
      expect(token.length).toBeGreaterThan(20) // Token deve ser longo (32 bytes hex = 64 chars)
    })

    it('should set token expiration to 1 hour', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      })
      ;(prisma.passwordResetToken.deleteMany as vi.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.passwordResetToken.create as vi.Mock).mockResolvedValue({
        token: 'token',
      })

      const request = createRequest('test@example.com')
      const before = Date.now()
      await POST(request)
      const after = Date.now()

      const createCall = (prisma.passwordResetToken.create as vi.Mock).mock.calls[0][0]
      const expiresAt = createCall.data.expiresAt.getTime()

      // Expiração deve ser ~1h no futuro
      const expectedExpiration = before + 60 * 60 * 1000
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000)
      expect(expiresAt).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 1000)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockRejectedValue(new Error('DB Error'))

      const request = createRequest('test@example.com')
      const response = await POST(request)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})
