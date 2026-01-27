'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Inicializar PostHog apenas no client-side e apenas em produção
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      // Configurações recomendadas
      capture_pageview: false, // Vamos capturar manualmente
      capture_pageleave: true, // Rastrear quando usuário sai da página
      session_recording: {
        recordCrossOriginIframes: true, // Gravar iframes
      },
      // Não rastrear em desenvolvimento
      disable_session_recording: process.env.NODE_ENV !== 'production',
      // Performance
      persistence: 'localStorage',
      autocapture: {
        capture_copied_text: true, // Rastrear texto copiado
      },
    })
  }
}

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
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
