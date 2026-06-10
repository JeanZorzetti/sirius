import { vi } from 'vitest'
import { hash } from 'bcryptjs'
import { createMockUser, createMockOrganization, generateTestUUID } from '../helpers/test-utils'

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  organization: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  pipeline: {
    create: vi.fn(),
  },
  pipelineStage: {
    createMany: vi.fn(),
  },
  emailAutomationSetting: {
    createMany: vi.fn(),
  },
  referral: {
    create: vi.fn(),
  },
  invite: {
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
}

// Mock auth functions
const mockLogin = vi.fn()
const mockLogout = vi.fn()

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      user = mockPrisma.user
      organization = mockPrisma.organization
      pipeline = mockPrisma.pipeline
      pipelineStage = mockPrisma.pipelineStage
      emailAutomationSetting = mockPrisma.emailAutomationSetting
      referral = mockPrisma.referral
      invite = mockPrisma.invite
    },
  }
})

vi.mock('@/lib/email-automations', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
  sendEmailAsync: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
    delete: () => {},
  })),
}))

vi.mock('@/lib/auth', () => ({
  login: mockLogin,
  logout: mockLogout,
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  generateCorrelationId: () => 'test-correlation-id',
}))

describe('Authentication Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerAction', () => {
    it('should reject registration with missing fields', async () => {
      const { registerAction } = await import('@/app/auth/actions')

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      // Missing name and password

      const result = await registerAction(null, formData)

      expect(result).toEqual({ error: 'Preencha todos os campos.' })
    })

    it('should reject registration with existing email', async () => {
      const { registerAction } = await import('@/app/auth/actions')
      const existingUser = createMockUser()

      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      const formData = new FormData()
      formData.append('name', 'New User')
      formData.append('email', 'existing@example.com')
      formData.append('password', 'password123')
      formData.append('company', 'Test Company')

      const result = await registerAction(null, formData)

      expect(result).toEqual({ error: 'Email já cadastrado.' })
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' }
      })
    })

    it('should create new organization and user on successful registration', async () => {
      const { registerAction } = await import('@/app/auth/actions')
      const newOrg = createMockOrganization({ name: 'Test Company' })
      const newUser = createMockUser({
        email: 'newuser@example.com',
        organizationId: newOrg.id,
        orgRole: 'OWNER'
      })

      mockPrisma.user.findUnique.mockResolvedValue(null) // No existing user + referral code free
      mockPrisma.organization.create.mockResolvedValue(newOrg)
      mockPrisma.organization.findUnique.mockResolvedValue(newOrg)
      mockPrisma.pipeline.create.mockResolvedValue({ id: generateTestUUID(), name: 'Pipeline Principal' })
      mockPrisma.pipelineStage.createMany.mockResolvedValue({ count: 5 })
      mockPrisma.emailAutomationSetting.createMany.mockResolvedValue({ count: 4 })
      mockPrisma.user.create.mockResolvedValue(newUser)

      const formData = new FormData()
      formData.append('name', 'New User')
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'password123')
      formData.append('company', 'Test Company')

      // Success: action returns null (client handles the redirect)
      const result = await registerAction(null, formData)
      expect(result).toBeNull()

      // Verify organization creation
      expect(mockPrisma.organization.create).toHaveBeenCalled()

      // Verify default pipeline stages created
      expect(mockPrisma.pipelineStage.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Lead', order: 0 }),
          expect.objectContaining({ name: 'Prospecção', order: 1 }),
          expect.objectContaining({ name: 'Qualificação', order: 2 }),
          expect.objectContaining({ name: 'Proposta', order: 3 }),
          expect.objectContaining({ name: 'Fechamento', order: 4 }),
        ])
      })

      // Verify user creation
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'newuser@example.com',
          name: 'New User',
          password: expect.any(String), // Hashed password
          organizationId: expect.any(String),
          orgRole: 'OWNER',
        })
      })

      // Verify login was called
      expect(mockLogin).toHaveBeenCalledWith({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        organizationId: newUser.organizationId,
      })
    })

    it('should handle invite token correctly', async () => {
      const { registerAction } = await import('@/app/auth/actions')
      const existingOrg = createMockOrganization()
      const invite = {
        id: generateTestUUID(),
        token: 'valid-invite-token',
        email: 'invited@example.com',
        organizationId: existingOrg.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
        organization: existingOrg,
        createdAt: new Date(),
      }
      const newUser = createMockUser({
        email: 'invited@example.com',
        organizationId: existingOrg.id,
        orgRole: 'MEMBER',
      })

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.invite.findUnique.mockResolvedValue(invite)
      mockPrisma.user.create.mockResolvedValue(newUser)
      mockPrisma.invite.delete.mockResolvedValue(invite)

      const formData = new FormData()
      formData.append('name', 'Invited User')
      formData.append('email', 'invited@example.com')
      formData.append('password', 'password123')
      formData.append('inviteToken', 'valid-invite-token')

      try {
        await registerAction(null, formData)
      } catch (error: any) {
        expect(error.message).toContain('NEXT_REDIRECT:/dashboard?new_user=true')
      }

      // Should NOT create a new organization
      expect(mockPrisma.organization.create).not.toHaveBeenCalled()

      // Should create user as MEMBER
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: existingOrg.id,
          orgRole: 'MEMBER',
        })
      })

      // Should delete invite after use
      expect(mockPrisma.invite.delete).toHaveBeenCalledWith({
        where: { token: 'valid-invite-token' }
      })
    })

    it('should reject expired invite token', async () => {
      const { registerAction } = await import('@/app/auth/actions')
      const existingOrg = createMockOrganization()
      const expiredInvite = {
        id: generateTestUUID(),
        token: 'expired-invite-token',
        email: 'invited@example.com',
        organizationId: existingOrg.id,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
        organization: existingOrg,
        createdAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.invite.findUnique.mockResolvedValue(expiredInvite)

      const formData = new FormData()
      formData.append('name', 'Invited User')
      formData.append('email', 'invited@example.com')
      formData.append('password', 'password123')
      formData.append('inviteToken', 'expired-invite-token')

      const result = await registerAction(null, formData)

      expect(result).toEqual({ error: 'Convite expirado.' })
    })
  })

  describe('loginAction', () => {
    it('should reject login with missing fields', async () => {
      const { loginAction } = await import('@/app/auth/actions')

      const formData = new FormData()
      formData.append('email', 'test@example.com')
      // Missing password

      const result = await loginAction(null, formData)

      expect(result).toEqual({ error: 'Preencha todos os campos.' })
    })

    it('should reject login with non-existent user', async () => {
      const { loginAction } = await import('@/app/auth/actions')

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const formData = new FormData()
      formData.append('email', 'nonexistent@example.com')
      formData.append('password', 'password123')

      const result = await loginAction(null, formData)

      expect(result).toEqual({ error: 'Credenciais inválidas.' })
    })

    it('should reject login with invalid password', async () => {
      const { loginAction } = await import('@/app/auth/actions')
      const user = createMockUser({
        email: 'user@example.com',
        password: await hash('correctpassword', 10)
      })

      mockPrisma.user.findUnique.mockResolvedValue(user)

      const formData = new FormData()
      formData.append('email', 'user@example.com')
      formData.append('password', 'wrongpassword')

      const result = await loginAction(null, formData)

      expect(result).toEqual({ error: 'Credenciais inválidas.' })
    })

    it('should successfully login with valid credentials', async () => {
      const { loginAction } = await import('@/app/auth/actions')
      const password = 'correctpassword'
      const hashedPassword = await hash(password, 10)
      const user = createMockUser({
        email: 'user@example.com',
        password: hashedPassword
      })
      const org = createMockOrganization()

      mockPrisma.user.findUnique.mockResolvedValue({
        ...user,
        organization: org
      })

      const formData = new FormData()
      formData.append('email', 'user@example.com')
      formData.append('password', password)

      // Success: action returns null (client handles the redirect)
      const result = await loginAction(null, formData)
      expect(result).toBeNull()

      // Verify login was called
      expect(mockLogin).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
      })
    })
  })

  describe('logoutAction', () => {
    it('should call logout and redirect to login', async () => {
      const { logoutAction } = await import('@/app/auth/actions')

      try {
        await logoutAction()
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('NEXT_REDIRECT:/login')
      }

      expect(mockLogout).toHaveBeenCalled()
    })
  })
})
