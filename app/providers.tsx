'use client'

import posthog from 'posthog-js'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Hook para rastrear mudanças de rota
function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && process.env.NODE_ENV === 'production') {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (posthogKey && posthogHost) {
      if (!posthog.__loaded) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          loaded: (ph) => {
            ;(window as any).posthog = ph
          },
          capture_pageview: false,
          capture_pageleave: true,
          persistence: 'localStorage+cookie',
          disable_session_recording: true,
          disable_surveys: true,
          autocapture: false,
          enable_heatmaps: false,
          disable_external_dependency_loading: true,
          person_profiles: 'identified_only',
          advanced_disable_decide: true,
        })
      } else {
        ;(window as any).posthog = posthog
      }
    } else {
      // No credentials: silent mock for development
      ;(window as any).posthog = {
        __loaded: true,
        capture: () => {},
        identify: () => {},
        reset: () => {},
      }
    }
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  )
}
