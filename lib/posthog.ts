import posthog from 'posthog-js'

// Helper para capturar eventos do PostHog de forma type-safe
export const analytics = {
  // Calculadora
  calculatorCompleted: (data: {
    niche?: string
    potential_loss: number
    leads_per_month: number
    conversion_rate: number
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
