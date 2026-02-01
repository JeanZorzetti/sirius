/**
 * Lazy Component Loaders
 *
 * Dynamic imports for code splitting and lazy loading of Generative UI components.
 * Each component is loaded only when needed, reducing initial bundle size.
 */

import { lazy, ComponentType } from 'react'

/**
 * Type for lazy loader functions
 */
type LazyLoader<T = any> = () => Promise<{ default: ComponentType<T> }>

/**
 * Component loaders map with dynamic imports
 *
 * Each loader returns a Promise that resolves to the component module.
 * Components are loaded only when first rendered.
 */
export const componentLoaders: Record<string, LazyLoader> = {
  ROICalculator: () =>
    import('@/components/generative-ui/ROICalculator').then((mod) => ({
      default: mod.ROICalculator,
    })),

  DealFormGenerator: () =>
    import('@/components/generative-ui/DealFormGenerator').then((mod) => ({
      default: mod.DealFormGenerator,
    })),

  DemoScheduler: () =>
    import('@/components/generative-ui/DemoScheduler').then((mod) => ({
      default: mod.DemoScheduler,
    })),

  PricingComparison: () =>
    import('@/components/generative-ui/PricingComparison').then((mod) => ({
      default: mod.PricingComparison,
    })),

  QualificationDashboard: () =>
    import('@/components/generative-ui/QualificationDashboard').then((mod) => ({
      default: mod.QualificationDashboard,
    })),

  CompetitorMatrix: () =>
    import('@/components/generative-ui/CompetitorMatrix').then((mod) => ({
      default: mod.CompetitorMatrix,
    })),

  ScriptPreview: () =>
    import('@/components/generative-ui/ScriptPreview').then((mod) => ({
      default: mod.ScriptPreview,
    })),

  InsightCard: () =>
    import('@/components/generative-ui/InsightCard').then((mod) => ({
      default: mod.InsightCard,
    })),

  OnboardingTimeline: () =>
    import('@/components/generative-ui/OnboardingTimeline').then((mod) => ({
      default: mod.OnboardingTimeline,
    })),

  EmailPreview: () =>
    import('@/components/generative-ui/EmailPreview').then((mod) => ({
      default: mod.EmailPreview,
    })),
}

/**
 * Cache for lazily loaded components
 * Prevents duplicate lazy() calls for the same component
 */
const lazyComponentCache: Record<string, ComponentType<any>> = {}

/**
 * Get a lazily loaded component by name
 *
 * @param name - Component name from registry
 * @returns Lazy-loaded React component or null if not found
 */
export function getLazyComponent(name: string): ComponentType<any> | null {
  // Check cache first
  if (lazyComponentCache[name]) {
    return lazyComponentCache[name]
  }

  const loader = componentLoaders[name]
  if (!loader) {
    console.warn(`[LazyComponents] No loader found for component: ${name}`)
    return null
  }

  // Create lazy component and cache it
  const LazyComponent = lazy(loader)
  lazyComponentCache[name] = LazyComponent

  return LazyComponent
}

/**
 * Preload a component without rendering it
 * Useful for preloading components that are likely to be needed soon
 *
 * @param name - Component name to preload
 */
export async function preloadComponent(name: string): Promise<void> {
  const loader = componentLoaders[name]
  if (!loader) {
    console.warn(`[LazyComponents] Cannot preload unknown component: ${name}`)
    return
  }

  try {
    await loader()
  } catch (error) {
    console.error(`[LazyComponents] Failed to preload ${name}:`, error)
  }
}

/**
 * Preload multiple components in parallel
 *
 * @param names - Array of component names to preload
 */
export async function preloadComponents(names: string[]): Promise<void> {
  await Promise.all(names.map(preloadComponent))
}

/**
 * Get list of all available lazy component names
 */
export function getAvailableLazyComponents(): string[] {
  return Object.keys(componentLoaders)
}

/**
 * Check if a component has a lazy loader
 */
export function hasLazyLoader(name: string): boolean {
  return name in componentLoaders
}
