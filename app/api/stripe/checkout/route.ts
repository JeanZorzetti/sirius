import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { billingRateLimit } from '@/lib/ratelimit'
import { CheckoutPlan } from '@/lib/mercadopago'
import { createStripeCheckout, planChange, trocarPreco } from '@/lib/stripe'
import { upgradePlan } from '@/lib/billing-effects'
import logger from '@/lib/logger'
import { SubscriptionTier } from '@prisma/client'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * POST /api/stripe/checkout
 * Cria Checkout Session da Stripe para planos pagos e serviços avulsos.
 * Body: { plan: 'STARTER' | 'PRO' | 'BUSINESS' | ..., billingPeriod?: 'MONTHLY' | 'ANNUAL' }
 * Mesmo contrato da antiga rota /api/mercadopago/checkout (que hoje delega para cá).
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

    // Serviços avulsos (sem tier — pagamento único)
    if (isServicePlan) {
      const { sessionId, checkoutUrl } = await createStripeCheckout({
        organizationId: org.id,
        organizationName: org.name,
        userEmail: user.email,
        plan,
        stripeCustomerId: org.stripeCustomerId,
      })
      return NextResponse.json({ success: true, sessionId, checkoutUrl })
    }

    const baseTier = plan.replace('_ANNUAL', '') as SubscriptionTier
    if (baseTier === SubscriptionTier.FREE) {
      return NextResponse.json({ error: 'Para voltar ao plano gratuito, cancele a assinatura.' }, { status: 400 })
    }

    // Spec 013: a paid org changes the subscription it already has; a second checkout would bill twice
    if (org.stripeSubscriptionId && org.tier !== SubscriptionTier.FREE) {
      return trocarPlano(org, user.role, plan, billingPeriod)
    }
    if (org.tier !== SubscriptionTier.FREE) {
      return NextResponse.json(
        { error: 'Sua assinatura não é pela Stripe. Fale com o suporte para trocar de plano.' },
        { status: 400 },
      )
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

    // customPricing só é honrado para PRO mensal (comportamento herdado do fluxo MP)
    const customPrice = org.customPricing && baseTier === 'PRO' && billingPeriod === 'MONTHLY'
      ? Number(org.customPricing)
      : undefined

    const { sessionId, checkoutUrl } = await createStripeCheckout({
      organizationId: org.id,
      organizationName: org.name,
      userEmail: user.email,
      plan,
      customPrice,
      stripeCustomerId: org.stripeCustomerId,
    })

    logger.info({ organizationId: org.id, sessionId, plan }, 'Stripe checkout created')

    return NextResponse.json({ success: true, sessionId, checkoutUrl })

  } catch (error) {
    logger.error({
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 'Error creating Stripe checkout')

    return await apiError(ERR.CREATE_CHECKOUT, 500)
  }
}

const dataBR = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

/** Spec 013: upgrade charged pro rata now; downgrade scheduled for the next renewal; annual → monthly refused. */
async function trocarPlano(
  org: {
    id: string; name: string; tier: SubscriptionTier; billingPeriod: string
    stripeSubscriptionId: string | null; pendingPlan: string | null; cancelAtPeriodEnd: boolean; customPricing: unknown
  },
  role: string,
  plan: CheckoutPlan,
  billingPeriod: 'MONTHLY' | 'ANNUAL',
) {
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Só o administrador da conta troca de plano.' }, { status: 403 })
  }
  const atual = (org.billingPeriod === 'ANNUAL' ? `${org.tier}_ANNUAL` : org.tier) as CheckoutPlan
  const tipo = planChange(atual, plan)
  const subscriptionId = org.stripeSubscriptionId!
  const baseTier = plan.replace('_ANNUAL', '') as SubscriptionTier
  const customPrice = org.customPricing && baseTier === 'PRO' && billingPeriod === 'MONTHLY'
    ? Number(org.customPricing)
    : undefined
  const preco = { subscriptionId, organizationId: org.id, organizationName: org.name, customPrice }

  if (tipo === 'blocked') {
    return NextResponse.json({
      error: 'A troca do plano anual para o mensal vale só no fim do ano pago. Fale com o suporte para agendar.',
    }, { status: 400 })
  }

  if (tipo === 'same') {
    if (!org.pendingPlan) {
      return NextResponse.json({ error: 'Sua conta já está neste plano.' }, { status: 400 })
    }
    // Undo the scheduled downgrade: the next invoice goes back to the current price
    await trocarPreco({ ...preco, plan, proporcional: false })
    // isolamento: org is the signed-in user's own organization (loaded from the session in POST)
    await prisma.organization.update({ where: { id: org.id }, data: { pendingPlan: null, currentPeriodEnd: null } })
    return NextResponse.json({ success: true, changed: 'kept' })
  }

  if (tipo === 'downgrade') {
    if (org.cancelAtPeriodEnd) {
      return NextResponse.json({
        error: 'O cancelamento desta assinatura já está agendado. Clique em "Manter assinatura" antes de trocar de plano.',
      }, { status: 400 })
    }
    const { fimDoPeriodo } = await trocarPreco({ ...preco, plan, proporcional: false })
    // isolamento: org is the signed-in user's own organization (loaded from the session in POST)
    await prisma.organization.update({
      where: { id: org.id },
      data: { pendingPlan: plan, currentPeriodEnd: fimDoPeriodo },
    })
    logger.info({ organizationId: org.id, plan, fimDoPeriodo }, 'Downgrade scheduled for the next renewal')
    return NextResponse.json({ success: true, changed: 'scheduled', effectiveAt: fimDoPeriodo.toISOString(),
      message: `Seu plano muda em ${dataBR(fimDoPeriodo)}. Até lá, tudo continua como está.` })
  }

  let troca
  try {
    troca = await trocarPreco({ ...preco, plan, proporcional: true })
  } catch (err) {
    // payment_behavior 'error_if_incomplete': the card was declined and the subscription did not change
    logger.warn({ err, organizationId: org.id, plan }, 'Upgrade payment failed')
    const motivo = err instanceof Error && 'code' in err && err.code === 'card_declined' ? ' O cartão foi recusado.' : ''
    return NextResponse.json({ error: `Não conseguimos cobrar a diferença.${motivo} Seu plano não mudou.` }, { status: 402 })
  }
  await upgradePlan(org.id, baseTier, {
    provider: 'STRIPE',
    providerPaymentId: troca.faturaId,
    amount: troca.cobrado,
    currency: 'BRL',
  }, plan.endsWith('_ANNUAL'))
  // isolamento: org is the signed-in user's own organization (loaded from the session in POST)
  await prisma.organization.update({
    where: { id: org.id },
    data: { pendingPlan: null, cancelAtPeriodEnd: false, currentPeriodEnd: null },
  })
  return NextResponse.json({ success: true, changed: 'now', charged: troca.cobrado })
}
