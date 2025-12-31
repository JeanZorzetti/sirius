'use client'

import { useEffect } from 'react'
import { trackPageView } from '@/lib/analytics'

/**
 * Component to track pricing page view
 */
export function PricingPageTracker() {
  useEffect(() => {
    trackPageView('/pricing', 'Pricing - Sirius CRM')
  }, [])

  return null // This component doesn't render anything
}
