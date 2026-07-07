/**
 * Webhook: Stripe (provedor atual)
 *
 * Eventos tratados:
 * - checkout.session.completed  → primeiro pagamento (upgrade de plano / fundador / serviço avulso)
 * - invoice.paid                → renovação de ciclo (mensal/anual)
 * - invoice.payment_failed      → email de falha (dunning/retry é da Stripe)
 * - customer.subscription.deleted → downgrade para FREE (cancelamento ou fim do dunning)
 *
 * A lógica de negócio vive em lib/billing-effects.ts, compartilhada com o
 * webhook legado do Mercado Pago.
 *
 * Configurar no dashboard: Billing → dunning com "cancel subscription" após as
 * tentativas, e o endpoint /api/webhooks/stripe com os 4 eventos acima.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { SubscriptionTier } from '@prisma/client'
import logger from '@/lib/logger'
import { getStripe } from '@/lib/stripe'
import {
  PaymentInfo,
  upgradePlan,
  upgradeToFounder,
  processAddonPurchase,
  renewSubscription,
  downgradeToFree,
  sendPaymentFailureEmail,
  recordWhatsAppSetupPurchase,
} from '@/lib/billing-effects'

export const dynamic = 'force-dynamic'

function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = req.headers.get('stripe-signature')

  if (!secret || !signature) {
    logger.warn('[STRIPE:WEBHOOK] Missing webhook secret or signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await req.text()
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    logger.error({ err }, '[STRIPE:WEBHOOK] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  logger.info({ type: event.type, id: event.id }, 'Stripe webhook received')

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        logger.info({ type: event.type }, '[STRIPE:WEBHOOK] Unhandled event type')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error({ error: message, type: event.type }, 'Stripe webhook error')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organization_id || session.client_reference_id
  const plan = session.metadata?.plan

  if (!organizationId || !plan) {
    logger.warn({ sessionId: session.id }, '[STRIPE:CHECKOUT] Missing organization_id/plan metadata')
    return
  }

  const pay: PaymentInfo = {
    provider: 'STRIPE',
    providerPaymentId: asId(session.payment_intent as string | null) || session.id,
    amount: (session.amount_total ?? 0) / 100,
    currency: session.currency?.toUpperCase() ?? 'BRL',
  }

  const stripeCustomerId = asId(session.customer as string | { id: string } | null)
  const stripeSubscriptionId = asId(session.subscription as string | { id: string } | null)
  const providerData = {
    ...(stripeCustomerId ? { stripeCustomerId } : {}),
    ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
  }

  const isAnnual = plan.endsWith('_ANNUAL')
  const baseTier = plan.replace('_ANNUAL', '')

  if (plan.startsWith('FOUNDER_')) {
    await upgradeToFounder(organizationId, plan, pay, providerData)
    return
  }

  if (plan === 'WHATSAPP_SETUP') {
    await recordWhatsAppSetupPurchase(organizationId, pay)
    return
  }

  if (Object.values(SubscriptionTier).includes(baseTier as SubscriptionTier)) {
    await upgradePlan(organizationId, baseTier as SubscriptionTier, pay, isAnnual, providerData)
    return
  }

  // Fallback: add-on (mesmo contrato do fluxo MP)
  await processAddonPurchase(organizationId, plan, pay)
}

/** Busca a organização pelo customer da Stripe (estável entre versões da API). */
async function findOrgByCustomer(customer: Stripe.Invoice['customer']) {
  const customerId = asId(customer as string | { id: string } | null)
  if (!customerId) return null
  return prisma.organization.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true, name: true, tier: true },
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Primeiro pagamento chega via checkout.session.completed; aqui só renovações de ciclo
  if (invoice.billing_reason !== 'subscription_cycle') return

  const org = await findOrgByCustomer(invoice.customer)
  if (!org) {
    logger.warn({ invoiceId: invoice.id }, '[STRIPE:RENEWAL] Organization not found for customer')
    return
  }

  if (org.tier === SubscriptionTier.FREE) {
    // ponytail: renovação com org FREE = drift de estado; logar em vez de adivinhar o tier
    logger.warn({ organizationId: org.id, invoiceId: invoice.id }, '[STRIPE:RENEWAL] Paid invoice for FREE org — skipping')
    return
  }

  await renewSubscription(org.id, org.tier as SubscriptionTier, {
    provider: 'STRIPE',
    providerPaymentId: invoice.id ?? null,
    amount: (invoice.amount_paid ?? 0) / 100,
    currency: invoice.currency?.toUpperCase() ?? 'BRL',
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const org = await findOrgByCustomer(invoice.customer)
  if (!org) {
    logger.warn({ invoiceId: invoice.id }, '[STRIPE:FAILED] Organization not found for customer')
    return
  }

  // Retry/dunning é da Stripe; o downgrade acontece no customer.subscription.deleted.
  const attemptNumber = invoice.attempt_count ?? 1
  const isFinal = invoice.next_payment_attempt == null

  logger.warn({ organizationId: org.id, attemptNumber, isFinal }, '[STRIPE:FAILED] Recurring payment failed')
  await sendPaymentFailureEmail(org.id, attemptNumber, isFinal)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const org = await prisma.organization.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true, tier: true },
  })

  if (!org) {
    logger.warn({ subscriptionId: subscription.id }, '[STRIPE:SUBSCRIPTION] Organization not found for subscription')
    return
  }

  if (org.tier === SubscriptionTier.FREE) {
    // Cancelamento já processado (ex: via /api/billing/cancel) — não duplicar churn
    return
  }

  await downgradeToFree(org.id, {
    previousTier: org.tier,
    reason: 'subscription_cancelled',
    provider: 'STRIPE',
    clearProviderIds: true,
  })
}
