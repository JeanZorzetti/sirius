/**
 * Analytics Helper
 * Centralized tracking functions for Google Tag Manager / Google Analytics
 */

// Declare global dataLayer type
declare global {
  interface Window {
    dataLayer: any[]
  }
}

/**
 * Track a custom event
 * @param eventName - The name of the event (e.g., 'sign_up', 'login', 'create_deal')
 * @param eventParams - Additional parameters for the event
 */
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window === 'undefined') return // Server-side, skip

  // Initialize dataLayer if not exists
  window.dataLayer = window.dataLayer || []

  // Push event to dataLayer
  window.dataLayer.push({
    event: eventName,
    ...eventParams,
  })

  // Debug in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, eventParams)
  }
}

/**
 * Track page view
 * @param pagePath - The page path (e.g., '/dashboard', '/pricing')
 * @param pageTitle - The page title
 */
export function trackPageView(pagePath: string, pageTitle?: string) {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  })
}

/**
 * Track user sign up
 * @param method - Sign up method (e.g., 'email', 'google')
 * @param userId - Optional user ID
 */
export function trackSignUp(method: string = 'email', userId?: string) {
  trackEvent('sign_up', {
    method,
    user_id: userId,
  })
}

/**
 * Track user login
 * @param method - Login method (e.g., 'email', 'google')
 * @param userId - Optional user ID
 */
export function trackLogin(method: string = 'email', userId?: string) {
  trackEvent('login', {
    method,
    user_id: userId,
  })
}

/**
 * Track deal creation
 * @param dealValue - Deal value in BRL
 * @param dealStage - Pipeline stage (e.g., 'Lead', 'Prospecção')
 * @param dealId - Optional deal ID
 */
export function trackDealCreated(dealValue?: number, dealStage?: string, dealId?: string) {
  trackEvent('create_deal', {
    value: dealValue,
    currency: 'BRL',
    deal_stage: dealStage,
    deal_id: dealId,
  })
}

/**
 * Track contact creation
 * @param contactId - Optional contact ID
 */
export function trackContactCreated(contactId?: string) {
  trackEvent('create_contact', {
    contact_id: contactId,
  })
}

/**
 * Track upgrade to Pro
 * @param value - Subscription value
 * @param transactionId - Transaction ID
 */
export function trackPurchase(value: number, transactionId?: string) {
  trackEvent('purchase', {
    value,
    currency: 'BRL',
    transaction_id: transactionId,
  })
}

/**
 * Track button click
 * @param buttonName - Name/ID of the button clicked
 * @param location - Where the button was clicked (e.g., 'hero', 'pricing')
 */
export function trackButtonClick(buttonName: string, location?: string) {
  trackEvent('button_click', {
    button_name: buttonName,
    location,
  })
}

/**
 * Track pricing page view
 * Specific event for pricing page visits (important conversion signal)
 */
export function trackViewPricingPage() {
  trackEvent('view_pricing_page', {
    page_path: '/pricing',
    page_title: 'Pricing - Sirius CRM',
  })
}
