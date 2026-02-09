import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SubscriptionTier } from '@prisma/client'
import { z } from 'zod'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin/super_admin can update tiers
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    
    // Validate input
    const result = updateTierSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { tier } = result.data

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id },
    })

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Update the organization tier
    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: { 
        tier,
        // Reset trial if upgrading from FREE
        trialEndsAt: tier !== SubscriptionTier.FREE && existingOrg.tier === SubscriptionTier.FREE
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
          : existingOrg.trialEndsAt,
      },
    })

    // Log the change for audit
    console.log(`[ADMIN] Tier updated for organization ${id}: ${existingOrg.tier} -> ${tier} by ${session.user.email}`)

    return NextResponse.json({ 
      success: true, 
      organization: updatedOrg,
      message: `Plano atualizado de ${existingOrg.tier} para ${tier}`
    })
  } catch (error) {
    console.error('Error updating organization tier:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
