import posthog from 'posthog-js'
import type { AiEngine } from './analytics/ai-tracker'

// Helper para capturar eventos do PostHog de forma type-safe
export const analytics = {
  // Calculadora
  calculatorCompleted: (data: {
    niche?: string
    potential_loss: number
    leads_per_month: number
    conversion_rate: number
    num_vendedores?: number
    scenario?: string
  }) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('calculator_completed', data)
    }
  },

  // Sales & Pricing
  viewPricing: (data?: { source?: string }) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('view_pricing', data)
    }
  },

  clickSignup: (data?: { source?: string; plan?: string }) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('click_signup', data)
    }
  },

  // Onboarding
  onboardingStart: () => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('onboarding_start')
    }
  },

  demoModeSelected: () => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('demo_mode_selected')
    }
  },

  onboardingCompleted: (data: { demo_mode: boolean }) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('onboarding_completed', data)
    }
  },

  // Freemium Limits
  limitReached: (data: { limit_type: 'contacts' | 'pipelines'; current_count: number }) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('limit_reached', data)
    }
  },

  upgradeClicked: (data?: { source?: string }) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('upgrade_clicked', data)
    }
  },

  // AI Traffic Detection
  aiTrafficDetected: (data: {
    channel_type: 'ai_answer_engine'
    ai_engine: AiEngine
    referrer_url: string
    landing_page: string
    landing_url: string
    detected_at: string
    search_context?: Record<string, string>
  }) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('ai_traffic_detected', data)
    }
  },

  toolInteraction: (data: {
    tool_type: string
    action: string
    metadata?: Record<string, any>
  }) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.capture('tool_interaction', data)
    }
  },

  // User Identification
  identify: (userId: string, properties?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'production') {
      posthog.identify(userId, properties)
    }
  },

  // Reset on logout
  reset: () => {
    if (process.env.NODE_ENV === 'production') {
      posthog.reset()
    }
  },
}
