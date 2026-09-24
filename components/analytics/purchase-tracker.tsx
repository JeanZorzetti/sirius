'use client'

import { useEffect } from 'react'
import { trackPurchase } from '@/lib/analytics'

/**
 * Sends the GA4 purchase from /checkout/sucesso, where Stripe returns with session_id.
 * The server reads the paid amount from the session (purchaseFromSession in lib/stripe.ts).
 */
export function PurchaseTracker({ value, transactionId }: { value: number; transactionId: string }) {
  useEffect(() => {
    trackPurchase(value, transactionId)
    // A reload must not send it again (GA4 also dedupes on transaction_id)
    window.history.replaceState({}, '', window.location.pathname)
  }, [value, transactionId])

  return null
}
