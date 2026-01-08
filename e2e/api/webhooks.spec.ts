import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

test.describe('Webhooks API', () => {
  let testOrganizationId: string
  let testUserId: string
  let apiKey: string

  test.beforeAll(async () => {
    // Create PRO organization (webhooks are PRO only)
    const org = await prisma.organization.create({
      data: {
        name: 'Webhooks API Test Org',
        plan: 'PRO'
      }
    })
    testOrganizationId = org.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'webhooksapitest@example.com',
        name: 'Webhooks API Test User',
        password: 'hashedpassword',
        organizationId: testOrganizationId
      }
    })
    testUserId = user.id

    // Generate API key
    const { generateApiKey } = await import('@/lib/api-keys')
    const keyResult = await generateApiKey(testOrganizationId, 'Test Key')
    apiKey = keyResult.key
  })

  test.afterAll(async () => {
    // Cleanup webhooks and their logs
    await prisma.webhookLog.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.webhook.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.apiKey.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.user.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.organization.delete({ where: { id: testOrganizationId } })
  })

  test('should list webhooks', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('webhooks')
    expect(Array.isArray(data.webhooks)).toBeTruthy()
  })

  test('should reject webhooks for FREE plan', async ({ request }) => {
    // Create a FREE organization
    const freeOrg = await prisma.organization.create({
      data: {
        name: 'Free Org',
        plan: 'FREE'
      }
    })

    const freeUser = await prisma.user.create({
      data: {
        email: 'freeuser@example.com',
        name: 'Free User',
        password: 'hashedpassword',
        organizationId: freeOrg.id
      }
    })

    // Generate API key for FREE org
    const { generateApiKey } = await import('@/lib/api-keys')
    const freeKeyResult = await generateApiKey(freeOrg.id, 'Free Key')

    const response = await request.get('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${freeKeyResult.key}`
      }
    })

    expect(response.status()).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('PRO')

    // Cleanup
    await prisma.apiKey.deleteMany({ where: { organizationId: freeOrg.id } })
    await prisma.user.delete({ where: { id: freeUser.id } })
    await prisma.organization.delete({ where: { id: freeOrg.id } })
  })

  test('should create webhook with valid URL and events', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'https://example.com/webhook',
        description: 'Test webhook',
        events: ['deal.created', 'deal.updated', 'contact.created']
      }
    })

    expect(response.status()).toBe(201)
    const data = await response.json()
    expect(data.webhook).toHaveProperty('id')
    expect(data.webhook.url).toBe('https://example.com/webhook')
    expect(data.webhook.description).toBe('Test webhook')
    expect(data.webhook.enabled).toBe(true)
    expect(data.webhook.events).toEqual(['deal.created', 'deal.updated', 'contact.created'])
  })

  test('should reject webhook with non-HTTPS URL', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'http://example.com/webhook',
        events: ['deal.created']
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  test('should reject webhook without events', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'https://example.com/webhook',
        events: []
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  test('should reject webhook with invalid event types', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'https://example.com/webhook',
        events: ['invalid.event', 'another.invalid']
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('inválidos')
  })

  test('should get webhook by ID with secret', async ({ request }) => {
    // Create a webhook
    const createResponse = await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'https://example.com/webhook-get-test',
        events: ['deal.created']
      }
    })

    const createData = await createResponse.json()
    const webhookId = createData.webhook.id

    // Get webhook details
    const getResponse = await request.get(`http://localhost:3000/api/v1/webhooks/${webhookId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(getResponse.ok()).toBeTruthy()
    const getData = await getResponse.json()
    expect(getData.webhook.id).toBe(webhookId)
    expect(getData.webhook).toHaveProperty('secret')
    expect(getData.webhook.secret).toBeTruthy()
  })

  test('should update webhook', async ({ request }) => {
    // Create a webhook
    const createResponse = await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'https://example.com/webhook-update',
        events: ['deal.created']
      }
    })

    const createData = await createResponse.json()
    const webhookId = createData.webhook.id

    // Update webhook
    const updateResponse = await request.patch(
      `http://localhost:3000/api/v1/webhooks/${webhookId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          description: 'Updated description',
          events: ['deal.created', 'deal.updated', 'deal.deleted'],
          enabled: false
        }
      }
    )

    expect(updateResponse.ok()).toBeTruthy()
    const updateData = await updateResponse.json()
    expect(updateData.webhook.description).toBe('Updated description')
    expect(updateData.webhook.events).toEqual(['deal.created', 'deal.updated', 'deal.deleted'])
    expect(updateData.webhook.enabled).toBe(false)
  })

  test('should delete webhook', async ({ request }) => {
    // Create a webhook
    const createResponse = await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'https://example.com/webhook-delete',
        events: ['deal.created']
      }
    })

    const createData = await createResponse.json()
    const webhookId = createData.webhook.id

    // Delete webhook
    const deleteResponse = await request.delete(
      `http://localhost:3000/api/v1/webhooks/${webhookId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    expect(deleteResponse.ok()).toBeTruthy()
    const deleteData = await deleteResponse.json()
    expect(deleteData.success).toBe(true)

    // Verify it's gone
    const getResponse = await request.get(`http://localhost:3000/api/v1/webhooks/${webhookId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(getResponse.status()).toBe(404)
  })

  test('should get webhook logs with pagination', async ({ request }) => {
    // Create a webhook
    const createResponse = await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'https://example.com/webhook-logs',
        events: ['deal.created']
      }
    })

    const createData = await createResponse.json()
    const webhookId = createData.webhook.id

    // Get logs
    const logsResponse = await request.get(
      `http://localhost:3000/api/v1/webhooks/${webhookId}/logs?page=1&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    expect(logsResponse.ok()).toBeTruthy()
    const logsData = await logsResponse.json()
    expect(logsData.data).toHaveProperty('logs')
    expect(logsData.data).toHaveProperty('pagination')
    expect(Array.isArray(logsData.data.logs)).toBeTruthy()
  })

  test('should list only webhooks for own organization', async ({ request }) => {
    // Create another organization
    const otherOrg = await prisma.organization.create({
      data: {
        name: 'Other Org',
        plan: 'PRO'
      }
    })

    const otherUser = await prisma.user.create({
      data: {
        email: 'otheruser@example.com',
        name: 'Other User',
        password: 'hashedpassword',
        organizationId: otherOrg.id
      }
    })

    // Generate API key for other org
    const { generateApiKey } = await import('@/lib/api-keys')
    const otherKeyResult = await generateApiKey(otherOrg.id, 'Other Key')

    // Create webhook for other org
    await request.post('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${otherKeyResult.key}`,
        'Content-Type': 'application/json'
      },
      data: {
        url: 'https://example.com/other-webhook',
        events: ['deal.created']
      }
    })

    // List webhooks with test org's key
    const testResponse = await request.get('http://localhost:3000/api/v1/webhooks', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    const testData = await testResponse.json()

    // Verify we don't see other org's webhooks
    const otherWebhooks = testData.webhooks.filter(
      (w: any) => w.url === 'https://example.com/other-webhook'
    )
    expect(otherWebhooks.length).toBe(0)

    // Cleanup
    await prisma.webhook.deleteMany({ where: { organizationId: otherOrg.id } })
    await prisma.apiKey.deleteMany({ where: { organizationId: otherOrg.id } })
    await prisma.user.delete({ where: { id: otherUser.id } })
    await prisma.organization.delete({ where: { id: otherOrg.id } })
  })
})
