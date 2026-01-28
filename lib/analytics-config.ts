/**
 * Analytics Configuration
 * Centralized config for all tracking and analytics tools
 */

export const analyticsConfig = {
  // Google Tag Manager
  gtm: {
    id: 'GTM-5F6LM72D',
    enabled: true,
  },

  // Google Analytics (GA4)
  ga: {
    id: 'G-WJE82VNKX8',
    enabled: true,
  },

  // Microsoft Clarity
  clarity: {
    id: 'uu4q5pnnji',
    enabled: true, // Re-enabled with proper error handling
  },

  // Tawk.to Live Chat (DISABLED)
  tawkTo: {
    propertyId: '69551ffa442844197c21ef8e',
    widgetId: '1jdq89qse',
    enabled: false,
  },
} as const

export type AnalyticsConfig = typeof analyticsConfig
