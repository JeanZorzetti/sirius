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

    // Debug: verificar variáveis de ambiente
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

    console.log('[PostHog Debug] Environment:', process.env.NODE_ENV)
    console.log('[PostHog Debug] Key present:', !!posthogKey)
    console.log('[PostHog Debug] Host present:', !!posthogHost)
    console.log('[PostHog Debug] Already loaded:', posthog.__loaded)

    // Inicializar PostHog se tiver credenciais (produção ou dev)
    if (posthogKey && posthogHost && !posthog.__loaded) {
      console.log('[PostHog] Initializing with host:', posthogHost)

      posthog.init(posthogKey, {
        api_host: posthogHost,
        loaded: (ph) => {
          console.log('[PostHog] SDK initialized successfully')
          ;(window as any).posthog = ph
        },
        capture_pageview: false,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',
      })
    } else if (!posthogKey || !posthogHost) {
      // Sem credenciais: criar mock para desenvolvimento
      console.warn('[PostHog] No credentials - creating mock SDK')
      ;(window as any).posthog = {
        __loaded: true,
        capture: (event: string, properties?: any) => {
          console.log('[PostHog Mock] Event:', event, properties)
        },
        identify: (userId: string, properties?: any) => {
          console.log('[PostHog Mock] Identify:', userId, properties)
        },
        reset: () => {
          console.log('[PostHog Mock] Reset')
        },
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
