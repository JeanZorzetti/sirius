import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  organizationId: z.string().optional(),
  newOrganizationName: z.string().optional(),
  tier: z.enum(['FREE', 'STARTER', 'PRO', 'BUSINESS']).default('FREE'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
})

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    // Verify user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12)

    let organizationId = validatedData.organizationId

    // Helper to generate slug
    const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50) + '-' + Date.now().toString(36)
    }

    // Create new organization if specified
    if (!organizationId && validatedData.newOrganizationName) {
      const newOrg = await prisma.organization.create({
        data: {
          name: validatedData.newOrganizationName,
          slug: generateSlug(validatedData.newOrganizationName),
          tier: validatedData.tier,
          plan: validatedData.tier, // Keep in sync for compatibility
        }
      })
      organizationId = newOrg.id
    }

    // If still no organization, create a default one
    if (!organizationId) {
      const defaultOrg = await prisma.organization.create({
        data: {
          name: `${validatedData.name}'s Organization`,
          slug: generateSlug(`${validatedData.name}'s Organization`),
          tier: validatedData.tier,
          plan: validatedData.tier,
        }
      })
      organizationId = defaultOrg.id
    } else {
      // Update existing organization tier if specified
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          tier: validatedData.tier,
          plan: validatedData.tier,
        }
      })
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        organizationId: organizationId,
      },
      include: {
        organization: true
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization?.name,
        tier: user.organization?.tier,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    logger.error({ err: error }, 'Error creating user')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

// GET organizations for dropdown
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ organizations })

  } catch (error) {
    logger.error({ err: error }, 'Error fetching organizations')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
