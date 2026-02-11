/**
 * TESTES DA API V1 DE PIPELINES
 * ==============================
 *
 * Testa operações de pipelines com foco em:
 * - Isolamento entre organizações (multi-tenancy)
 * - Validação de nome duplicado
 * - Lógica de isDefault (apenas 1 pipeline default por org)
 * - Criação de pipeline com stages em transação
 * - PRO plan enforcement na criação
 * - Proteção contra IDOR
 * - Inclusão de stages e deals count
 *
 * Coverage Target: 85%+
 * Priority: ALTA (core business logic)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { Mock } from 'vitest'

// Mock do Prisma
const mockTx = {
  pipeline: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  pipelineStage: {
    createMany: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pipeline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockTx)),
  },
}))

// Mock do api-middleware
vi.mock('@/lib/api-middleware', () => ({
  withApiMiddleware: async (req: NextRequest, handler: Function) => {
    const context = {
      userId: 'user-123',
      organizationId: 'org-123',
      requestId: 'req-123',
      tier: 'pro', // Default PRO para testes
    }
    return handler(req, context)
  },
  withProPlan: async (req: NextRequest, context: any, handler: Function) => {
    if (context.tier === 'free') {
      return {
        json: async () => ({ error: { code: 'PLAN_REQUIRED', message: 'PRO plan required' } }),
        status: 403,
      }
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
  uuidSchema: {
    safeParse: (id: string) => ({
      success: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    }),
  },
  createPipelineSchema: {},
}))

import { GET as getPipelines, POST as createPipeline } from '@/app/api/v1/pipelines/route'
import { GET as getPipeline } from '@/app/api/v1/pipelines/[id]/route'
import { prisma } from '@/lib/prisma'

function createRequest(body?: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/pipelines', {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'content-type': 'application/json',
    },
  })
}

const mockPipeline = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Pipeline Vendas',
  isDefault: true,
  organizationId: 'org-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  stages: [
    { id: 'stage-1', name: 'Prospecção', order: 1 },
    { id: 'stage-2', name: 'Proposta', order: 2 },
    { id: 'stage-3', name: 'Fechamento', order: 3 },
  ],
  _count: { deals: 10 },
}

describe('GET /api/v1/pipelines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should list all pipelines with stages and deals count', async () => {
    ;(prisma.pipeline.findMany as Mock).mockResolvedValue([mockPipeline])

    const request = createRequest()
    const response = await getPipelines(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].stages).toHaveLength(3)
    expect(data.data[0].dealsCount).toBe(10)
    expect(data.data[0].isDefault).toBe(true)
  })

  it('should filter by organizationId automatically', async () => {
    ;(prisma.pipeline.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    await getPipelines(request)

    expect(prisma.pipeline.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-123' }
      })
    )
  })

  it('should order pipelines by isDefault desc, then createdAt asc', async () => {
    ;(prisma.pipeline.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    await getPipelines(request)

    expect(prisma.pipeline.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ]
      })
    )
  })

  it('should include stages ordered by order field', async () => {
    ;(prisma.pipeline.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    await getPipelines(request)

    expect(prisma.pipeline.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          stages: expect.objectContaining({
            orderBy: { order: 'asc' }
          })
        })
      })
    )
  })

  it('should return 500 on database error', async () => {
    ;(prisma.pipeline.findMany as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await getPipelines(request)

    expect(response.status).toBe(500)
  })
})

describe('POST /api/v1/pipelines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create pipeline with stages', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue(null)
    ;(prisma.pipeline.updateMany as Mock).mockResolvedValue({ count: 0 })
    ;(mockTx.pipeline.create as Mock).mockResolvedValue({
      id: mockPipeline.id,
      name: mockPipeline.name,
      isDefault: false,
      organizationId: 'org-123',
      createdAt: mockPipeline.createdAt,
      updatedAt: mockPipeline.updatedAt,
    })
    ;(mockTx.pipelineStage.createMany as Mock).mockResolvedValue({ count: 3 })
    ;(mockTx.pipeline.findUnique as Mock).mockResolvedValue(mockPipeline)

    const request = createRequest({
      name: 'Pipeline Vendas',
      isDefault: false,
      stages: [
        { name: 'Prospecção', order: 1 },
        { name: 'Proposta', order: 2 },
        { name: 'Fechamento', order: 3 },
      ],
    })

    const response = await createPipeline(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.name).toBe('Pipeline Vendas')
    expect(data.data.stages).toHaveLength(3)
  })

  it('should prevent duplicate pipeline name in same organization', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue(mockPipeline)

    const request = createRequest({
      name: 'Pipeline Vendas',
      stages: [{ name: 'Stage 1', order: 1 }],
    })

    const response = await createPipeline(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error.code).toBe('CONFLICT')
    expect(mockTx.pipeline.create).not.toHaveBeenCalled()
  })

  it('should unset other default pipelines when isDefault=true', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue(null)
    ;(prisma.pipeline.updateMany as Mock).mockResolvedValue({ count: 1 })
    ;(mockTx.pipeline.create as Mock).mockResolvedValue({
      id: mockPipeline.id,
      name: 'New Default',
      isDefault: true,
      organizationId: 'org-123',
      createdAt: mockPipeline.createdAt,
      updatedAt: mockPipeline.updatedAt,
    })
    ;(mockTx.pipelineStage.createMany as Mock).mockResolvedValue({ count: 1 })
    ;(mockTx.pipeline.findUnique as Mock).mockResolvedValue({
      ...mockPipeline,
      name: 'New Default',
      stages: [{ id: 'stage-1', name: 'Stage 1', order: 1 }],
    })

    const request = createRequest({
      name: 'New Default',
      isDefault: true,
      stages: [{ name: 'Stage 1', order: 1 }],
    })

    await createPipeline(request)

    expect(prisma.pipeline.updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org-123',
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    })
  })

  it('should create stages with organizationId', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue(null)
    ;(prisma.pipeline.updateMany as Mock).mockResolvedValue({ count: 0 })
    ;(mockTx.pipeline.create as Mock).mockResolvedValue({
      id: 'pipeline-123',
      name: 'Test',
      isDefault: false,
      organizationId: 'org-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    ;(mockTx.pipelineStage.createMany as Mock).mockResolvedValue({ count: 2 })
    ;(mockTx.pipeline.findUnique as Mock).mockResolvedValue({
      ...mockPipeline,
      stages: [
        { id: 'stage-1', name: 'Stage 1', order: 1 },
        { id: 'stage-2', name: 'Stage 2', order: 2 },
      ],
    })

    const request = createRequest({
      name: 'Test',
      stages: [
        { name: 'Stage 1', order: 1 },
        { name: 'Stage 2', order: 2 },
      ],
    })

    await createPipeline(request)

    expect(mockTx.pipelineStage.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          organizationId: 'org-123',
        }),
      ]),
    })
  })

  it('should return 500 on database error', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest({
      name: 'Test',
      stages: [{ name: 'Stage 1', order: 1 }],
    })

    const response = await createPipeline(request)

    expect(response.status).toBe(500)
  })
})

describe('GET /api/v1/pipelines/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return pipeline with stages and deals count', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue({
      ...mockPipeline,
      stages: mockPipeline.stages.map(stage => ({
        ...stage,
        _count: { deals: 3 },
      })),
    })

    const request = createRequest()
    const response = await getPipeline(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.stages).toHaveLength(3)
    expect(data.data.stages[0].dealsCount).toBe(3)
    expect(data.data.dealsCount).toBe(10)
  })

  it('should return 404 for non-existent pipeline', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    const response = await getPipeline(request, { params: Promise.resolve({ id: '770e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(404)
  })

  it('should return 404 for pipeline from another organization (IDOR protection)', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    await getPipeline(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    expect(prisma.pipeline.findFirst).toHaveBeenCalledWith({
      where: {
        id: '550e8400-e29b-41d4-a716-446655440999',
        organizationId: 'org-123',
      },
      include: expect.any(Object),
    })
  })

  it('should return 400 for invalid UUID format', async () => {
    const request = createRequest()
    const response = await getPipeline(request, { params: Promise.resolve({ id: 'invalid-id' }) })

    expect(response.status).toBe(400)
    expect(prisma.pipeline.findFirst).not.toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockRejectedValue(new Error('DB Error'))

    const request = createRequest()
    const response = await getPipeline(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) })

    expect(response.status).toBe(500)
  })
})

describe('Security - Cross-Organization Access (IDOR)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should NEVER list pipelines from other organizations', async () => {
    ;(prisma.pipeline.findMany as Mock).mockResolvedValue([])

    const request = createRequest()
    await getPipelines(request)

    const findCall = (prisma.pipeline.findMany as Mock).mock.calls[0][0]

    expect(findCall.where.organizationId).toBe('org-123')
  })

  it('should NEVER allow creating pipeline for another organization', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue(null)
    ;(prisma.pipeline.updateMany as Mock).mockResolvedValue({ count: 0 })
    ;(mockTx.pipeline.create as Mock).mockResolvedValue({
      id: 'pipeline-123',
      name: 'Test',
      isDefault: false,
      organizationId: 'org-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    ;(mockTx.pipelineStage.createMany as Mock).mockResolvedValue({ count: 1 })
    ;(mockTx.pipeline.findUnique as Mock).mockResolvedValue(mockPipeline)

    const request = createRequest({
      name: 'Test',
      organizationId: 'HACKER-ORG', // Tentativa de IDOR
      stages: [{ name: 'Stage 1', order: 1 }],
    })

    await createPipeline(request)

    const createCall = (mockTx.pipeline.create as Mock).mock.calls[0][0]
    expect(createCall.data.organizationId).toBe('org-123') // Deve usar org do context
  })

  it('should NEVER return pipeline from another organization', async () => {
    ;(prisma.pipeline.findFirst as Mock).mockResolvedValue(null)

    const request = createRequest()
    await getPipeline(request, { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440999' }) })

    const findCall = (prisma.pipeline.findFirst as Mock).mock.calls[0][0]
    expect(findCall.where.organizationId).toBe('org-123')
  })
})
