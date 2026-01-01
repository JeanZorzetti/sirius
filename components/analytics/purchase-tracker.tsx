'use client'

import { useEffect } from 'react'
import { trackPurchase } from '@/lib/analytics'

/**
 * Component to track successful Stripe purchase
 * Detects checkout success via session_id in URL
 */
export function PurchaseTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')

    if (sessionId) {
      // User just completed purchase
      // Track the purchase event
      trackPurchase(49.00, sessionId)

      // Clean up URL parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  return null // This component doesn't render anything
}
