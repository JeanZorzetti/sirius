/**
 * useComponentAnalytics Hook
 *
 * Track Generative UI component rendering and interactions.
 * Integrates with PostHog for analytics and Sentry for error tracking.
 */

import { useCallback, useEffect, useRef } from 'react'

interface AnalyticsContext {
  component: string
  sessionId?: string
  conversationTurn?: number
  spinState?: string
  leadScore?: number
}

interface RenderEvent {
  render_time_ms: number
  props_source: 'conversation_extracted' | 'default' | 'user_input' | 'auto_fill'
  has_prefilled_data: boolean
}

interface InteractionEvent {
  interaction_type: string
  field?: string
  value?: unknown
  timestamp: Date
}

interface ConversionEvent {
  event: string
  deal_value?: number
  time_to_conversion_ms: number
  from_component: string
}

interface ComponentAnalytics {
  trackRender: (event: RenderEvent) => void
  trackInteraction: (event: InteractionEvent) => void
  trackConversion: (event: ConversionEvent) => void
  trackError: (error: Error, context?: Record<string, unknown>) => void
}

/**
 * Check if PostHog is available
 */
function getPostHog(): any | null {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    return (window as any).posthog
  }
  return null
}

/**
 * Check if Sentry is available
 */
function getSentry(): any | null {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    return (window as any).Sentry
  }
  return null
}

/**
 * Hook for tracking Generative UI component analytics
 *
 * @param context - Base context for all events
 * @returns Analytics tracking functions
 *
 * @example
 * ```tsx
 * const { trackRender, trackInteraction } = useComponentAnalytics({
 *   component: 'ROICalculator',
 *   sessionId: 'abc123',
 * })
 *
 * useEffect(() => {
 *   trackRender({
 *     render_time_ms: 142,
 *     props_source: 'conversation_extracted',
 *     has_prefilled_data: true,
 *   })
 * }, [])
 * ```
 */
export function useComponentAnalytics(context: AnalyticsContext): ComponentAnalytics {
  const renderStartTime = useRef<number>(Date.now())
  const interactionCount = useRef<number>(0)

  // Track component mount
  useEffect(() => {
    renderStartTime.current = Date.now()
    return () => {
      // Track unmount with session duration
      const duration = Date.now() - renderStartTime.current
      const posthog = getPostHog()
      if (posthog && duration > 1000) {
        posthog.capture('genui_component_session', {
          ...context,
          duration_ms: duration,
          interaction_count: interactionCount.current,
        })
      }
    }
  }, [context])

  /**
   * Track component render
   */
  const trackRender = useCallback(
    (event: RenderEvent) => {
      const posthog = getPostHog()
      if (posthog) {
        posthog.capture('genui_component_rendered', {
          ...context,
          ...event,
          timestamp: new Date().toISOString(),
        })
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Component rendered:', {
          ...context,
          ...event,
        })
      }
    },
    [context]
  )

  /**
   * Track user interaction with component
   */
  const trackInteraction = useCallback(
    (event: InteractionEvent) => {
      interactionCount.current++

      const posthog = getPostHog()
      if (posthog) {
        posthog.capture('genui_interaction', {
          ...context,
          ...event,
          interaction_index: interactionCount.current,
          time_since_render_ms: Date.now() - renderStartTime.current,
        })
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Interaction:', {
          ...context,
          ...event,
        })
      }
    },
    [context]
  )

  /**
   * Track conversion event (demo scheduled, deal created, etc.)
   */
  const trackConversion = useCallback(
    (event: ConversionEvent) => {
      const posthog = getPostHog()
      if (posthog) {
        posthog.capture('genui_conversion', {
          ...context,
          ...event,
          total_interactions: interactionCount.current,
          timestamp: new Date().toISOString(),
        })
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Conversion:', {
          ...context,
          ...event,
        })
      }
    },
    [context]
  )

  /**
   * Track component error
   */
  const trackError = useCallback(
    (error: Error, additionalContext?: Record<string, unknown>) => {
      const posthog = getPostHog()
      if (posthog) {
        posthog.capture('genui_component_error', {
          ...context,
          error_message: error.message,
          error_name: error.name,
          ...additionalContext,
          timestamp: new Date().toISOString(),
        })
      }

      const sentry = getSentry()
      if (sentry) {
        sentry.captureException(error, {
          extra: {
            ...context,
            ...additionalContext,
          },
          tags: {
            type: 'genui_error',
            component: context.component,
          },
        })
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[Analytics] Error:', {
          ...context,
          error: error.message,
          ...additionalContext,
        })
      }
    },
    [context]
  )

  return {
    trackRender,
    trackInteraction,
    trackConversion,
    trackError,
  }
}

/**
 * Track a simple page view with Generative UI context
 */
export function trackGenUIPageView(page: string, context?: Record<string, unknown>) {
  const posthog = getPostHog()
  if (posthog) {
    posthog.capture('genui_page_view', {
      page,
      ...context,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Identify user for analytics
 */
export function identifyUser(
  userId: string,
  traits?: {
    email?: string
    name?: string
    organization?: string
    plan?: string
  }
) {
  const posthog = getPostHog()
  if (posthog) {
    posthog.identify(userId, traits)
  }
}

/**
 * Track feature flag usage
 */
export function trackFeatureFlag(flagName: string, value: boolean | string) {
  const posthog = getPostHog()
  if (posthog) {
    posthog.capture('feature_flag_checked', {
      flag_name: flagName,
      flag_value: value,
    })
  }
}
