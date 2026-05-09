import { NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SubscriptionTier } from '@prisma/client'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const updateTierSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier),
})

// PUT /api/admin/organizations/[id]/tier - Update organization tier
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    // Only admin/super_admin can update tiers
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return await apiError(ERR.FORBIDDEN, 403)
    }

    const { id } = await params
    const body = await request.json()
    
    // Validate input
    const result = updateTierSchema.safeParse(body)
    if (!result.success) {
      return await apiError(ERR.INVALID_INPUT, 400)
    }

    const { tier } = result.data

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id },
    })

    if (!existingOrg) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // Update the organization tier
    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: { 
        tier,
        plan: tier, // Keep plan field synchronized for backward compatibility
      },
    })

    // Log the change for audit
    logger.info({ orgId: id, previousTier: existingOrg.tier, newTier: tier, adminEmail: session.user.email }, '[ADMIN] Tier updated for organization')

    return NextResponse.json({ 
      success: true, 
      organization: updatedOrg,
      message: `Plano atualizado de ${existingOrg.tier} para ${tier}`
    })
  } catch (error) {
    logger.error({ err: error }, 'Error updating organization tier')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
