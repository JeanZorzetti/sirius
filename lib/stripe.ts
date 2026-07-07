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

/** Cancela uma assinatura ativa na Stripe (imediato). */
export async function cancelStripeSubscription(subscriptionId: string) {
  await getStripe().subscriptions.cancel(subscriptionId)
  logger.info({ subscriptionId }, 'Stripe subscription cancelled')
}
