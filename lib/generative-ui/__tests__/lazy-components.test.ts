/**
 * Tests for Lazy Components - Performance Layer
 *
 * Tests dynamic import and lazy loading of Generative UI components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getLazyComponent,
  preloadComponent,
  preloadComponents,
  getAvailableLazyComponents,
  hasLazyLoader,
  componentLoaders,
} from '../lazy-components'

describe('componentLoaders', () => {
  it('has loaders for all 10 components', () => {
    const expectedComponents = [
      'ROICalculator',
      'DealFormGenerator',
      'DemoScheduler',
      'PricingComparison',
      'QualificationDashboard',
      'CompetitorMatrix',
      'ScriptPreview',
      'InsightCard',
      'OnboardingTimeline',
      'EmailPreview',
    ]

    expectedComponents.forEach(name => {
      expect(componentLoaders[name]).toBeDefined()
      expect(typeof componentLoaders[name]).toBe('function')
    })
  })
})

describe('getLazyComponent', () => {
  it('returns a React component for valid component name', () => {
    const LazyComponent = getLazyComponent('ROICalculator')

    expect(LazyComponent).toBeDefined()
    expect(LazyComponent).not.toBeNull()
  })

  it('returns null for unknown component', () => {
    const LazyComponent = getLazyComponent('UnknownComponent')

    expect(LazyComponent).toBeNull()
  })

  it('caches lazy components on subsequent calls', () => {
    const first = getLazyComponent('PricingComparison')
    const second = getLazyComponent('PricingComparison')

    expect(first).toBe(second)
  })

  it('returns different components for different names', () => {
    const roi = getLazyComponent('ROICalculator')
    const demo = getLazyComponent('DemoScheduler')

    expect(roi).not.toBe(demo)
  })
})

describe('hasLazyLoader', () => {
  it('returns true for existing component', () => {
    expect(hasLazyLoader('ROICalculator')).toBe(true)
    expect(hasLazyLoader('DealFormGenerator')).toBe(true)
  })

  it('returns false for unknown component', () => {
    expect(hasLazyLoader('UnknownComponent')).toBe(false)
    expect(hasLazyLoader('')).toBe(false)
  })
})

describe('getAvailableLazyComponents', () => {
  it('returns all component names', () => {
    const names = getAvailableLazyComponents()

    expect(names).toContain('ROICalculator')
    expect(names).toContain('DealFormGenerator')
    expect(names).toContain('DemoScheduler')
    expect(names).toContain('PricingComparison')
    expect(names).toContain('QualificationDashboard')
    expect(names).toContain('CompetitorMatrix')
    expect(names).toContain('ScriptPreview')
    expect(names).toContain('InsightCard')
    expect(names).toContain('OnboardingTimeline')
    expect(names).toContain('EmailPreview')
  })

  it('returns array of 10 components', () => {
    const names = getAvailableLazyComponents()

    expect(names.length).toBe(10)
  })
})

describe('preloadComponent', () => {
  it('does not throw for valid component', async () => {
    await expect(preloadComponent('ROICalculator')).resolves.not.toThrow()
  })

  it('handles unknown component gracefully', async () => {
    // Should not throw, just log warning
    await expect(preloadComponent('UnknownComponent')).resolves.not.toThrow()
  })
})

describe('preloadComponents', () => {
  it('preloads multiple components in parallel', async () => {
    const components = ['ROICalculator', 'DealFormGenerator', 'DemoScheduler']

    await expect(preloadComponents(components)).resolves.not.toThrow()
  })

  it('handles empty array', async () => {
    await expect(preloadComponents([])).resolves.not.toThrow()
  })

  it('handles mix of valid and invalid components', async () => {
    const components = ['ROICalculator', 'UnknownComponent', 'DemoScheduler']

    await expect(preloadComponents(components)).resolves.not.toThrow()
  })
})
