'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  detectAndStoreAiReferrer,
  extractAiQueryParams,
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
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') return

    const aiData = detectAndStoreAiReferrer()
    if (!aiData) return

    const ph = (window as any).posthog
    if (!ph?.capture) return

    const queryParams = extractAiQueryParams(aiData.referrerUrl)

    const eventData = {
      channel_type: 'ai_answer_engine',
      ai_engine: aiData.engine,
      referrer_url: aiData.referrerUrl,
      detected_at: aiData.detectedAt,
      landing_page: pathname,
      landing_url: window.location.href,
      ...(queryParams && { search_context: queryParams }),
    }

    ph.capture('page_view', eventData)
    ph.capture('ai_traffic_detected', eventData)
    ph.register({
      ai_acquisition_engine: aiData.engine,
      ai_acquisition_date: aiData.detectedAt,
    })
  }, [pathname, searchParams])

  return null
}
