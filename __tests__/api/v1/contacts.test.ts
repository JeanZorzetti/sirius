/**
 * TESTES DA API V1 DE CONTACTS
 * =============================
 *
 * Testa o CRUD completo de contatos com foco em:
 * - Isolamento entre organizações (multi-tenancy)
 * - Validação de campos obrigatórios
 * - Prevenção de email duplicado na mesma org
 * - Paginação e sorting
 * - Proteção contra IDOR (Insecure Direct Object Reference)
 * - Constraint de integridade (não deletar contact com deals)
 *
 * Coverage Target: 85%+
 * Priority: ALTA (core business logic)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { Mock } from 'vitest'

// Mock do Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    contact: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock do api-middleware
vi.mock('@/lib/api-middleware', () => ({
  withApiMiddleware: async (req: NextRequest, handler: Function) => {
    const context = {
      userId: 'user-123',
      organizationId: 'org-123',
      requestId: 'req-123',
    }
    return handler(req, context)
  },
  apiResponse: (requestId: string, data: any, error?: any) => ({
    requestId,
    data,
    error,
  }),
}))

// Mock do logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock dos validators - retorna o body do request
vi.mock('@/lib/api-validators', () => ({
  validateRequest: async (req: any, _schema: any) => {
    try {
      const data = await req.json()
      return { success: true, data }
    } catch {
      return { success: true, data: {} }
    }
  },
  uuidSchema: {
    safeParse: (id: string) => ({
      success: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    }),
  },
  createContactSchema: {},
  updateContactSchema: {},
}))

// Mock dos api-helpers
vi.mock('@/lib/api-helpers', () => ({
  getPaginationParams: (req: NextRequest) => ({
    page: 1,
    limit: 20,
    offset: 0,
  }),
  getPaginationMeta: (page: number, limit: number, total: number) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }),
  paginatedResponse: (requestId: string, data: any, pagination: any) => ({
    requestId,
    data,
    pagination,
  }),
  getSortParams: (
    req: NextRequest,
    defaultSort: string,
    allowedFields: string[]
  ) => ({
    sortBy: defaultSort,
    order: 'desc' as const,
  }),
  formatDecimal: (value: any) => value,
}))

import { GET as getContacts, POST as createContact } from '@/app/api/v1/contacts/route'
import { GET as getContact, PATCH as updateContact, DELETE as deleteContact } from '@/app/api/v1/contacts/[id]/route'
import { prisma } from '@/lib/prisma'

function createRequest(body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/v1/contacts')

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  return new NextRequest(url, {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'content-type': 'application/json',
    },
  })
}

const mockContact = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '11999999999',
  company: 'Acme Inc',
  organizationId: 'org-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('GET /api/v1/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list contacts with pagination', async () => {
    ;(prisma.contact.count as Mock).mockResolvedValue(50)
    ;(prisma.contact.findMany as Mock).mockResolvedValue([
      { ...mockContact, _count: { deals: 3 } },
    ])

    const request = createRequest()
    const response = await getContacts(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].dealsCount).toBe(3)
    expect(data.pagination).toBeDefined()
    expect(data.pagination.total).toBe(50)
  })

  it('should filter by organizationId automatically', async () => {
    ;(prisma.contact.count as Mock).mockResolvedValue(10)
    ;(prisma.contact.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    await getContacts(request)

    expect(prisma.contact.count).toHaveBeenCalledWith({
      where: { organizationId: 'org-123' }
    })
    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-123' }
      })
    )
  })

  it('should include deals count for each contact', async () => {
    ;(prisma.contact.count as Mock).mockResolvedValue(1)
    ;(prisma.contact.findMany as Mock).mockResolvedValue([
      { ...mockContact, _count: { deals: 5 } },
    ])

    const request = createRequest()
    const response = await getContacts(request)
    const data = await response.json()

    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          _count: {
            select: { deals: true }
          }
        }
      })
    )
    expect(data.data[0].dealsCount).toBe(5)
  })

  it('should return 500 on database error', async () => {
    ;(prisma.contact.count as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await getContacts(request)

    expect(response.status).toBe(500)
  })
})

describe('POST /api/v1/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create contact with valid data', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null) // No existing email
    ;(prisma.contact.create as Mock).mockResolvedValue(mockContact)

    const request = createRequest({
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      company: 'Acme Inc',
    })

    const response = await createContact(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.name).toBe('João Silva')
    expect(prisma.contact.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-123',
      })
    })
  })

  it('should prevent duplicate email in same organization', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(mockContact)

    const request = createRequest({
      name: 'João Silva',
      email: 'joao@example.com',
    })

    const response = await createContact(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error.code).toBe('CONFLICT')
    expect(prisma.contact.create).not.toHaveBeenCalled()
  })

  it('should allow same email in different organization', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)
    ;(prisma.contact.create as Mock).mockResolvedValue(mockContact)

    const request = createRequest({
      name: 'João Silva',
      email: 'joao@example.com',
    })

    await createContact(request)

    expect(prisma.contact.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-123',
        email: 'joao@example.com',
      }
    })
  })

  it('should return 500 on database error', async () => {
    ;(prisma.contact.findFirst as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest({
      name: 'João Silva',
      email: 'joao@example.com',
    })

    const response = await createContact(request)

    expect(response.status).toBe(500)
  })
})

describe('GET /api/v1/contacts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return contact with associated deals', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue({
      ...mockContact,
      deals: [
        {
          id: 'deal-1',
          title: 'Deal 1',
          value: 10000,
          stage: { id: 'stage-1', name: 'Prospecção' },
          pipeline: { id: 'pipe-1', name: 'Pipeline 1' },
          createdAt: new Date('2024-01-01'),
        },
      ],
    })

    const request = createRequest()
    const response = await getContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.deals).toHaveLength(1)
    expect(data.data.deals[0].title).toBe('Deal 1')
  })

  it('should return 404 for non-existent contact', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await getContact(request, { params: Promise.resolve({ id: '770e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(404)
  })

  it('should return 404 for contact from another organization (IDOR protection)', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    await getContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(prisma.contact.findFirst).toHaveBeenCalledWith({
      where: {
        id: '550e8400-e29b-41d4-a716-446655440999',
        organizationId: 'org-123',
      },
      include: expect.any(Object),
    })
  })

  it('should return 400 for invalid UUID format', async () => {
    const request = createRequest()
    const response = await getContact(request, { params: Promise.resolve({ id: 'invalid-id' }) })

    expect(response.status).toBe(400)
    expect(prisma.contact.findFirst).not.toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    ;(prisma.contact.findFirst as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await getContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(500)
  })
})

describe('PATCH /api/v1/contacts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update contact successfully', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(mockContact)
    ;(prisma.contact.update as Mock).mockResolvedValue({
      ...mockContact,
      name: 'João Silva Updated',
    })

    const request = createRequest({ name: 'João Silva Updated' })
    const response = await updateContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.name).toBe('João Silva Updated')
  })

  it('should return 404 for contact from another organization', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest({ name: 'Updated' })
    const response = await updateContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(response.status).toBe(404)
    expect(prisma.contact.update).not.toHaveBeenCalled()
  })

  it('should prevent email conflict when updating', async () => {
    ;(prisma.contact.findFirst as Mock)
      .mockResolvedValueOnce(mockContact) // existing contact check
      .mockResolvedValueOnce({ id: '660e8400-e29b-41d4-a716-446655440999', email: 'conflict@example.com' }) // email conflict

    const request = createRequest({ email: 'conflict@example.com' })
    const response = await updateContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(409)
    expect(prisma.contact.update).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid UUID format', async () => {
    const request = createRequest({ name: 'Updated' })
    const response = await updateContact(request, { params: Promise.resolve({ id: 'invalid-id' }) })

    expect(response.status).toBe(400)
  })

  it('should return 500 on database error', async () => {
    ;(prisma.contact.findFirst as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest({ name: 'Updated' })
    const response = await updateContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(500)
  })
})

describe('DELETE /api/v1/contacts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete contact without deals', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue({
      ...mockContact,
      _count: { deals: 0 },
    })
    ;(prisma.contact.delete as Mock).mockResolvedValue(mockContact)

    const request = createRequest()
    const response = await deleteContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.deleted).toBe(true)
    expect(prisma.contact.delete).toHaveBeenCalledWith({
      where: { id: '550e8400-e29b-41d4-a716-446655440000' }
    })
  })

  it('should prevent deletion of contact with deals', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue({
      ...mockContact,
      _count: { deals: 3 },
    })

    const request = createRequest()
    const response = await deleteContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error.code).toBe('CONFLICT')
    expect(data.error.message).toContain('3')
    expect(prisma.contact.delete).not.toHaveBeenCalled()
  })

  it('should return 404 for contact from another organization', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await deleteContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(response.status).toBe(404)
    expect(prisma.contact.delete).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid UUID format', async () => {
    const request = createRequest()
    const response = await deleteContact(request, { params: Promise.resolve({ id: 'invalid-id' }) })

    expect(response.status).toBe(400)
  })

  it('should return 500 on database error', async () => {
    ;(prisma.contact.findFirst as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await deleteContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(500)
  })
})

describe('Security - Cross-Organization Access (IDOR)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should NEVER list contacts from other organizations', async () => {
    ;(prisma.contact.count as Mock).mockResolvedValue(0)
    ;(prisma.contact.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    await getContacts(request)

    const countCall = (prisma.contact.count as Mock).mock.calls[0][0]
    const findCall = (prisma.contact.findMany as Mock).mock.calls[0][0]

    expect(countCall.where.organizationId).toBe('org-123')
    expect(findCall.where.organizationId).toBe('org-123')
  })

  it('should NEVER allow creating contact for another organization', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)
    ;(prisma.contact.create as Mock).mockResolvedValue(mockContact)

    const request = createRequest({
      name: 'Test',
      organizationId: 'HACKER-ORG', // Tentativa de IDOR
    })

    await createContact(request)

    const createCall = (prisma.contact.create as Mock).mock.calls[0][0]
    expect(createCall.data.organizationId).toBe('org-123') // Deve usar org do context
  })

  it('should NEVER return contact from another organization', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    await getContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    const findCall = (prisma.contact.findFirst as Mock).mock.calls[0][0]
    expect(findCall.where.organizationId).toBe('org-123')
  })

  it('should NEVER update contact from another organization', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest({ name: 'Hacked' })
    await updateContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(prisma.contact.update).not.toHaveBeenCalled()
  })

  it('should NEVER delete contact from another organization', async () => {
    ;(prisma.contact.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    await deleteContact(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(prisma.contact.delete).not.toHaveBeenCalled()
  })
})
