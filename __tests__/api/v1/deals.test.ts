/**
 * TESTES DA API DE DEALS (CRUD)
 * ==============================
 *
 * Deals são o core business do CRM. Estes testes garantem:
 * - CRUD completo (Create, Read, Update, Delete)
 * - Segurança IDOR (deals não podem ser acessados por outras orgs)
 * - Validações de negócio (stage, pipeline, contact ownership)
 * - Paginação e filtros
 *
 * Coverage Target: 80%+
 * Priority: CRÍTICA (core business logic)
 */

import { vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock do Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    deal: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    pipelineStage: {
      findFirst: vi.fn(),
    },
    contact: {
      findFirst: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
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

// Mock do push notifications
vi.mock('@/lib/push-notifications', () => ({
  sendNewDealNotification: vi.fn().mockResolvedValue(undefined),
  sendDealWonNotification: vi.fn().mockResolvedValue(undefined),
}))

// Mock do API middleware - simula autenticação
vi.mock('@/lib/api-middleware', () => ({
  withApiMiddleware: vi.fn((request, handler) => {
    const context = {
      requestId: 'test-request-id',
      organizationId: 'org-123',
      userId: 'user-123',
      apiKeyId: null,
    }
    return handler(request, context)
  }),
  apiResponse: vi.fn((requestId, data, error) => ({
    requestId,
    data,
    error,
  })),
}))

// Mock dos helpers
vi.mock('@/lib/api-helpers', () => ({
  getPaginationParams: vi.fn(() => ({ page: 1, limit: 50, offset: 0 })),
  getPaginationMeta: vi.fn((page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  })),
  paginatedResponse: vi.fn((requestId, data, pagination) => ({
    requestId,
    data,
    pagination,
  })),
  getSortParams: vi.fn(() => ({ sortBy: 'createdAt', order: 'desc' })),
  getFilters: vi.fn(() => ({})),
  formatDecimal: vi.fn((val) => val),
  formatDate: vi.fn((date) => date?.toISOString()),
}))

// Mock dos validators
vi.mock('@/lib/api-validators', () => ({
  validateRequest: vi.fn().mockResolvedValue({ success: true, data: {} }),
  uuidSchema: {
    safeParse: (id: string) => ({
      success: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    }),
  },
  createDealSchema: {},
  updateDealSchema: {},
}))

import { GET as listDeals, POST as createDeal } from '@/app/api/v1/deals/route'
import { GET as getDeal, PATCH as updateDeal, DELETE as deleteDeal } from '@/app/api/v1/deals/[id]/route'
import { prisma } from '@/lib/prisma'
import { validateRequest } from '@/lib/api-validators'
import type { Mock } from 'vitest'

function createRequest(url: string, method: string = 'GET', body?: any): NextRequest {
  const fullUrl = `http://localhost:3000${url}`
  const options: RequestInit = { method }

  if (body) {
    options.body = JSON.stringify(body)
    options.headers = { 'content-type': 'application/json' }
  }

  return new NextRequest(fullUrl, options)
}

describe('Deals API - CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/deals - List deals', () => {
    it('should list deals for authenticated org', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          title: 'Deal Test 1',
          value: 1000,
          closeDate: new Date('2026-12-31'),
          dueDate: null,
          order: 0,
          stage: { id: 'stage-1', name: 'Negociação', order: 1 },
          pipeline: { id: 'pipe-1', name: 'Vendas' },
          contact: { id: 'contact-1', name: 'Cliente A', email: 'a@test.com', phone: null, company: null },
          user: { id: 'user-123', name: 'Vendedor', email: 'vendedor@test.com' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      ;(prisma.deal.count as Mock).mockResolvedValue(1)
      ;(prisma.deal.findMany as Mock).mockResolvedValue(mockDeals)

      const request = createRequest('/api/v1/deals')
      const response = await listDeals(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].title).toBe('Deal Test 1')
    })

    it('should filter deals by stageId', async () => {
      const { getFilters } = await import('@/lib/api-helpers')
      ;(getFilters as Mock).mockReturnValueOnce({ stageId: 'stage-1' })

      ;(prisma.deal.count as Mock).mockResolvedValue(0)
      ;(prisma.deal.findMany as Mock).mockResolvedValue([])

      const request = createRequest('/api/v1/deals?stageId=stage-1')
      await listDeals(request)

      expect(prisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            stageId: 'stage-1',
          }),
        })
      )
    })

    it('should only return deals from authenticated org (IDOR protection)', async () => {
      ;(prisma.deal.count as Mock).mockResolvedValue(0)
      ;(prisma.deal.findMany as Mock).mockResolvedValue([])

      const request = createRequest('/api/v1/deals')
      await listDeals(request)

      // Verify organizationId is always included in where clause
      expect(prisma.deal.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org-123',
        }),
      })
    })
  })

  describe('POST /api/v1/deals - Create deal', () => {
    it('should create deal with valid data', async () => {
      const requestBody = {
        title: 'Novo Deal',
        value: 5000,
        stageId: 'stage-1',
      }

      const mockStage = {
        id: 'stage-1',
        name: 'Negociação',
        pipelineId: 'pipe-1',
        organizationId: 'org-123',
        pipeline: { id: 'pipe-1', name: 'Vendas' },
      }

      const mockUser = {
        id: 'user-123',
        name: 'Vendedor',
        organizationId: 'org-123',
      }

      const mockCreatedDeal = {
        id: 'deal-new',
        title: 'Novo Deal',
        value: 5000,
        stageId: 'stage-1',
        pipelineId: 'pipe-1',
        contactId: null,
        userId: 'user-123',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(validateRequest as Mock).mockResolvedValueOnce({
        success: true,
        data: requestBody
      })
      ;(prisma.pipelineStage.findFirst as Mock).mockResolvedValue(mockStage)
      ;(prisma.user.findFirst as Mock).mockResolvedValue(mockUser)
      ;(prisma.deal.create as Mock).mockResolvedValue(mockCreatedDeal)

      const request = createRequest('/api/v1/deals', 'POST', requestBody)

      const response = await createDeal(request)

      expect(response.status).toBe(201)
      expect(prisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Novo Deal',
            value: 5000,
            stageId: 'stage-1',
            organizationId: 'org-123',
          }),
        })
      )
    })

    it('should reject if stage does not belong to org (IDOR protection)', async () => {
      const requestBody = {
        title: 'Deal Malicioso',
        value: 1000,
        stageId: 'stage-from-other-org',
      }

      ;(prisma.pipelineStage.findFirst as Mock).mockResolvedValue(null)

      const request = createRequest('/api/v1/deals', 'POST', requestBody)

      const response = await createDeal(request)

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error.message).toContain('Stage not found')
      expect(prisma.deal.create).not.toHaveBeenCalled()
    })

    it('should reject if contact does not belong to org (IDOR protection)', async () => {
      const requestBody = {
        title: 'Deal Malicioso',
        value: 1000,
        stageId: 'stage-1',
        contactId: 'contact-from-other-org',
      }

      const mockStage = {
        id: 'stage-1',
        pipelineId: 'pipe-1',
        organizationId: 'org-123',
        pipeline: { id: 'pipe-1' },
      }

      ;(prisma.pipelineStage.findFirst as Mock).mockResolvedValue(mockStage)
      ;(prisma.contact.findFirst as Mock).mockResolvedValue(null) // Contact not found or wrong org

      const request = createRequest('/api/v1/deals', 'POST', requestBody)

      const response = await createDeal(request)

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error.message).toContain('Contact not found')
      expect(prisma.deal.create).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/v1/deals/[id] - Get specific deal', () => {
    it('should return deal if it belongs to org', async () => {
      const mockDeal = {
        id: 'deal-123',
        title: 'Deal Test',
        value: 1000,
        closeDate: new Date(),
        dueDate: null,
        order: 0,
        stage: { id: 'stage-1', name: 'Negociação', order: 1 },
        pipeline: { id: 'pipe-1', name: 'Vendas' },
        contact: null,
        user: { id: 'user-123', name: 'Vendedor', email: 'vendedor@test.com' },
        notes: [],
        activities: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(prisma.deal.findFirst as Mock).mockResolvedValue(mockDeal)

      const request = createRequest('/api/v1/deals/550e8400-e29b-41d4-a716-446655440000')
      const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' })

      const response = await getDeal(request, { params })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data.id).toBe('deal-123')
    })

    it('should return 404 if deal does not belong to org (IDOR protection)', async () => {
      ;(prisma.deal.findFirst as Mock).mockResolvedValue(null)

      const request = createRequest('/api/v1/deals/550e8400-e29b-41d4-a716-446655440000')
      const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' })

      const response = await getDeal(request, { params })

      expect(response.status).toBe(404)

      // Verify query included organizationId filter
      expect(prisma.deal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: '550e8400-e29b-41d4-a716-446655440000',
            organizationId: 'org-123',
          }),
        })
      )
    })

    it('should return 400 for invalid UUID format', async () => {
      const request = createRequest('/api/v1/deals/invalid-id')
      const params = Promise.resolve({ id: 'invalid-id' })

      const response = await getDeal(request, { params })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error.message).toContain('Invalid deal ID format')
    })
  })

  describe('PATCH /api/v1/deals/[id] - Update deal', () => {
    it('should update deal if it belongs to org', async () => {
      const requestBody = {
        title: 'Deal Atualizado',
        value: 2000,
      }

      const mockDeal = {
        id: 'deal-123',
        title: 'Deal Original',
        value: 1000,
        organizationId: 'org-123',
        stageId: 'stage-1',
        pipelineId: 'pipe-1',
      }

      const mockUpdatedDeal = {
        ...mockDeal,
        title: 'Deal Atualizado',
        value: 2000,
        updatedAt: new Date(),
      }

      ;(validateRequest as Mock).mockResolvedValueOnce({
        success: true,
        data: requestBody
      })
      ;(prisma.deal.findFirst as Mock).mockResolvedValue(mockDeal)
      ;(prisma.deal.update as Mock).mockResolvedValue(mockUpdatedDeal)

      const request = createRequest('/api/v1/deals/550e8400-e29b-41d4-a716-446655440000', 'PATCH', requestBody)

      const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' })

      const response = await updateDeal(request, { params })

      expect(response.status).toBe(200)
      expect(prisma.deal.update).toHaveBeenCalled()
    })

    it('should return 404 if deal does not belong to org (IDOR protection)', async () => {
      ;(prisma.deal.findFirst as Mock).mockResolvedValue(null)

      const request = createRequest('/api/v1/deals/550e8400-e29b-41d4-a716-446655440000', 'PATCH', {
        title: 'Tentativa Maliciosa',
      })

      const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' })

      const response = await updateDeal(request, { params })

      expect(response.status).toBe(404)
      expect(prisma.deal.update).not.toHaveBeenCalled()
    })
  })

  describe('DELETE /api/v1/deals/[id] - Delete deal', () => {
    it('should delete deal if it belongs to org', async () => {
      const mockDeal = {
        id: 'deal-123',
        title: 'Deal to Delete',
        organizationId: 'org-123',
      }

      ;(prisma.deal.findFirst as Mock).mockResolvedValue(mockDeal)
      ;(prisma.deal.delete as Mock).mockResolvedValue(mockDeal)

      const request = createRequest('/api/v1/deals/550e8400-e29b-41d4-a716-446655440000', 'DELETE')
      const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' })

      const response = await deleteDeal(request, { params })

      expect(response.status).toBe(200)
      expect(prisma.deal.delete).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      })
    })

    it('should return 404 if deal does not belong to org (IDOR protection)', async () => {
      ;(prisma.deal.findFirst as Mock).mockResolvedValue(null)

      const request = createRequest('/api/v1/deals/550e8400-e29b-41d4-a716-446655440000', 'DELETE')
      const params = Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' })

      const response = await deleteDeal(request, { params })

      expect(response.status).toBe(404)
      expect(prisma.deal.delete).not.toHaveBeenCalled()
    })
  })

  describe('Security - IDOR Prevention', () => {
    it('should NEVER allow cross-org access in any operation', async () => {
      // This test ensures all operations check organizationId
      const dealId = '550e8400-e29b-41d4-a716-446655440000'

      // Test GET
      ;(prisma.deal.findFirst as Mock).mockResolvedValue(null)
      await getDeal(createRequest(`/api/v1/deals/${dealId}`), { params: Promise.resolve({ id: dealId }) })

      expect(prisma.deal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      )

      vi.clearAllMocks()

      // Test PATCH
      await updateDeal(createRequest(`/api/v1/deals/${dealId}`, 'PATCH', { title: 'Test' }), {
        params: Promise.resolve({ id: dealId }),
      })

      expect(prisma.deal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      )

      vi.clearAllMocks()

      // Test DELETE
      await deleteDeal(createRequest(`/api/v1/deals/${dealId}`, 'DELETE'), { params: Promise.resolve({ id: dealId }) })

      expect(prisma.deal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      )
    })
  })
})
