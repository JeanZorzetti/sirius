import {
  generateTestUUID,
  createMockSession,
  createMockOrganization,
  createMockUser,
  createMockDeal,
  createMockContact,
  createMockPipelineStage,
} from './test-utils'

describe('Test Utilities', () => {
  describe('generateTestUUID', () => {
    it('should generate a valid UUID', () => {
      const uuid = generateTestUUID()
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateTestUUID()
      const uuid2 = generateTestUUID()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('createMockSession', () => {
    it('should create a session with default values', () => {
      const session = createMockSession()
      expect(session).toHaveProperty('user')
      expect(session.user).toHaveProperty('id')
      expect(session.user).toHaveProperty('email')
      expect(session.user).toHaveProperty('name')
      expect(session.user).toHaveProperty('organizationId')
      expect(session).toHaveProperty('expires')
    })

    it('should allow overriding default values', () => {
      const session = createMockSession({
        email: 'custom@example.com',
        name: 'Custom User',
      })
      expect(session.user.email).toBe('custom@example.com')
      expect(session.user.name).toBe('Custom User')
    })
  })

  describe('createMockOrganization', () => {
    it('should create an organization with default values', () => {
      const org = createMockOrganization()
      expect(org).toHaveProperty('id')
      expect(org).toHaveProperty('name')
      expect(org).toHaveProperty('slug')
      expect(org.name).toBe('Test Organization')
    })

    it('should allow overriding default values', () => {
      const org = createMockOrganization({ name: 'Custom Org' })
      expect(org.name).toBe('Custom Org')
    })
  })

  describe('createMockUser', () => {
    it('should create a user with default values', () => {
      const user = createMockUser()
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('name')
      expect(user).toHaveProperty('password')
      expect(user).toHaveProperty('organizationId')
      expect(user).toHaveProperty('orgRole')
      expect(user.orgRole).toBe('OWNER')
    })

    it('should allow setting orgRole to MEMBER', () => {
      const user = createMockUser({ orgRole: 'MEMBER' })
      expect(user.orgRole).toBe('MEMBER')
    })
  })

  describe('createMockDeal', () => {
    it('should create a deal with default values', () => {
      const deal = createMockDeal()
      expect(deal).toHaveProperty('id')
      expect(deal).toHaveProperty('title')
      expect(deal).toHaveProperty('value')
      expect(deal).toHaveProperty('stageId')
      expect(deal).toHaveProperty('organizationId')
      expect(deal.title).toBe('Test Deal')
      expect(deal.value).toBe(5000)
    })

    it('should allow overriding default values', () => {
      const deal = createMockDeal({ title: 'Big Deal', value: 100000 })
      expect(deal.title).toBe('Big Deal')
      expect(deal.value).toBe(100000)
    })
  })

  describe('createMockContact', () => {
    it('should create a contact with default values', () => {
      const contact = createMockContact()
      expect(contact).toHaveProperty('id')
      expect(contact).toHaveProperty('name')
      expect(contact).toHaveProperty('email')
      expect(contact).toHaveProperty('phone')
      expect(contact).toHaveProperty('organizationId')
      expect(contact.name).toBe('Test Contact')
    })

    it('should allow overriding default values', () => {
      const contact = createMockContact({ name: 'John Doe' })
      expect(contact.name).toBe('John Doe')
    })
  })

  describe('createMockPipelineStage', () => {
    it('should create a pipeline stage with default values', () => {
      const stage = createMockPipelineStage()
      expect(stage).toHaveProperty('id')
      expect(stage).toHaveProperty('name')
      expect(stage).toHaveProperty('order')
      expect(stage).toHaveProperty('organizationId')
      expect(stage.name).toBe('Test Stage')
      expect(stage.order).toBe(0)
    })

    it('should allow overriding default values', () => {
      const stage = createMockPipelineStage({ name: 'Closing', order: 5 })
      expect(stage.name).toBe('Closing')
      expect(stage.order).toBe(5)
    })
  })
})
