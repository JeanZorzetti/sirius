/**
 * Stripe — provedor de pagamento atual (Mercado Pago mantido só para legado).
 *
 * Usa Checkout Sessions hospedadas: mode 'subscription' para planos recorrentes
 * (mensal e anual) e mode 'payment' para serviços avulsos (ex: WHATSAPP_SETUP).
 * Preços via price_data inline — sem catálogo no dashboard, o que permite
 * customPricing (referral/founder) sem criar Price por cliente.
 */

import Stripe from 'stripe'
import type { CheckoutPlan } from './mercadopago'
import logger from './logger'

// Lazy singleton — avoid top-level instantiation (breaks Docker standalone build)
let _stripe: Stripe | null = null
export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return _stripe
}

/** Catálogo de planos: valores em centavos de BRL. Fonte: PLAN_PRICES (lib/mercadopago.ts). */
export const STRIPE_PLANS: Record<CheckoutPlan, {
  name: string
  amountCents: number
  interval: 'month' | 'year' | null
}> = {
  STARTER:          { name: 'Sirius CRM – Plano Starter (mensal)',        amountCents: 6700,   interval: 'month' },
  PRO:              { name: 'Sirius CRM – Plano Pro (mensal)',            amountCents: 14700,  interval: 'month' },
  BUSINESS:         { name: 'Sirius CRM – Plano Business (mensal)',       amountCents: 39700,  interval: 'month' },
  STARTER_ANNUAL:   { name: 'Sirius CRM – Plano Starter Anual (20% off)', amountCents: 64320,  interval: 'year' },
  PRO_ANNUAL:       { name: 'Sirius CRM – Plano Pro Anual (20% off)',     amountCents: 141120, interval: 'year' },
  BUSINESS_ANNUAL:  { name: 'Sirius CRM – Plano Business Anual (20% off)', amountCents: 381120, interval: 'year' },
  FOUNDER_STARTER:  { name: 'Sirius CRM – Fundador Starter (R$39/mês vitalício)',   amountCents: 3900,  interval: 'month' },
  FOUNDER_PRO:      { name: 'Sirius CRM – Fundador Pro (R$87/mês vitalício)',       amountCents: 8700,  interval: 'month' },
  FOUNDER_BUSINESS: { name: 'Sirius CRM – Fundador Business (R$234/mês vitalício)', amountCents: 23400, interval: 'month' },
  WHATSAPP_SETUP:   { name: 'Implantação WhatsApp Oficial', amountCents: 29700, interval: null },
}

/**
 * Cria uma Checkout Session hospedada da Stripe.
 * NÃO passar payment_method_types — a Stripe decide dinamicamente pelo dashboard.
 */
export async function createStripeCheckout(params: {
  organizationId: string
  organizationName: string
  userEmail: string
  plan: CheckoutPlan
  /** Preço custom em reais (referral/grandfathering) — sobrepõe o preço do catálogo. */
  customPrice?: number
  /** Customer já existente na Stripe (evita duplicar customers). */
  stripeCustomerId?: string | null
}) {
  const { organizationId, organizationName, userEmail, plan, customPrice, stripeCustomerId } = params

  const planDef = STRIPE_PLANS[plan]
  if (!planDef) throw new Error(`Plano desconhecido: ${plan}`)

  const unitAmount = customPrice != null ? Math.round(customPrice * 100) : planDef.amountCents
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  const metadata = { organization_id: organizationId, plan }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: planDef.interval ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: { name: `${planDef.name} – ${organizationName}` },
            unit_amount: unitAmount,
            ...(planDef.interval ? { recurring: { interval: planDef.interval } } : {}),
          },
          quantity: 1,
        },
      ],
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: userEmail }),
      client_reference_id: organizationId,
      metadata,
      // Repassar metadata para a subscription: é o que o webhook lê em renovações
      ...(planDef.interval ? { subscription_data: { metadata } } : {}),
      success_url: plan === 'WHATSAPP_SETUP'
        ? `${baseUrl}/dashboard/settings/integrations/whatsapp-official?setup_paid=1`
        : `${baseUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/billing?status=failure`,
    })

    logger.info({ organizationId, sessionId: session.id, plan }, 'Stripe checkout session created')

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    }
  } catch (error) {
    logger.error({ error, organizationId, plan }, 'Failed to create Stripe checkout session')
    throw new Error('Erro ao criar checkout')
  }
}

/**
 * O que a página de sucesso manda ao GA4 como `purchase`. A conta Stripe é compartilhada com outros
 * produtos e "paid" pode valer zero, então só conta sessão deste produto (tem organization_id) com dinheiro.
 * ponytail: boleto/async chega `unpaid` no redirect e não vira purchase; mandar pelo webhook se isso importar.
 */
export function purchaseFromSession(
  session: Pick<Stripe.Checkout.Session, 'id' | 'payment_status' | 'amount_total' | 'metadata'>,
) {
  if (session.payment_status !== 'paid' || !session.metadata?.organization_id || !session.amount_total) return null
  return { value: session.amount_total / 100, transactionId: session.id }
}


// ─── Spec 013: cancel, withdraw and change plan on the existing subscription ──────────────────────────────

/** CDC art. 49: 7 days to withdraw from an online purchase, with a full refund. */
export const DIAS_ARREPENDIMENTO = 7

const ORDEM_TIER = ['FREE', 'STARTER', 'PRO', 'BUSINESS'] as const

