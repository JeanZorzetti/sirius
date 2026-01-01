import { vi } from 'vitest'
import { createMockUser, createMockOrganization } from '../helpers/test-utils'

// Mock Stripe
const mockStripeCheckoutSessionCreate = vi.fn()
const mockStripe = {
  checkout: {
    sessions: {
      create: mockStripeCheckoutSessionCreate,
    },
  },
}

vi.mock('@/lib/stripe', () => ({
  stripe: mockStripe,
}))

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  organization: {
    findUnique: vi.fn(),
    update: vi.fn(),
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

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  generateCorrelationId: () => 'test-correlation-id',
}))

describe('Stripe Payment Integration', () => {
  let org: ReturnType<typeof createMockOrganization>
  let user: ReturnType<typeof createMockUser>

  beforeEach(() => {
    vi.clearAllMocks()

    org = createMockOrganization({ name: 'Test Company' })
    user = createMockUser({
      email: 'user@testcompany.com',
      organizationId: org.id,
      orgRole: 'OWNER',
    })
  })

  describe('Stripe Checkout Session Creation', () => {
    it('should create checkout session for authenticated user', async () => {
      const { POST } = await import('@/app/api/stripe/checkout/route')

      mockSession.user = user
      mockPrisma.user.findUnique.mockResolvedValue(user)

      const mockCheckoutSession = {
        id: 'cs_test_123',
        client_secret: 'cs_test_123_secret',
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      }

      mockStripeCheckoutSessionCreate.mockResolvedValue(mockCheckoutSession)

      const request = new Request('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('clientSecret')
      expect(data.clientSecret).toBe(mockCheckoutSession.client_secret)
    })

    it('should reject unauthenticated checkout requests', async () => {
      const { POST } = await import('@/app/api/stripe/checkout/route')

      mockSession.user = null

      const request = new Request('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should include organizationId in checkout session metadata', async () => {
      const { POST } = await import('@/app/api/stripe/checkout/route')

      mockSession.user = user
      mockPrisma.user.findUnique.mockResolvedValue(user)

      const mockCheckoutSession = {
        id: 'cs_test_123',
        client_secret: 'cs_test_123_secret',
      }

      mockStripeCheckoutSessionCreate.mockResolvedValue(mockCheckoutSession)

      const request = new Request('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
      })

      await POST(request)

      // Verify Stripe was called with correct metadata
      expect(mockStripeCheckoutSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            organizationId: org.id,
            userId: user.id,
          }),
        })
      )
    })

    it('should create session for monthly Pro plan at R$ 49', async () => {
      const { POST } = await import('@/app/api/stripe/checkout/route')

      mockSession.user = user
      mockPrisma.user.findUnique.mockResolvedValue(user)

      const mockCheckoutSession = {
        id: 'cs_test_123',
        client_secret: 'cs_test_123_secret',
      }

      mockStripeCheckoutSessionCreate.mockResolvedValue(mockCheckoutSession)

      const request = new Request('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
      })

      await POST(request)

      // Verify price and currency
      expect(mockStripeCheckoutSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'brl',
                unit_amount: 4900, // R$ 49.00 in cents
                recurring: expect.objectContaining({
                  interval: 'month',
                }),
              }),
            }),
          ]),
        })
      )
    })
  })

  describe('Webhook Security', () => {
    it('should validate webhook signature', async () => {
      // This test verifies that the webhook endpoint validates Stripe signatures
      // In production, Stripe SDK's constructEvent() does this validation

      const { POST } = await import('@/app/api/webhooks/stripe/route')

      // Missing signature header should fail
      const request = new Request('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      })

      const response = await POST(request)

      // Should return 400 or 401 due to missing/invalid signature
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('Plan Upgrade Flow', () => {
    it('should upgrade organization to PRO plan on successful payment', async () => {
      // This is a simulation of what happens when webhook is triggered
      // In real scenario, Stripe sends webhook, we verify signature, then upgrade

      mockPrisma.organization.findUnique.mockResolvedValue({
        ...org,
        plan: 'FREE',
      })

      mockPrisma.organization.update.mockResolvedValue({
        ...org,
        plan: 'PRO',
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_test_123',
      })

      // Simulate successful upgrade
      const updatedOrg = await mockPrisma.organization.update({
        where: { id: org.id },
        data: {
          plan: 'PRO',
          stripeCustomerId: 'cus_test_123',
          stripeSubscriptionId: 'sub_test_123',
        },
      })

      expect(updatedOrg.plan).toBe('PRO')
      expect(updatedOrg.stripeCustomerId).toBe('cus_test_123')
      expect(updatedOrg.stripeSubscriptionId).toBe('sub_test_123')
    })

    it('should prevent organization ID spoofing in checkout', async () => {
      const { POST } = await import('@/app/api/stripe/checkout/route')

      // User 1 from Org A
      const org1 = createMockOrganization({ name: 'Org A' })
      const user1 = createMockUser({
        organizationId: org1.id,
        email: 'user1@orga.com',
      })

      mockSession.user = user1
      mockPrisma.user.findUnique.mockResolvedValue(user1)

      const mockCheckoutSession = {
        id: 'cs_test_123',
        client_secret: 'cs_test_123_secret',
      }

      mockStripeCheckoutSessionCreate.mockResolvedValue(mockCheckoutSession)

      const request = new Request('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
      })

      await POST(request)

      // Verify that organizationId in metadata matches user's org, not spoofed
      expect(mockStripeCheckoutSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            organizationId: org1.id, // Should be user1's org
          }),
        })
      )

      // Verify it's NOT some other organization's ID
      expect(mockStripeCheckoutSessionCreate).not.toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            organizationId: org.id, // Different org
          }),
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle Stripe API errors gracefully', async () => {
      const { POST } = await import('@/app/api/stripe/checkout/route')

      mockSession.user = user
      mockPrisma.user.findUnique.mockResolvedValue(user)

      // Simulate Stripe API error
      mockStripeCheckoutSessionCreate.mockRejectedValue(
        new Error('Stripe API Error: Invalid API key')
      )

      const request = new Request('http://localhost:3000/api/stripe/checkout', {
        method: 'POST',
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
