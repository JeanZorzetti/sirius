'use client'

import { useEffect } from 'react'
import { trackViewPricingPage } from '@/lib/analytics'

/**
 * Component to track pricing page view
 */
export function PricingPageTracker() {
  useEffect(() => {
    trackViewPricingPage()
  }, [])

  return null // This component doesn't render anything
}
