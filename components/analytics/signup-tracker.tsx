'use client'

import { useEffect } from 'react'
import { trackSignUp } from '@/lib/analytics'

/**
 * Component to track successful sign up
 * Should be rendered on the first page after registration (dashboard)
 */
export function SignUpTracker() {
  useEffect(() => {
    // Check if this is a new user (just registered)
    const params = new URLSearchParams(window.location.search)
    const isNewUser = params.get('new_user') === 'true'

    if (isNewUser) {
      // Track sign up event
      trackSignUp('email')

      // Clean up URL parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  return null // This component doesn't render anything
}
