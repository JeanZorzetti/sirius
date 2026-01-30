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
    // Inicializar PostHog apenas no cliente e em produção
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

      if (posthogKey && posthogHost && !posthog.__loaded) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          loaded: (ph) => {
            console.log('[PostHog] SDK initialized successfully')

            // Disponibilizar globalmente para testes
            if (typeof window !== 'undefined') {
              ;(window as any).posthog = ph
            }
          },
          capture_pageview: false, // Usamos PostHogPageView customizado
          capture_pageleave: true,
          persistence: 'localStorage+cookie',
        })
      } else if (!posthogKey || !posthogHost) {
        console.warn('[PostHog] Missing NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST')
      }
    } else if (process.env.NODE_ENV === 'development') {
      // Em desenvolvimento, criar mock para testes
      if (typeof window !== 'undefined' && !(window as any).posthog) {
        console.log('[PostHog] Development mode - creating mock SDK')
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
