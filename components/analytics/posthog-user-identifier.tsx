'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { analytics } from '@/lib/posthog'

interface UserPlan {
  plan: string
}

/**
 * Component to identify user in PostHog when they log in
 */
export function PostHogUserIdentifier() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any

      // Identificar usuário no PostHog
      analytics.identify(user.id || user.email, {
        email: user.email,
        name: user.name,
        plan: user.plan || 'FREE',
        created_at: user.createdAt,
      })
    }
  }, [session])

  return null // This component doesn't render anything
}
