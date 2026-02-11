'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import {
  detectAndStoreAiReferrer,
  extractAiQueryParams,
  type AiReferrerData,
} from '@/lib/analytics/ai-tracker'

/**
 * AI Traffic Monitor Component
 *
 * Detecta automaticamente tráfego vindo de AI Answer Engines
 * e dispara eventos para PostHog com propriedade channel_type: 'ai_answer_engine'
 *
 * Deve ser colocado no layout raiz dentro do PostHogProvider
 */
export function AiTrafficMonitor() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Só executar no lado do cliente e em produção
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    // Detectar AI referrer
    const aiData = detectAndStoreAiReferrer()

    if (aiData) {
      // Extrair query params do referrer se possível
      const queryParams = extractAiQueryParams(aiData.referrerUrl)

      // Disparar evento PostHog
      const eventData = {
        channel_type: 'ai_answer_engine',
        ai_engine: aiData.engine,
        referrer_url: aiData.referrerUrl,
        detected_at: aiData.detectedAt,
        landing_page: pathname,
        landing_url: window.location.href,
        ...(queryParams && { search_context: queryParams }),
      }

      // Capturar page_view com contexto de AI
      posthog.capture('page_view', eventData)

      // Capturar evento específico de AI traffic
      posthog.capture('ai_traffic_detected', eventData)

      // Registrar como propriedade do usuário (persiste na sessão)
      posthog.register({
        ai_acquisition_engine: aiData.engine,
        ai_acquisition_date: aiData.detectedAt,
      })

    }
  }, [pathname, searchParams])

  // Componente não renderiza nada
  return null
}
