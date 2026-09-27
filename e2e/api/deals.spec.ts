import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/lib/api-keys'


/** Unique per worker, so the setup can run again on a retry */
const sufixo = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

test.describe('Deals API', () => {
  let testOrganizationId: string
  let testUserId: string
  let testStageId: string
  let testPipelineId: string
  let testContactId: string
  let apiKey: string

  test.beforeAll(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Deals API Test Org',
        tier: 'PRO',
        slug: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      }
    })
    testOrganizationId = org.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `dealsapitest-${sufixo}@example.com`,
        name: 'Deals API Test User',
        password: 'hashedpassword',
        organizationId: testOrganizationId
      }
    })
    testUserId = user.id

    // Create test pipeline with stage
    const pipeline = await prisma.pipeline.create({
      data: {
        name: 'Test Pipeline',
        isDefault: true,
        organizationId: testOrganizationId,
        stages: {
          create: [
            { name: 'Test Stage', order: 0, organizationId: testOrganizationId }
          ]
        }
      },
      include: {
        stages: true
      }
    })
    testPipelineId = pipeline.id
    testStageId = pipeline.stages[0].id

    // Create test contact
    const contact = await prisma.contact.create({
      data: {
        name: 'Test Contact',
        email: 'testcontact@example.com',
        organizationId: testOrganizationId
      }
    })
    testContactId = contact.id

    // Generate API key
    const keyResult = await generateApiKey(testOrganizationId, 'Test Key')
    apiKey = keyResult.key
  })

  test.afterAll(async () => {
    // Cleanup
    await prisma.deal.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.contact.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.pipelineStage.deleteMany({ where: { pipeline: { organizationId: testOrganizationId } } })
    await prisma.pipeline.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.apiKey.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.user.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.organization.delete({ where: { id: testOrganizationId } })
  })

  test('should list deals with pagination', async ({ request }) => {
    const response = await request.get('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data).toHaveProperty('pagination')
    expect(data.pagination).toHaveProperty('page')
    expect(data.pagination).toHaveProperty('limit')
    expect(data.pagination).toHaveProperty('total')
    expect(data.pagination).toHaveProperty('totalPages')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('should create deal', async ({ request }) => {
    const response = await request.post('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'API Test Deal',
        value: 50000,
        stageId: testStageId,
        contactId: testContactId
      }
    })

    expect(response.status()).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id')
    expect(data.data.title).toBe('API Test Deal')
    expect(Number(data.data.value)).toBe(50000)
    expect(data.data.stage.id).toBe(testStageId)
  })

  test('should reject deal creation without title', async ({ request }) => {
    const response = await request.post('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        value: 50000,
        stageId: testStageId
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  test('should get deal by ID', async ({ request }) => {
    // First create a deal
    const createResponse = await request.post('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Get Test Deal',
        value: 75000,
        stageId: testStageId
      }
    })

    const createData = await createResponse.json()
    const dealId = createData.data.id

    // Get the deal
    const getResponse = await request.get(`/api/v1/deals/${dealId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(getResponse.ok()).toBeTruthy()
    const getData = await getResponse.json()
    expect(getData.success).toBe(true)
    expect(getData.data.id).toBe(dealId)
    expect(getData.data.title).toBe('Get Test Deal')
    expect(getData.data).toHaveProperty('notes')
    expect(getData.data).toHaveProperty('activities')
  })

  test('should update deal', async ({ request }) => {
    // Create a deal
    const createResponse = await request.post('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Update Test Deal',
        value: 60000,
        stageId: testStageId
      }
    })

    const createData = await createResponse.json()
    const dealId = createData.data.id

    // Update the deal
    const updateResponse = await request.patch(
      `/api/v1/deals/${dealId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Updated Deal Title',
          value: 85000
        }
      }
    )

    expect(updateResponse.ok()).toBeTruthy()
    const updateData = await updateResponse.json()
    expect(updateData.success).toBe(true)
    expect(updateData.data.title).toBe('Updated Deal Title')
    expect(Number(updateData.data.value)).toBe(85000)
  })

  test('should delete deal', async ({ request }) => {
    // Create a deal
    const createResponse = await request.post('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Delete Test Deal',
        value: 40000,
        stageId: testStageId
      }
    })

    const createData = await createResponse.json()
    const dealId = createData.data.id

    // Delete the deal
    const deleteResponse = await request.delete(
      `/api/v1/deals/${dealId}`,
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
    const getResponse = await request.get(`/api/v1/deals/${dealId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(getResponse.status()).toBe(404)
  })

  test('should filter deals by stageId', async ({ request }) => {
    const response = await request.get(
      `/api/v1/deals?stageId=${testStageId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)

    // All deals should have the test stage
    data.data.forEach((deal: any) => {
      expect(deal.stage.id).toBe(testStageId)
    })
  })

  test('should sort deals by value', async ({ request }) => {
    // Create multiple deals with different values
    await request.post('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Deal 100k',
        value: 100000,
        stageId: testStageId
      }
    })

    await request.post('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Deal 50k',
        value: 50000,
        stageId: testStageId
      }
    })

    // Get deals sorted by value descending
    const response = await request.get(
      '/api/v1/deals?sortBy=value&order=desc',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    // Verify sorting
    if (data.data.length >= 2) {
      const values = data.data.map((d: any) => Number(d.value))
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i + 1])
      }
    }
  })

  test('should paginate deals correctly', async ({ request }) => {
    // Get first page with limit 2
    const page1Response = await request.get(
      '/api/v1/deals?page=1&limit=2',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    const page1Data = await page1Response.json()
    expect(page1Data.pagination.page).toBe(1)
    expect(page1Data.pagination.limit).toBe(2)
    expect(page1Data.data.length).toBeLessThanOrEqual(2)

    // Get second page
    const page2Response = await request.get(
      '/api/v1/deals?page=2&limit=2',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    const page2Data = await page2Response.json()
    expect(page2Data.pagination.page).toBe(2)

    // Ensure different results (if we have enough deals)
    if (page1Data.data.length > 0 && page2Data.data.length > 0) {
      expect(page1Data.data[0].id).not.toBe(page2Data.data[0].id)
    }
  })

  test('should include rate limit headers', async ({ request }) => {
    const response = await request.get('/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(response.ok()).toBeTruthy()
    expect(response.headers()['x-ratelimit-limit']).toBeDefined()
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined()
    expect(response.headers()['x-ratelimit-reset']).toBeDefined()
  })
})
