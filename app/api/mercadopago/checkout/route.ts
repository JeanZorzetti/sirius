import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { billingRateLimit } from '@/lib/ratelimit'
import { createCheckoutPreference, createSubscription, CheckoutPlan } from '@/lib/mercadopago'
import logger from '@/lib/logger'
import { SubscriptionTier } from '@prisma/client'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * POST /api/mercadopago/checkout
 * Cria preferência de checkout para planos pagos
 * Body: { plan: 'STARTER' | 'PRO' | 'BUSINESS', billingPeriod?: 'MONTHLY' | 'ANNUAL' }
 */
export async function POST(request: NextRequest) {
  const blocked = await billingRateLimit(request)
  if (blocked) return blocked

  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
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
    const isServicePlan = plan === 'WHATSAPP_SETUP'
    if (billingPeriod === 'ANNUAL' && !isServicePlan && !plan.endsWith('_ANNUAL')) {
      plan = `${plan}_ANNUAL` as CheckoutPlan
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organization) {
      return await apiError(ERR.USER_NOT_FOUND, 404, { req: request })
    }

    const org = user.organization

    // Serviços avulsos (sem tier — só criar preferência)
    if (isServicePlan) {
      const { preferenceId, initPoint, sandboxInitPoint } = await createCheckoutPreference(
        org.id, org.name, user.email, plan
      )
      await prisma.organization.update({
        where: { id: org.id },
        data: { mercadoPagoPreferenceId: preferenceId }
      })
      const checkoutUrl = process.env.NODE_ENV === 'production' ? initPoint : (sandboxInitPoint || initPoint)
      return NextResponse.json({ success: true, preferenceId, checkoutUrl })
    }

    // Verificar se já está neste tier ou superior
    const baseTier = plan.replace('_ANNUAL', '') as SubscriptionTier
    const tierOrder = [SubscriptionTier.FREE, SubscriptionTier.STARTER, SubscriptionTier.PRO, SubscriptionTier.BUSINESS]
    const currentIdx = tierOrder.indexOf(org.tier as SubscriptionTier)
    const requestedIdx = tierOrder.indexOf(baseTier)
    if (requestedIdx !== -1 && currentIdx >= requestedIdx) {
      return NextResponse.json({ error: 'Organização já está neste plano ou superior' }, { status: 400 })
    }

    // Aplicar desconto de indicação acumulado (referralDiscount %) no customPricing para o checkout
    if (org.referralDiscount > 0) {
      const basePrices: Record<string, number> = { STARTER: 67, PRO: 147, BUSINESS: 397 }
      const basePrice = basePrices[baseTier]
      if (basePrice) {
        const effectiveDiscount = Math.min(org.referralDiscount, 100)
        const discountedPrice = parseFloat((basePrice * (1 - effectiveDiscount / 100)).toFixed(2))
        await prisma.organization.update({
          where: { id: org.id },
          data: { customPricing: discountedPrice },
        })
      }
    }

    // Planos mensais de cartão → PreApproval (assinatura recorrente real)
    // Planos anuais e PIX-only → Preference (pagamento único)
    const isMonthlyCardPlan = billingPeriod === 'MONTHLY' && !isServicePlan
    if (isMonthlyCardPlan) {
      const customPrice = org.customPricing && baseTier === 'PRO'
        ? Number(org.customPricing)
        : undefined
      const { subscriptionId, initPoint } = await createSubscription(
        org.id,
        org.name,
        user.email,
        plan,
        customPrice
      )

      await prisma.organization.update({
        where: { id: org.id },
        data: { mercadoPagoSubscriptionId: subscriptionId },
      })

      logger.info({ organizationId: org.id, subscriptionId, plan }, 'Subscription created')
      return NextResponse.json({ success: true, subscriptionId, checkoutUrl: initPoint })
    }

    // Anual / Founder / avulso → preferência de pagamento único
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

    return await apiError(ERR.CREATE_CHECKOUT, 500)
  }
}
