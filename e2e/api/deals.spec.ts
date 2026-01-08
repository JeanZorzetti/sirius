import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

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
        plan: 'PRO'
      }
    })
    testOrganizationId = org.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'dealsapitest@example.com',
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
            { name: 'Test Stage', order: 0 }
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
    const { generateApiKey } = await import('@/lib/api-keys')
    const keyResult = await generateApiKey(testOrganizationId, 'Test Key')
    apiKey = keyResult.key
  })

  test.afterAll(async () => {
    // Cleanup
    await prisma.deal.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.contact.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.stage.deleteMany({ where: { pipeline: { organizationId: testOrganizationId } } })
    await prisma.pipeline.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.apiKey.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.user.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.organization.delete({ where: { id: testOrganizationId } })
  })

  test('should list deals with pagination', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/deals', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('deals')
    expect(data.data).toHaveProperty('pagination')
    expect(data.data.pagination).toHaveProperty('page')
    expect(data.data.pagination).toHaveProperty('limit')
    expect(data.data.pagination).toHaveProperty('total')
    expect(data.data.pagination).toHaveProperty('totalPages')
    expect(Array.isArray(data.data.deals)).toBeTruthy()
  })

  test('should create deal', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/deals', {
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
    expect(data.data.deal).toHaveProperty('id')
    expect(data.data.deal.title).toBe('API Test Deal')
    expect(Number(data.data.deal.value)).toBe(50000)
    expect(data.data.deal.stage.id).toBe(testStageId)
  })

  test('should reject deal creation without title', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/v1/deals', {
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
    const createResponse = await request.post('http://localhost:3000/api/v1/deals', {
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
    const dealId = createData.data.deal.id

    // Get the deal
    const getResponse = await request.get(`http://localhost:3000/api/v1/deals/${dealId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(getResponse.ok()).toBeTruthy()
    const getData = await getResponse.json()
    expect(getData.success).toBe(true)
    expect(getData.data.deal.id).toBe(dealId)
    expect(getData.data.deal.title).toBe('Get Test Deal')
    expect(getData.data.deal).toHaveProperty('notes')
    expect(getData.data.deal).toHaveProperty('activities')
  })

  test('should update deal', async ({ request }) => {
    // Create a deal
    const createResponse = await request.post('http://localhost:3000/api/v1/deals', {
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
    const dealId = createData.data.deal.id

    // Update the deal
    const updateResponse = await request.patch(
      `http://localhost:3000/api/v1/deals/${dealId}`,
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
    expect(updateData.data.deal.title).toBe('Updated Deal Title')
    expect(Number(updateData.data.deal.value)).toBe(85000)
  })

  test('should delete deal', async ({ request }) => {
    // Create a deal
    const createResponse = await request.post('http://localhost:3000/api/v1/deals', {
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
    const dealId = createData.data.deal.id

    // Delete the deal
    const deleteResponse = await request.delete(
      `http://localhost:3000/api/v1/deals/${dealId}`,
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
    const getResponse = await request.get(`http://localhost:3000/api/v1/deals/${dealId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(getResponse.status()).toBe(404)
  })

  test('should filter deals by stageId', async ({ request }) => {
    const response = await request.get(
      `http://localhost:3000/api/v1/deals?stageId=${testStageId}`,
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
    data.data.deals.forEach((deal: any) => {
      expect(deal.stage.id).toBe(testStageId)
    })
  })

  test('should sort deals by value', async ({ request }) => {
    // Create multiple deals with different values
    await request.post('http://localhost:3000/api/v1/deals', {
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

    await request.post('http://localhost:3000/api/v1/deals', {
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
      'http://localhost:3000/api/v1/deals?sortBy=value&order=desc',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    // Verify sorting
    if (data.data.deals.length >= 2) {
      const values = data.data.deals.map((d: any) => Number(d.value))
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i + 1])
      }
    }
  })

  test('should paginate deals correctly', async ({ request }) => {
    // Get first page with limit 2
    const page1Response = await request.get(
      'http://localhost:3000/api/v1/deals?page=1&limit=2',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    const page1Data = await page1Response.json()
    expect(page1Data.data.pagination.page).toBe(1)
    expect(page1Data.data.pagination.limit).toBe(2)
    expect(page1Data.data.deals.length).toBeLessThanOrEqual(2)

    // Get second page
    const page2Response = await request.get(
      'http://localhost:3000/api/v1/deals?page=2&limit=2',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    const page2Data = await page2Response.json()
    expect(page2Data.data.pagination.page).toBe(2)

    // Ensure different results (if we have enough deals)
    if (page1Data.data.deals.length > 0 && page2Data.data.deals.length > 0) {
      expect(page1Data.data.deals[0].id).not.toBe(page2Data.data.deals[0].id)
    }
  })

  test('should include rate limit headers', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/v1/deals', {
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
