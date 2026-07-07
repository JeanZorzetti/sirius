/**
 * Guardrail do catálogo de preços da Stripe.
 * Uma divergência entre STRIPE_PLANS e PLAN_PRICES (fonte legada) cobraria o
 * valor errado do cliente — este teste falha antes disso chegar em produção.
 */

import { describe, it, expect } from 'vitest'
import { STRIPE_PLANS } from '../stripe'
import { PLAN_PRICES } from '../mercadopago'

describe('STRIPE_PLANS', () => {
  it('preços (em reais) batem com PLAN_PRICES', () => {
    for (const [plan, price] of Object.entries(PLAN_PRICES)) {
      if (plan === 'FREE') continue
      const def = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]
      expect(def, `STRIPE_PLANS.${plan} ausente`).toBeDefined()
      expect(def.amountCents, `${plan} deveria custar R$${price}`).toBe(Math.round(price * 100))
    }
  })

  it('planos _ANNUAL cobram por ano; mensais/fundadores por mês', () => {
    for (const [plan, def] of Object.entries(STRIPE_PLANS)) {
      if (plan === 'WHATSAPP_SETUP') {
        expect(def.interval, 'serviço avulso não é recorrente').toBeNull()
      } else if (plan.endsWith('_ANNUAL')) {
        expect(def.interval, `${plan} deveria ser anual`).toBe('year')
      } else {
        expect(def.interval, `${plan} deveria ser mensal`).toBe('month')
      }
    }
  })

  it('todo plano tem centavos inteiros e positivos', () => {
    for (const [plan, def] of Object.entries(STRIPE_PLANS)) {
      expect(Number.isInteger(def.amountCents), `${plan} não-inteiro`).toBe(true)
      expect(def.amountCents).toBeGreaterThan(0)
    }
  })
})
