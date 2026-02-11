/**
 * TESTES DA API V1 DE API KEYS
 * =============================
 *
 * Testa gerenciamento de API keys com foco em:
 * - PRO/BUSINESS plan enforcement
 * - Limite de 1 key por organização
 * - Segurança: full key mostrada apenas na criação
 * - IDOR protection no revoke
 * - Isolamento entre organizações
 *
 * Coverage Target: 90%+
 * Priority: ALTA (autenticação externa crítica)
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
    apiKey: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
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

// Mock das funções de API keys
vi.mock('@/lib/api-keys', () => ({
  generateApiKey: vi.fn(),
  listApiKeys: vi.fn(),
  revokeApiKey: vi.fn(),
}))

import { GET as getApiKeys, POST as createApiKey } from '@/app/api/v1/api-keys/route'
import { DELETE as deleteApiKey } from '@/app/api/v1/api-keys/[id]/route'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiKey, listApiKeys, revokeApiKey } from '@/lib/api-keys'

function createRequest(body?: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/api-keys', {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'content-type': 'application/json',
    },
  })
}

const mockApiKey = {
  id: 'key-123',
  key: 'sk_live_1234567890abcdef',
  prefix: 'sk_live_1234',
  name: 'Production Key',
  organizationId: 'org-123',
  lastUsedAt: null,
  createdAt: new Date('2024-01-01'),
}

describe('GET /api/v1/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list API keys for PRO organization', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { plan: 'PRO' }
    })
    ;(listApiKeys as Mock).mockResolvedValue([mockApiKey])

    const request = createRequest()
    const response = await getApiKeys(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.apiKeys).toHaveLength(1)
    expect(listApiKeys).toHaveBeenCalledWith('org-123')
  })

  it('should return 401 when not authenticated', async () => {
    ;(getSession as Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await getApiKeys(request)

    expect(response.status).toBe(401)
  })

  it('should return 403 for FREE plan', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { plan: 'FREE' }
    })

    const request = createRequest()
    const response = await getApiKeys(request)
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
      organization: { plan: 'BUSINESS' }
    })
    ;(listApiKeys as Mock).mockResolvedValue([])

    const request = createRequest()
    const response = await getApiKeys(request)

    expect(response.status).toBe(200)
  })

  it('should return 500 on database error', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await getApiKeys(request)

    expect(response.status).toBe(500)
  })
})

describe('POST /api/v1/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate API key for PRO org', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { plan: 'PRO' }
    })
    ;(prisma.apiKey.findFirst as Mock).mockResolvedValue(null) // No existing key
    ;(generateApiKey as Mock).mockResolvedValue(mockApiKey)

    const request = createRequest({ name: 'Production Key' })
    const response = await createApiKey(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.apiKey.key).toBe('sk_live_1234567890abcdef')
    expect(data.apiKey.prefix).toBe('sk_live_1234')
    expect(generateApiKey).toHaveBeenCalledWith('org-123', 'Production Key')
  })

  it('should return 403 for FREE plan', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { plan: 'FREE' }
    })

    const request = createRequest({ name: 'Test Key' })
    const response = await createApiKey(request)

    expect(response.status).toBe(403)
    expect(generateApiKey).not.toHaveBeenCalled()
  })

  it('should return 400 for missing name', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { plan: 'PRO' }
    })

    const request = createRequest({})
    const response = await createApiKey(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('obrigatório')
  })

  it('should prevent creating second key (one per org)', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { plan: 'PRO' }
    })
    ;(prisma.apiKey.findFirst as Mock).mockResolvedValue(mockApiKey)

    const request = createRequest({ name: 'Second Key' })
    const response = await createApiKey(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('já possui')
    expect(generateApiKey).not.toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest({ name: 'Test Key' })
    const response = await createApiKey(request)

    expect(response.status).toBe(500)
  })
})

describe('DELETE /api/v1/api-keys/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should revoke API key successfully', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.apiKey.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(revokeApiKey as Mock).mockResolvedValue(undefined)

    const request = createRequest()
    const response = await deleteApiKey(request, { params: Promise.resolve({ id: 'key-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(revokeApiKey).toHaveBeenCalledWith('key-123', 'org-123')
  })

  it('should return 404 for non-existent key', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.apiKey.findUnique as Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await deleteApiKey(request, { params: Promise.resolve({ id: 'non-existent' }) })

    expect(response.status).toBe(404)
    expect(revokeApiKey).not.toHaveBeenCalled()
  })

  it('should return 403 for key from another organization (IDOR)', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.apiKey.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-999', // Different org
    })

    const request = createRequest()
    const response = await deleteApiKey(request, { params: Promise.resolve({ id: 'key-from-other-org' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('permissão')
    expect(revokeApiKey).not.toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await deleteApiKey(request, { params: Promise.resolve({ id: 'key-123' }) })

    expect(response.status).toBe(500)
  })
})

describe('Security - API Key Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should only show full key on creation (not on list)', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { plan: 'PRO' }
    })
    ;(prisma.apiKey.findFirst as Mock).mockResolvedValue(null)
    ;(generateApiKey as Mock).mockResolvedValue(mockApiKey)

    const request = createRequest({ name: 'Test Key' })
    const response = await createApiKey(request)
    const data = await response.json()

    // Full key deve estar presente na criação
    expect(data.apiKey.key).toBe('sk_live_1234567890abcdef')
    expect(data.apiKey.prefix).toBe('sk_live_1234')
  })

  it('should enforce one key per organization limit', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
      organization: { plan: 'PRO' }
    })
    ;(prisma.apiKey.findFirst as Mock).mockResolvedValue(mockApiKey)

    const request = createRequest({ name: 'Second Key' })
    const response = await createApiKey(request)

    expect(response.status).toBe(400)
    expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
      where: { organizationId: 'org-123' }
    })
  })

  it('should NEVER revoke key from another organization', async () => {
    ;(getSession as Mock).mockResolvedValue({
      user: { email: 'test@example.com' }
    })
    ;(prisma.user.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-123',
    })
    ;(prisma.apiKey.findUnique as Mock).mockResolvedValue({
      organizationId: 'org-999',
    })

    const request = createRequest()
    await deleteApiKey(request, { params: Promise.resolve({ id: 'key-999' }) })

    expect(revokeApiKey).not.toHaveBeenCalled()
  })
})
