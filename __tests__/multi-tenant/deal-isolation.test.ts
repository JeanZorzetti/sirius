import { vi } from 'vitest'
import { createMockUser, createMockOrganization, createMockDeal, generateTestUUID } from '../helpers/test-utils'

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  deal: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock auth
const mockSession = {
  user: null as any,
}

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession.user ? { user: mockSession.user } : null)),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  generateCorrelationId: () => 'test-correlation-id',
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  trackCreateDeal: vi.fn(),
}))

describe('Deal Data Isolation', () => {
  let org1: ReturnType<typeof createMockOrganization>
  let org2: ReturnType<typeof createMockOrganization>
  let user1: ReturnType<typeof createMockUser>
  let user2: ReturnType<typeof createMockUser>

  beforeEach(() => {
    vi.clearAllMocks()

    // Create two separate organizations
    org1 = createMockOrganization({ name: 'Organization 1' })
    org2 = createMockOrganization({ name: 'Organization 2' })

    // Create users in each organization
    user1 = createMockUser({
      email: 'user1@org1.com',
      organizationId: org1.id,
      orgRole: 'OWNER',
    })

    user2 = createMockUser({
      email: 'user2@org2.com',
      organizationId: org2.id,
      orgRole: 'OWNER',
    })
  })

  describe('getDealDetails - Cross-Organization Access Prevention', () => {
    it('should prevent user from accessing deals from another organization', async () => {
      const { getDealDetails } = await import('@/app/[locale]/dashboard/deals/actions')

      // Create a deal in org2
      const org2Deal = createMockDeal({
        title: 'Org2 Confidential Deal',
        organizationId: org2.id,
        value: 1000000,
      })

      // Authenticate as user1 (org1)
      mockSession.user = user1
      mockPrisma.user.findUnique.mockResolvedValue(user1)
      mockPrisma.deal.findUnique.mockResolvedValue(org2Deal)

      // Try to access org2's deal - should throw error
      await expect(getDealDetails(org2Deal.id)).rejects.toThrow()
    })

    it('should allow user to access deals from their own organization', async () => {
      const { getDealDetails } = await import('@/app/[locale]/dashboard/deals/actions')

      // Create a deal in org1 with all required nested objects
      const org1Deal = createMockDeal({
        title: 'Org1 Deal',
        organizationId: org1.id,
      })

      const stage = {
        id: generateTestUUID(),
        name: 'Lead',
        order: 0,
        organizationId: org1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Authenticate as user1 (org1)
      mockSession.user = user1
      mockPrisma.user.findUnique.mockResolvedValue(user1)
      mockPrisma.deal.findUnique.mockResolvedValue({
        ...org1Deal,
        stage,
        contact: null,
        user: user1,
        notes: [],
        activities: [],
        tags: [],
      })

      const deal = await getDealDetails(org1Deal.id)
      expect(deal).toBeDefined()
      expect(deal.id).toBe(org1Deal.id)
      expect(deal.organizationId).toBe(org1.id)
    })
  })

  describe('createDeal - Organization Enforcement', () => {
    it.skip('should automatically set organizationId from authenticated user', async () => {
      const { createDeal } = await import('@/app/[locale]/dashboard/actions')

      const stageId = generateTestUUID()
      const contactId = generateTestUUID()

      mockSession.user = user1
      mockPrisma.user.findUnique.mockResolvedValue({
        ...user1,
        organization: org1,
      })
      mockPrisma.deal.count.mockResolvedValue(5) // Under limit

      const createdDeal = createMockDeal({
        title: 'New Deal',
        value: 5000,
        stageId,
        contactId,
        organizationId: org1.id,
      })

      const stage = {
        id: stageId,
        name: 'Lead',
        order: 0,
        organizationId: org1.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.deal.create.mockResolvedValue({
        ...createdDeal,
        stage,
        contact: null,
        user: user1,
      })

      const formData = new FormData()
      formData.append('title', 'New Deal')
      formData.append('value', '5000')
      formData.append('stageId', stageId)
      formData.append('contactId', contactId)

      const result = await createDeal(formData)

      // Verify organizationId was set from user, not from form data
      expect(mockPrisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: org1.id,
          }),
        })
      )

      expect(result.success).toBe(true)
      expect(result.dealId).toBe(createdDeal.id)
    })
  })

  describe('updateDeal - Cross-Organization Modification Prevention', () => {
    it('should prevent updating deals from another organization', async () => {
      const { updateDeal } = await import('@/app/[locale]/dashboard/actions')

      // Create a deal in org2
      const org2Deal = createMockDeal({
        title: 'Org2 Deal',
        organizationId: org2.id,
      })

      // Authenticate as user1 (org1)
      mockSession.user = user1
      mockPrisma.user.findUnique.mockResolvedValue(user1)
      mockPrisma.deal.findUnique.mockResolvedValue(org2Deal)

      const formData = new FormData()
      formData.append('id', org2Deal.id)
      formData.append('title', 'Hacked Title')

      // Try to update org2's deal - should return error
      const result = await updateDeal(formData)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('deleteDeal - Cross-Organization Deletion Prevention', () => {
    it('should prevent deleting deals from another organization', async () => {
      const { deleteDeal } = await import('@/app/[locale]/dashboard/actions')

      // Create a deal in org2
      const org2Deal = createMockDeal({
        title: 'Org2 Deal',
        organizationId: org2.id,
      })

      // Authenticate as user1 (org1)
      mockSession.user = user1
      mockPrisma.user.findUnique.mockResolvedValue(user1)
      mockPrisma.deal.findUnique.mockResolvedValue(org2Deal)

      // Try to delete org2's deal - should return error
      const result = await deleteDeal(org2Deal.id)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('IDOR Attack Prevention', () => {
    it('should prevent IDOR attack via deal ID guessing', async () => {
      const { getDealDetails } = await import('@/app/[locale]/dashboard/deals/actions')

      // Simulated attack scenario:
      // Attacker (user1 from org1) tries to access victim's deal (org2) by guessing/enumerating IDs
      const victimDeal = createMockDeal({
        title: 'Secret M&A Deal - Confidential',
        organizationId: org2.id,
        value: 50000000, // High-value deal
      })

      mockSession.user = user1
      mockPrisma.user.findUnique.mockResolvedValue(user1)
      mockPrisma.deal.findUnique.mockResolvedValue(victimDeal)

      // Attack should be prevented by organization mismatch check
      await expect(getDealDetails(victimDeal.id)).rejects.toThrow()

      // Verify the deal was found (so it's not a "not found" error)
      expect(mockPrisma.deal.findUnique).toHaveBeenCalledWith({
        where: { id: victimDeal.id },
        include: expect.any(Object),
      })
    })
  })

  describe('Authorization Checks', () => {
    it('should reject unauthenticated requests', async () => {
      const { getDealDetails } = await import('@/app/[locale]/dashboard/deals/actions')

      // No session
      mockSession.user = null

      await expect(getDealDetails(generateTestUUID())).rejects.toThrow('Unauthorized')
    })

    it('should reject requests with invalid user', async () => {
      const { getDealDetails } = await import('@/app/[locale]/dashboard/deals/actions')

      // Invalid user in session
      mockSession.user = { email: 'invalid@example.com' }
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(getDealDetails(generateTestUUID())).rejects.toThrow('Unauthorized')
    })
  })
})
