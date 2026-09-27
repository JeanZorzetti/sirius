import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/lib/api-keys'


/** Unique per worker, so the setup can run again on a retry */
const sufixo = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

test.describe('Contacts API', () => {
  let testOrganizationId: string
  let testUserId: string
  let apiKey: string

  test.beforeAll(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Contacts API Test Org',
        tier: 'PRO',
        slug: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      }
    })
    testOrganizationId = org.id

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `contactsapitest-${sufixo}@example.com`,
        name: 'Contacts API Test User',
        password: 'hashedpassword',
        organizationId: testOrganizationId
      }
    })
    testUserId = user.id

    // Generate API key
    const keyResult = await generateApiKey(testOrganizationId, 'Test Key')
    apiKey = keyResult.key
  })

  test.afterAll(async () => {
    // Cleanup
    await prisma.contact.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.apiKey.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.user.deleteMany({ where: { organizationId: testOrganizationId } })
    await prisma.organization.delete({ where: { id: testOrganizationId } })
  })

  test('should list contacts with pagination', async ({ request }) => {
    const response = await request.get('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data).toHaveProperty('pagination')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('should create contact', async ({ request }) => {
    const response = await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'ACME Corp'
      }
    })

    expect(response.status()).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('id')
    expect(data.data.name).toBe('John Doe')
    expect(data.data.email).toBe('john@example.com')
    expect(data.data.phone).toBe('+1234567890')
    expect(data.data.company).toBe('ACME Corp')
  })

  test('should reject contact creation without name', async ({ request }) => {
    const response = await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        email: 'noname@example.com'
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  test('should reject duplicate email', async ({ request }) => {
    const uniqueEmail = `unique-${Date.now()}@example.com`

    // Create first contact
    await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'First Contact',
        email: uniqueEmail
      }
    })

    // Try to create second contact with same email
    const response = await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Second Contact',
        email: uniqueEmail
      }
    })

    expect(response.status()).toBe(409)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('CONFLICT')
  })

  test('should get contact by ID', async ({ request }) => {
    // Create a contact
    const createResponse = await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Get Test Contact',
        email: `gettest-${Date.now()}@example.com`
      }
    })

    const createData = await createResponse.json()
    const contactId = createData.data.id

    // Get the contact
    const getResponse = await request.get(`/api/v1/contacts/${contactId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(getResponse.ok()).toBeTruthy()
    const getData = await getResponse.json()
    expect(getData.success).toBe(true)
    expect(getData.data.id).toBe(contactId)
    expect(getData.data.name).toBe('Get Test Contact')
    expect(getData.data).toHaveProperty('deals')
  })

  test('should update contact', async ({ request }) => {
    // Create a contact
    const createResponse = await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Update Test Contact',
        email: `updatetest-${Date.now()}@example.com`
      }
    })

    const createData = await createResponse.json()
    const contactId = createData.data.id

    // Update the contact
    const updateResponse = await request.patch(
      `/api/v1/contacts/${contactId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          name: 'Updated Contact Name',
          company: 'New Company Inc'
        }
      }
    )

    expect(updateResponse.ok()).toBeTruthy()
    const updateData = await updateResponse.json()
    expect(updateData.success).toBe(true)
    expect(updateData.data.name).toBe('Updated Contact Name')
    expect(updateData.data.company).toBe('New Company Inc')
  })

  test('should delete contact without deals', async ({ request }) => {
    // Create a contact
    const createResponse = await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Delete Test Contact',
        email: `deletetest-${Date.now()}@example.com`
      }
    })

    const createData = await createResponse.json()
    const contactId = createData.data.id

    // Delete the contact
    const deleteResponse = await request.delete(
      `/api/v1/contacts/${contactId}`,
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
    const getResponse = await request.get(`/api/v1/contacts/${contactId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    expect(getResponse.status()).toBe(404)
  })

  // The public contacts API has no filter (neither company nor search) yet: product decision pending
  test.fixme('should filter contacts by company', async ({ request }) => {
    const companyName = `TestCompany-${Date.now()}`

    // Create contacts with the same company
    await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Employee 1',
        email: `emp1-${Date.now()}@example.com`,
        company: companyName
      }
    })

    await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Employee 2',
        email: `emp2-${Date.now()}@example.com`,
        company: companyName
      }
    })

    // Filter by company
    const response = await request.get(
      `/api/v1/contacts?company=${encodeURIComponent(companyName)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)

    // All returned contacts should have the test company
    data.data.forEach((contact: any) => {
      if (contact.company) {
        expect(contact.company).toBe(companyName)
      }
    })
  })

  test('should sort contacts by name', async ({ request }) => {
    // Create contacts with different names
    await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Zebra Contact',
        email: `zebra-${Date.now()}@example.com`
      }
    })

    await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Alpha Contact',
        email: `alpha-${Date.now()}@example.com`
      }
    })

    // Get contacts sorted by name ascending
    const response = await request.get(
      '/api/v1/contacts?sortBy=name&order=asc',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    // Verify sorting (at least check first few if we have enough contacts)
    if (data.data.length >= 2) {
      const names = data.data.map((c: any) => c.name)
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i].localeCompare(names[i + 1])).toBeLessThanOrEqual(0)
      }
    }
  })

  test('should validate email format', async ({ request }) => {
    const response = await request.post('/api/v1/contacts', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Invalid Email Contact',
        email: 'not-an-email'
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })
})
