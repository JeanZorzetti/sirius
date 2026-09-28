/**
 * Guardrail do catálogo de preços da Stripe.
 * Uma divergência entre STRIPE_PLANS e PLAN_PRICES (fonte legada) cobraria o
 * valor errado do cliente — este teste falha antes disso chegar em produção.
 */

import { describe, it, expect } from 'vitest'
import { STRIPE_PLANS, planChange, dentroDoArrependimento } from '../stripe'
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

describe('planChange (spec 013)', () => {
  it('tier maior ou mensal→anual é upgrade', () => {
    expect(planChange('PRO', 'BUSINESS')).toBe('upgrade')
    expect(planChange('STARTER', 'PRO_ANNUAL')).toBe('upgrade')
    expect(planChange('PRO', 'PRO_ANNUAL')).toBe('upgrade')
    expect(planChange('PRO_ANNUAL', 'BUSINESS_ANNUAL')).toBe('upgrade')
  })

  it('tier menor no mesmo ciclo é downgrade', () => {
    expect(planChange('PRO', 'STARTER')).toBe('downgrade')
    expect(planChange('BUSINESS_ANNUAL', 'PRO_ANNUAL')).toBe('downgrade')
    expect(planChange('PRO', 'STARTER_ANNUAL')).toBe('downgrade')
  })

  it('anual→mensal é recusado; mesmo plano é same', () => {
    expect(planChange('PRO_ANNUAL', 'BUSINESS')).toBe('blocked')
    expect(planChange('PRO_ANNUAL', 'PRO')).toBe('blocked')
    expect(planChange('PRO', 'PRO')).toBe('same')
    expect(planChange('PRO_ANNUAL', 'PRO_ANNUAL')).toBe('same')
  })
})

describe('dentroDoArrependimento (CDC art. 49)', () => {
  const agora = new Date('2026-09-28T12:00:00Z')
  const seg = (d: Date) => Math.floor(d.getTime() / 1000)
  it('até 7 dias da primeira cobrança', () => {
    expect(dentroDoArrependimento(seg(new Date('2026-09-26T12:00:00Z')), agora)).toBe(true)
    expect(dentroDoArrependimento(seg(new Date('2026-09-21T12:00:00Z')), agora)).toBe(true)
  })
  it('depois de 7 dias, não', () => {
    expect(dentroDoArrependimento(seg(new Date('2026-09-21T11:59:00Z')), agora)).toBe(false)
  })
})
