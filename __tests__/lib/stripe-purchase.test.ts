import { describe, it, expect } from 'vitest'
import { purchaseFromSession } from '@/lib/stripe'

const paid = { id: 'cs_live_1', payment_status: 'paid' as const, amount_total: 14700, metadata: { organization_id: 'org1' } }

describe('purchaseFromSession', () => {
  it('sends the amount paid, in reais', () => {
    expect(purchaseFromSession(paid)).toEqual({ value: 147, transactionId: 'cs_live_1' })
  })

  it('skips what is not money for this product', () => {
    expect(purchaseFromSession({ ...paid, payment_status: 'unpaid' })).toBeNull()
    expect(purchaseFromSession({ ...paid, amount_total: 0 })).toBeNull()
    expect(purchaseFromSession({ ...paid, metadata: { userId: 'aftercare' } })).toBeNull() // shared Stripe account
  })
})
