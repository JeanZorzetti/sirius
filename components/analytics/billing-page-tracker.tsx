'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

/**
 * Component to track billing page view
 * High-intent page - user is considering upgrade
 */
export function BillingPageTracker() {
  useEffect(() => {
    trackEvent('view_billing_page', {
      page_path: '/dashboard/billing',
      page_title: 'Billing - Sirius CRM',
    })
  }, [])

  return null // This component doesn't render anything
}
