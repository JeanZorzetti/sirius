import posthog from 'posthog-js'

// Inicializar PostHog apenas no client-side e em produção
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      defaults: '2025-11-30', // Configurações otimizadas recomendadas
      person_profiles: 'identified_only', // Otimização de performance
      capture_pageview: false, // Vamos capturar manualmente para melhor controle
      capture_pageleave: true,
      session_recording: {
        recordCrossOriginIframes: true,
      },
    })
  }
}
