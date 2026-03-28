import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { billingRateLimit } from '@/lib/ratelimit'
import { createCheckoutPreference, CheckoutPlan } from '@/lib/mercadopago'
import logger from '@/lib/logger'
import { SubscriptionTier } from '@prisma/client'

// Vagas por tier de fundador
const FOUNDER_LIMITS: Record<string, { limit: number; tier: SubscriptionTier }> = {
  FOUNDER_STARTER:  { limit: 100, tier: SubscriptionTier.STARTER },
  FOUNDER_PRO:      { limit: 50,  tier: SubscriptionTier.PRO },
  FOUNDER_BUSINESS: { limit: 25,  tier: SubscriptionTier.BUSINESS },
}

/**
 * POST /api/mercadopago/checkout
 * Cria preferência de checkout para planos pagos ou programa de fundadores
 * Body: { plan: 'STARTER' | 'PRO' | 'BUSINESS' | 'FOUNDER_STARTER' | ..., billingPeriod?: 'MONTHLY' | 'ANNUAL' }
 */
export async function POST(request: NextRequest) {
  const blocked = await billingRateLimit(request)
  if (blocked) return blocked

  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Parse body
    let plan: CheckoutPlan = 'STARTER'
    let billingPeriod: 'MONTHLY' | 'ANNUAL' = 'MONTHLY'
    try {
      const body = await request.json()
      if (body?.plan) plan = body.plan as CheckoutPlan
      if (body?.billingPeriod === 'ANNUAL') billingPeriod = 'ANNUAL'
    } catch {
      // No body — default to STARTER MONTHLY
    }

    // Build annual plan key (e.g. STARTER → STARTER_ANNUAL)
    const isFounderPlan = plan.startsWith('FOUNDER_')
    if (billingPeriod === 'ANNUAL' && !isFounderPlan && !plan.endsWith('_ANNUAL')) {
      plan = `${plan}_ANNUAL` as CheckoutPlan
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organization) {
      return NextResponse.json({ error: 'Usuário ou organização não encontrada' }, { status: 404 })
    }

    const org = user.organization

    // Já é fundador — não pode comprar novamente
    if (org.isFounder) {
      return NextResponse.json({ error: 'Organização já é fundadora do Sirius CRM' }, { status: 400 })
    }

    if (isFounderPlan) {
      const founderConfig = FOUNDER_LIMITS[plan]
      if (!founderConfig) {
        return NextResponse.json({ error: 'Plano de fundador inválido' }, { status: 400 })
      }

      // Contar vagas preenchidas para este tier específico
      const filledSpots = await prisma.organization.count({
        where: { isFounder: true, tier: founderConfig.tier }
      })

      if (filledSpots >= founderConfig.limit) {
        return NextResponse.json(
          { error: `Todas as vagas do Fundador ${plan.replace('FOUNDER_', '')} foram preenchidas.` },
          { status: 400 }
        )
      }
    } else {
      // Plano regular — verificar se já está neste tier ou superior
      const baseTier = plan.replace('_ANNUAL', '') as SubscriptionTier
      const tierOrder = [SubscriptionTier.FREE, SubscriptionTier.STARTER, SubscriptionTier.PRO, SubscriptionTier.BUSINESS]
      const currentIdx = tierOrder.indexOf(org.tier as SubscriptionTier)
      const requestedIdx = tierOrder.indexOf(baseTier)
      if (requestedIdx !== -1 && currentIdx >= requestedIdx) {
        return NextResponse.json({ error: 'Organização já está neste plano ou superior' }, { status: 400 })
      }
    }

    // Criar preferência de checkout
    const { preferenceId, initPoint, sandboxInitPoint } = await createCheckoutPreference(
      org.id,
      org.name,
      user.email,
      plan
    )

    await prisma.organization.update({
      where: { id: org.id },
      data: { mercadoPagoPreferenceId: preferenceId }
    })

    logger.info({ organizationId: org.id, preferenceId, plan }, 'Checkout preference created')

    const checkoutUrl = process.env.NODE_ENV === 'production' ? initPoint : (sandboxInitPoint || initPoint)

    return NextResponse.json({ success: true, preferenceId, checkoutUrl })

  } catch (error) {
    logger.error({
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 'Error creating checkout preference')

    return NextResponse.json(
      { error: 'Erro ao criar preferência de checkout', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
