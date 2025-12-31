/**
 * Analytics Configuration
 * Centralized config for all tracking and analytics tools
 */

export const analyticsConfig = {
  // Google Tag Manager
  gtm: {
    id: process.env.NEXT_PUBLIC_GTM_ID || '',
    enabled: process.env.NEXT_PUBLIC_GTM_ID !== undefined,
  },

  // Google Analytics (GA4)
  ga: {
    id: 'G-WJE82VNKX8',
    enabled: true,
  },

  // Microsoft Clarity
  clarity: {
    id: 'uu4q5pnnji',
    enabled: true,
  },

  // Tawk.to Live Chat
  tawkTo: {
    propertyId: '69551ffa442844197c21ef8e',
    widgetId: '1jdq89qse',
    enabled: true,
  },
} as const

export type AnalyticsConfig = typeof analyticsConfig
