'use client'

import { useEffect } from 'react'
import { trackViewPricingPage } from '@/lib/analytics'
import { analytics } from '@/lib/posthog'

/**
 * Component to track pricing page view
 */
export function PricingPageTracker() {
  useEffect(() => {
    trackViewPricingPage() // Google Analytics
    analytics.viewPricing({ source: 'pricing_page' }) // PostHog
  }, [])

  return null // This component doesn't render anything
}
