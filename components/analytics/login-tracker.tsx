'use client'

import { useEffect } from 'react'
import { trackLogin } from '@/lib/analytics'

/**
 * Component to track successful login
 * Should be rendered on the first page after login (dashboard)
 */
export function LoginTracker() {
  useEffect(() => {
    // Check if this is a returning user (just logged in)
    const params = new URLSearchParams(window.location.search)
    const justLoggedIn = params.get('login') === 'true'

    if (justLoggedIn) {
      // Track login event
      trackLogin('email')

      // Clean up URL parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  return null // This component doesn't render anything
}
