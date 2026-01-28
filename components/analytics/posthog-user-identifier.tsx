'use client'

import { useEffect } from 'react'
import { analytics } from '@/lib/posthog'

interface PostHogUserIdentifierProps {
  user?: {
    id?: string
    email?: string | null
    name?: string | null
    plan?: string
    createdAt?: Date | string
  }
}

/**
 * Component to identify user in PostHog when they log in
 */
export function PostHogUserIdentifier({ user }: PostHogUserIdentifierProps) {
  useEffect(() => {
    if (user?.email) {
      // Identificar usuário no PostHog
      analytics.identify(user.id || user.email, {
        email: user.email,
        name: user.name,
        plan: user.plan || 'FREE',
        created_at: user.createdAt,
      })
    }
  }, [user])

  return null // This component doesn't render anything
}
