import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

test.describe('API Keys Management', () => {
  let testOrganizationId: string
  let testUserId: string
  let authCookie: string

  test.beforeAll(async ({ browser }) => {
    // Create test organization and user
    const org = await prisma.organization.create({
      data: {
        name: 'API Test Org',
        plan: 'PRO'
      }
    })
    testOrganizationId = org.id

    const user = await prisma.user.create({
      data: {
        email: 'apitest@example.com',
        name: 'API Test User',
        password: 'hashedpassword',
        organizationId: testOrganizationId
      }
    })
    testUserId = user.id

    // Get auth cookie by logging in
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'apitest@example.com')
    await page.fill('input[name="password"]', 'hashedpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    const cookies = await context.cookies()
    const sessionCookie = cookies.find(c => c.name.includes('session'))
    if (sessionCookie) {
      authCookie = `${sessionCookie.name}=${sessionCookie.value}`
    }

    await context.close()
  })

  test.afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: testUserId } })
    await prisma.organization.delete({ where: { id: testOrganizationId } })
  })

  test('should list API keys for authenticated user', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/api-keys', {
      headers: {
        Cookie: authCookie
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('apiKeys')
    expect(Array.isArray(data.apiKeys)).toBeTruthy()
  })

  test('should generate new API key', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/api-keys', {
      headers: {
        Cookie: authCookie,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Test API Key'
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('apiKey')
    expect(data.apiKey).toHaveProperty('key')
    expect(data.apiKey.key).toMatch(/^sk_(live|test)_/)
    expect(data.apiKey).toHaveProperty('prefix')
    expect(data.apiKey).toHaveProperty('createdAt')

    // Store for validation test
    test.info().attach('apiKey', {
      body: data.apiKey.key,
      contentType: 'text/plain'
    })
  })

  test('should validate API key', async ({ request }) => {
    // First create an API key
    const createResponse = await request.post('http://localhost:3000/api/v1/api-keys', {
      headers: {
        Cookie: authCookie,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Validation Test Key'
      }
    })

    const createData = await createResponse.json()
    const apiKey = createData.apiKey.key

    // Test using the API key to access deals endpoint
    const testResponse = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(testResponse.ok()).toBeTruthy()
    const testData = await testResponse.json()
    expect(testData.success).toBe(true)
    expect(testData).toHaveProperty('data')
  })

  test('should reject invalid API key', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: 'Bearer sk_test_invalid_key'
      }
    })

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  test('should reject missing Authorization header', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/deals')

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  test('should revoke API key', async ({ request }) => {
    // Create an API key
    const createResponse = await request.post('http://localhost:3000/api/v1/api-keys', {
      headers: {
        Cookie: authCookie,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Revoke Test Key'
      }
    })

    const createData = await createResponse.json()
    const apiKeyId = createData.apiKey.id
    const apiKey = createData.apiKey.key

    // Verify it works
    const testResponse = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })
    expect(testResponse.ok()).toBeTruthy()

    // Revoke the key
    const revokeResponse = await request.delete(
      `http://localhost:3000/api/v1/api-keys/${apiKeyId}`,
      {
        headers: {
          Cookie: authCookie
        }
      }
    )
    expect(revokeResponse.ok()).toBeTruthy()

    // Verify it no longer works
    const reTestResponse = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })
    expect(reTestResponse.status()).toBe(401)
  })

  test('should update lastUsed and requestCount', async ({ request }) => {
    // Create an API key
    const createResponse = await request.post('http://localhost:3000/api/v1/api-keys', {
      headers: {
        Cookie: authCookie,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Usage Tracking Key'
      }
    })

    const createData = await createResponse.json()
    const apiKeyId = createData.apiKey.id
    const apiKey = createData.apiKey.key

    // Make a few API calls
    await request.get('http://localhost:3000/api/v1/deals', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    await request.get('http://localhost:3000/api/v1/contacts', {
      headers: { Authorization: `Bearer ${apiKey}` }
    })

    // Wait a bit for async updates
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check usage stats
    const listResponse = await request.get('http://localhost:3000/api/v1/api-keys', {
      headers: { Cookie: authCookie }
    })

    const listData = await listResponse.json()
    const usedKey = listData.apiKeys.find((k: any) => k.id === apiKeyId)

    expect(usedKey).toBeDefined()
    expect(usedKey.lastUsed).toBeTruthy()
    expect(usedKey.requestCount).toBeGreaterThan(0)
  })

  test('should display masked key in list', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/api-keys', {
      headers: { Cookie: authCookie }
    })

    const data = await response.json()
    if (data.apiKeys.length > 0) {
      const firstKey = data.apiKeys[0]
      expect(firstKey).toHaveProperty('prefix')
      expect(firstKey.prefix).toMatch(/^sk_(live|test)_/)
      // Full key should NOT be returned in list
      expect(firstKey).not.toHaveProperty('keyHash')
    }
  })
})
