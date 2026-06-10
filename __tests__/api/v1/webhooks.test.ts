/**
 * TESTES DA API V1 DE WEBHOOKS
 * =============================
 *
 * Testa o sistema de webhooks com foco em:
 * - PRO/BUSINESS plan enforcement
 * - Isolamento entre organizações (multi-tenancy)
 * - Integração com Svix (serviço de webhooks)
 * - Validação de eventos válidos
 * - Proteção contra IDOR
 * - CRUD completo com sincronização Svix
 *
 * Coverage Target: 85%+
 * Priority: ALTA (integrações críticas)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { Mock } from 'vitest'

// Mock do Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    webhook: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock da auth
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

// Mock do logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock do Svix client
vi.mock('@/lib/webhooks/svix-client', () => ({
  createSvixEndpoint: vi.fn(),
  updateSvixEndpoint: vi.fn(),
  deleteSvixEndpoint: vi.fn(),
  getEndpointSecret: vi.fn(),
}))

// Mock dos events
vi.mock('@/lib/webhooks/events', () => ({
  getAllWebhookEvents: vi.fn(() => [
    'deal.created',
    'deal.updated',
    'contact.created',
    'contact.updated',
  ]),
}))

// Mock dos validators
vi.mock('@/lib/api-validators', () => ({
  validateRequest: async (req: any, _schema: any) => {
    try {
      const data = await req.json()
      return { success: true, data }
    } catch {
      return { success: true, data: {} }
    }
  },
  createWebhookSchema: {},
  updateWebhookSchema: {},
}))

import { GET as getWebhooks, POST as createWebhook } from '@/app/api/v1/webhooks/route'
import { GET as getWebhook, PATCH as updateWebhook, DELETE as deleteWebhook } from '@/app/api/v1/webhooks/[id]/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSvixEndpoint, updateSvixEndpoint, deleteSvixEndpoint, getEndpointSecret } from '@/lib/webhooks/svix-client'
import { getAllWebhookEvents } from '@/lib/webhooks/events'

function createRequest(body?: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/webhooks', {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'content-type': 'application/json',
    },
  })
}

const mockWebhook = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  url: 'https://api.example.com/webhooks',
  description: 'Webhook de teste',
  enabled: true,
  events: ['deal.created', 'deal.updated'],
  svixAppId: 'app_123',
  svixEndpointId: 'ep_123',
  organizationId: 'org-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  _count: { logs: 42 },
}

describe('GET /api/v1/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list webhooks for PRO organization', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'PRO' }
    })
    ;(prisma.webhook.findMany as Mock).mockResolvedValue([mockWebhook])

    const request = createRequest()
    const response = await getWebhooks(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.webhooks).toHaveLength(1)
    expect(data.webhooks[0].url).toBe('https://api.example.com/webhooks')
    expect(data.webhooks[0]._count.logs).toBe(42)
  })

  it('should return 401 when not authenticated', async () => {
    ;(getSession as Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await getWebhooks(request)

    expect(response.status).toBe(401)
  })

  it('should return 403 for FREE plan', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'FREE' }
    })

    const request = createRequest()
    const response = await getWebhooks(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('PRO')
  })

  it('should allow BUSINESS plan', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'BUSINESS' }
    })
    ;(prisma.webhook.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    const response = await getWebhooks(request)

    expect(response.status).toBe(200)
  })

  it('should filter by organizationId automatically', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'PRO' }
    })
    ;(prisma.webhook.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    await getWebhooks(request)

    expect(prisma.webhook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-123' }
      })
    )
  })

  it('should return 500 on database error', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await getWebhooks(request)

    expect(response.status).toBe(500)
  })
})

describe('POST /api/v1/webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create webhook with valid data', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'PRO', name: 'Test Org' }
    })
    ;(createSvixEndpoint as Mock).mockResolvedValue({
      svixAppId: 'app_123',
      svixEndpointId: 'ep_123',
    })
    ;(prisma.webhook.create as Mock).mockResolvedValue(mockWebhook)

    const request = createRequest({
      url: 'https://api.example.com/webhooks',
      description: 'Test webhook',
      events: ['deal.created', 'deal.updated'],
    })

    const response = await createWebhook(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.webhook.url).toBe('https://api.example.com/webhooks')
    expect(createSvixEndpoint).toHaveBeenCalledWith(
      'org-123',
      'Test Org',
      'https://api.example.com/webhooks',
      ['deal.created', 'deal.updated'],
      'Test webhook'
    )
  })

  it('should return 403 for FREE plan', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'FREE', name: 'Test Org' }
    })

    const request = createRequest({
      url: 'https://api.example.com/webhooks',
      events: ['deal.created'],
    })

    const response = await createWebhook(request)

    expect(response.status).toBe(403)
    expect(createSvixEndpoint).not.toHaveBeenCalled()
  })

  it('should reject invalid events', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'PRO', name: 'Test Org' }
    })

    const request = createRequest({
      url: 'https://api.example.com/webhooks',
      events: ['deal.created', 'invalid.event'],
    })

    const response = await createWebhook(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('inválidos')
    expect(data.details).toContain('invalid.event')
  })

  it('should return 500 if Svix creation fails', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'PRO', name: 'Test Org' }
    })
    ;(createSvixEndpoint as Mock).mockResolvedValue(null)

    const request = createRequest({
      url: 'https://api.example.com/webhooks',
      events: ['deal.created'],
    })

    const response = await createWebhook(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Svix')
    expect(prisma.webhook.create).not.toHaveBeenCalled()
  })
})

describe('GET /api/v1/webhooks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return webhook with secret', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(mockWebhook)
    ;(getEndpointSecret as Mock).mockResolvedValue('whsec_abc123')

    const request = createRequest()
    const response = await getWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.webhook.secret).toBe('whsec_abc123')
    expect(data.webhook.logsCount).toBe(42)
  })

  it('should return 404 for non-existent webhook', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await getWebhook(request, { params: Promise.resolve({ id: '770e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(404)
  })

  it('should return 404 for webhook from another organization (IDOR)', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    await getWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(prisma.webhook.findFirst).toHaveBeenCalledWith({
      where: {
        id: '550e8400-e29b-41d4-a716-446655440999',
        organizationId: 'org-123',
      },
      include: expect.any(Object),
    })
  })

  it('should return 500 on database error', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await getWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(500)
  })
})

describe('PATCH /api/v1/webhooks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update webhook successfully', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(mockWebhook)
    ;(updateSvixEndpoint as Mock).mockResolvedValue(true)
    ;(prisma.webhook.update as Mock).mockResolvedValue({
      ...mockWebhook,
      description: 'Updated description',
    })

    const request = createRequest({ description: 'Updated description' })
    const response = await updateWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.webhook.description).toBe('Updated description')
  })

  it('should return 404 for webhook from another organization', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest({ enabled: false })
    const response = await updateWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(response.status).toBe(404)
    expect(prisma.webhook.update).not.toHaveBeenCalled()
  })

  it('should reject invalid events', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(mockWebhook)

    const request = createRequest({
      events: ['deal.created', 'invalid.event']
    })

    const response = await updateWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('inválidos')
  })

  it('should return 500 if Svix update fails', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(mockWebhook)
    ;(updateSvixEndpoint as Mock).mockResolvedValue(false)

    const request = createRequest({ url: 'https://new-url.com' })
    const response = await updateWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(500)
    expect(prisma.webhook.update).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/v1/webhooks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete webhook successfully', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(mockWebhook)
    ;(deleteSvixEndpoint as Mock).mockResolvedValue(undefined)
    ;(prisma.webhook.delete as Mock).mockResolvedValue(mockWebhook)

    const request = createRequest()
    const response = await deleteWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(deleteSvixEndpoint).toHaveBeenCalledWith('app_123', 'ep_123')
  })

  it('should return 404 for webhook from another organization', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await deleteWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(response.status).toBe(404)
    expect(prisma.webhook.delete).not.toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(mockWebhook)
    ;(deleteSvixEndpoint as Mock).mockResolvedValue(undefined)
    ;(prisma.webhook.delete as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await deleteWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(500)
  })
})

describe('Security - Cross-Organization Access (IDOR)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should NEVER list webhooks from other organizations', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { tier: 'PRO' }
    })
    ;(prisma.webhook.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    await getWebhooks(request)

    const findCall = (prisma.webhook.findMany as Mock).mock.calls[0][0]
    expect(findCall.where.organizationId).toBe('org-123')
  })

  it('should NEVER return webhook from another organization', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    await getWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    const findCall = (prisma.webhook.findFirst as Mock).mock.calls[0][0]
    expect(findCall.where.organizationId).toBe('org-123')
  })

  it('should NEVER update webhook from another organization', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest({ enabled: false })
    await updateWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(prisma.webhook.update).not.toHaveBeenCalled()
  })

  it('should NEVER delete webhook from another organization', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.webhook.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    await deleteWebhook(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(prisma.webhook.delete).not.toHaveBeenCalled()
  })
})
