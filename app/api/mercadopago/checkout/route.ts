/**
 * LEGADO: checkout agora é Stripe. Esta rota delega para /api/stripe/checkout
 * para não quebrar builds antigos do app mobile (Capacitor) que ainda chamam
 * /api/mercadopago/checkout. Mesmo contrato: { plan, billingPeriod } → { checkoutUrl }.
 */
export { POST } from '@/app/api/stripe/checkout/route'
