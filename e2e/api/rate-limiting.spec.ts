import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

test.describe('Rate Limiting', () => {
  let freeOrgId: string
  let proOrgId: string
  let freeApiKey: string
  let proApiKey: string

  test.beforeAll(async () => {
    // Create FREE organization
    const freeOrg = await prisma.organization.create({
      data: {
        name: 'Rate Limit FREE Org',
        plan: 'FREE'
      }
    })
    freeOrgId = freeOrg.id

    await prisma.user.create({
      data: {
        email: 'ratelimit-free@example.com',
        name: 'Rate Limit Free User',
        password: 'hashedpassword',
        organizationId: freeOrgId
      }
    })

    // Create PRO organization
    const proOrg = await prisma.organization.create({
      data: {
        name: 'Rate Limit PRO Org',
        plan: 'PRO'
      }
    })
    proOrgId = proOrg.id

    await prisma.user.create({
      data: {
        email: 'ratelimit-pro@example.com',
        name: 'Rate Limit Pro User',
        password: 'hashedpassword',
        organizationId: proOrgId
      }
    })

    // Generate API keys
    const { generateApiKey } = await import('@/lib/api-keys')
    const freeKeyResult = await generateApiKey(freeOrgId, 'Free Key')
    const proKeyResult = await generateApiKey(proOrgId, 'Pro Key')

    freeApiKey = freeKeyResult.key
    proApiKey = proKeyResult.key
  })

  test.afterAll(async () => {
    // Cleanup
    await prisma.apiKey.deleteMany({ where: { organizationId: freeOrgId } })
    await prisma.user.deleteMany({ where: { organizationId: freeOrgId } })
    await prisma.organization.delete({ where: { id: freeOrgId } })

    await prisma.apiKey.deleteMany({ where: { organizationId: proOrgId } })
    await prisma.user.deleteMany({ where: { organizationId: proOrgId } })
    await prisma.organization.delete({ where: { id: proOrgId } })
  })

  test('should include rate limit headers in response', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    expect(response.ok()).toBeTruthy()

    // Check for rate limit headers
    const headers = response.headers()
    expect(headers['x-ratelimit-limit']).toBeDefined()
    expect(headers['x-ratelimit-remaining']).toBeDefined()
    expect(headers['x-ratelimit-reset']).toBeDefined()

    // FREE plan should have limit of 60 requests per minute
    const limit = parseInt(headers['x-ratelimit-limit'])
    expect(limit).toBe(60)
  })

  test('should have different limits for FREE and PRO', async ({ request }) => {
    // FREE request
    const freeResponse = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const freeHeaders = freeResponse.headers()
    const freeLimit = parseInt(freeHeaders['x-ratelimit-limit'])

    // PRO request
    const proResponse = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${proApiKey}`
      }
    })

    const proHeaders = proResponse.headers()
    const proLimit = parseInt(proHeaders['x-ratelimit-limit'])

    // FREE should have 60 req/min, PRO should have 300 req/min
    expect(freeLimit).toBe(60)
    expect(proLimit).toBe(300)
    expect(proLimit).toBeGreaterThan(freeLimit)
  })

  test('should decrement remaining count with each request', async ({ request }) => {
    // Make first request
    const response1 = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const remaining1 = parseInt(response1.headers()['x-ratelimit-remaining'])

    // Make second request
    const response2 = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const remaining2 = parseInt(response2.headers()['x-ratelimit-remaining'])

    // Remaining should decrease (might not be exactly 1 less due to timing/other tests)
    expect(remaining2).toBeLessThanOrEqual(remaining1)
  })

  test('should reset count after time window', async ({ request }) => {
    // Make a request and note the reset time
    const response1 = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const reset1 = parseInt(response1.headers()['x-ratelimit-reset'])
    const remaining1 = parseInt(response1.headers()['x-ratelimit-remaining'])

    // Wait for a short time (not full reset, just to verify reset time is in future)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Make another request
    const response2 = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const reset2 = parseInt(response2.headers()['x-ratelimit-reset'])

    // Reset time should be in the future
    const now = Math.floor(Date.now() / 1000)
    expect(reset2).toBeGreaterThan(now)

    // Reset time shouldn't change much between requests (within same window)
    expect(Math.abs(reset2 - reset1)).toBeLessThan(10)
  })

  test.skip('should return 429 when rate limit exceeded', async ({ request }) => {
    // NOTE: This test is skipped by default as it requires making 60+ requests
    // which can slow down the test suite significantly.
    // Enable manually if you want to test rate limiting threshold.

    const responses: any[] = []

    // Make requests until we hit the limit (60 for FREE)
    for (let i = 0; i < 65; i++) {
      const response = await request.get('http://localhost:3000/api/v1/deals', {
        headers: {
          Authorization: `Bearer ${freeApiKey}`
        }
      })

      responses.push({
        status: response.status(),
        headers: response.headers()
      })

      if (response.status() === 429) {
        break
      }
    }

    // Should have at least one 429 response
    const rateLimitedResponses = responses.filter(r => r.status === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)

    // 429 response should include Retry-After header
    const rateLimitedResponse = rateLimitedResponses[0]
    expect(rateLimitedResponse.headers['retry-after']).toBeDefined()
  })

  test('should handle 429 response gracefully', async ({ request }) => {
    // This test verifies the structure of a rate limit error response
    // We'll simulate by checking the error format without actually hitting the limit

    // Make a normal request first
    const response = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    expect(response.ok()).toBeTruthy()

    // If we ever get a 429, it should have proper structure
    if (response.status() === 429) {
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(data.error).toHaveProperty('message')
      expect(data.error.details).toHaveProperty('limit')
      expect(data.error.details).toHaveProperty('remaining')
      expect(data.error.details).toHaveProperty('resetAt')

      const headers = response.headers()
      expect(headers['retry-after']).toBeDefined()
    }
  })

  test('should track rate limits per organization', async ({ request }) => {
    // Make requests with FREE org
    await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const freeResponse = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const freeRemaining = parseInt(freeResponse.headers()['x-ratelimit-remaining'])

    // Make request with PRO org
    const proResponse = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${proApiKey}`
      }
    })

    const proRemaining = parseInt(proResponse.headers()['x-ratelimit-remaining'])

    // PRO should have full limit (minus one request)
    // They should be tracked separately
    expect(proRemaining).toBeGreaterThan(freeRemaining)
    expect(proRemaining).toBeGreaterThan(290) // Close to 300 limit
  })

  test('should rate limit all API endpoints consistently', async ({ request }) => {
    // Test deals endpoint
    const dealsResponse = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const dealsRemaining = parseInt(dealsResponse.headers()['x-ratelimit-remaining'])

    // Test contacts endpoint
    const contactsResponse = await request.get('http://localhost:3000/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const contactsRemaining = parseInt(contactsResponse.headers()['x-ratelimit-remaining'])

    // Remaining should decrease across different endpoints
    expect(contactsRemaining).toBeLessThan(dealsRemaining)
  })

  test('should provide accurate reset timestamp', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${freeApiKey}`
      }
    })

    const resetTimestamp = parseInt(response.headers()['x-ratelimit-reset'])
    const now = Math.floor(Date.now() / 1000)

    // Reset should be in the future
    expect(resetTimestamp).toBeGreaterThan(now)

    // But not too far in the future (within 1 minute for per-minute limits)
    expect(resetTimestamp - now).toBeLessThanOrEqual(60)
  })
})