/**
 * How a paid org moves from `atual` to `alvo` (CheckoutPlan keys such as 'PRO' or 'PRO_ANNUAL').
 * - upgrade: higher tier, or monthly → annual. Charged pro rata now.
 * - downgrade: lower tier on the same cycle. Takes effect at the next renewal.
 * - same: same plan and cycle.
 * - blocked: annual → monthly. Changing the interval makes Stripe bill at once, so it is not scheduled.
 * ponytail: annual → monthly needs Subscription Schedules; add when someone on an annual plan asks for it.
 */
export function planChange(atual: string, alvo: string): 'upgrade' | 'downgrade' | 'same' | 'blocked' {
  const anual = (p: string) => p.endsWith('_ANNUAL')
  const tier = (p: string) => ORDEM_TIER.indexOf(p.replace('_ANNUAL', '') as (typeof ORDEM_TIER)[number])
  if (anual(atual) && !anual(alvo)) return 'blocked'
  if (tier(alvo) > tier(atual)) return 'upgrade'
  if (tier(alvo) < tier(atual)) return 'downgrade'
  return anual(alvo) && !anual(atual) ? 'upgrade' : 'same'
}

/** True while the subscription is within the withdrawal window counted from its start (first charge). */
export function dentroDoArrependimento(inicioSegundos: number, agora: Date = new Date()): boolean {
  return agora.getTime() - inicioSegundos * 1000 <= DIAS_ARREPENDIMENTO * 24 * 60 * 60 * 1000
}

/** End of the paid period (API dahlia: the period lives on the subscription item). */
function fimDoPeriodo(sub: Stripe.Subscription): Date {
  return new Date(sub.items.data[0].current_period_end * 1000)
}

export async function lerAssinatura(subscriptionId: string) {
  const sub = await getStripe().subscriptions.retrieve(subscriptionId)
  return { inicio: sub.start_date, fimDoPeriodo: fimDoPeriodo(sub) }
}

/** Schedules (or undoes) the cancellation at the end of the paid period. Returns that date. */
export async function agendarCancelamento(subscriptionId: string, cancelar: boolean) {
  const sub = await getStripe().subscriptions.update(subscriptionId, { cancel_at_period_end: cancelar })
  logger.info({ subscriptionId, cancelar }, 'Stripe cancel_at_period_end updated')
  return fimDoPeriodo(sub)
}

/** Withdrawal: refunds every paid invoice of the subscription and ends it now. Returns the refunded amount in BRL. */
export async function desistirComReembolso(subscriptionId: string): Promise<number> {
  const stripe = getStripe()
  let reembolsadoCents = 0
  const faturas = await stripe.invoices.list({ subscription: subscriptionId, status: 'paid', limit: 100 })
  for (const fatura of faturas.data) {
    const pagamentos = await stripe.invoicePayments.list({ invoice: fatura.id!, status: 'paid' })
    for (const p of pagamentos.data) {
      const paymentIntent = p.payment.payment_intent
      if (!paymentIntent) continue
      await stripe.refunds.create(
        { payment_intent: typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id },
        // A retried request refunds once
        { idempotencyKey: `desistencia-${subscriptionId}-${p.id}` },
      )
      reembolsadoCents += p.amount_paid ?? 0
    }
  }
  await stripe.subscriptions.cancel(subscriptionId)
  logger.info({ subscriptionId, reembolsadoCents }, 'Stripe subscription withdrawn and refunded')
  return reembolsadoCents / 100
}

/**
 * Moves the existing subscription to `plan`. `proporcional` bills the difference now (upgrade) and fails if the
 * payment fails; without it the next invoice already comes at the new price (scheduled downgrade).
 * Returns the amount charged now (BRL) and the end of the paid period.
 */
export async function trocarPreco(params: {
  subscriptionId: string
  organizationId: string
  organizationName: string
  plan: CheckoutPlan
  customPrice?: number
  proporcional: boolean
}) {
  const { subscriptionId, organizationId, organizationName, plan, customPrice, proporcional } = params
  const planDef = STRIPE_PLANS[plan]
  if (!planDef?.interval) throw new Error(`Plano não recorrente: ${plan}`)

  const stripe = getStripe()
  const atual = await stripe.subscriptions.retrieve(subscriptionId)
  // Subscription items take price_data with a product id, not product_data
  const produto = await stripe.products.create({ name: `${planDef.name} – ${organizationName}` })

  const sub = await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: atual.items.data[0].id,
      price_data: {
        currency: 'brl',
        product: produto.id,
        unit_amount: customPrice != null ? Math.round(customPrice * 100) : planDef.amountCents,
        recurring: { interval: planDef.interval },
      },
    }],
    proration_behavior: proporcional ? 'always_invoice' : 'none',
    ...(proporcional ? { payment_behavior: 'error_if_incomplete' as const, cancel_at_period_end: false } : {}),
    metadata: { organization_id: organizationId, plan },
    expand: ['latest_invoice'],
  })

  const fatura = sub.latest_invoice as Stripe.Invoice | null
  const cobrado = proporcional && fatura?.billing_reason === 'subscription_update' ? (fatura.amount_paid ?? 0) / 100 : 0
  logger.info({ subscriptionId, plan, proporcional, cobrado }, 'Stripe subscription price changed')
  return { cobrado, faturaId: fatura?.id ?? null, fimDoPeriodo: fimDoPeriodo(sub) }
}
