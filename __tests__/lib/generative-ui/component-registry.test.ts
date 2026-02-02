/**
 * Tests for Component Registry
 *
 * Validates:
 * - Component registration integrity
 * - Props validation with Zod schemas
 * - Helper functions
 * - Registry completeness
 */

import { describe, it, expect } from 'vitest'
import {
  SALES_UI_COMPONENTS,
  validateComponentProps,
  getComponentsForAI,
  getComponentDefinition,
  hasComponent,
  getComponentNames,
} from '@/lib/generative-ui/component-registry'

describe('Component Registry', () => {
  describe('SALES_UI_COMPONENTS', () => {
    it('should have exactly 10 components registered', () => {
      const componentNames = Object.keys(SALES_UI_COMPONENTS)
      expect(componentNames).toHaveLength(10)
    })

    it('should include all expected components', () => {
      const expectedComponents = [
        'ROICalculator',
        'DealFormGenerator',
        'PricingComparison',
        'ScriptPreview',
        'DemoScheduler',
        'QualificationDashboard',
        'CompetitorMatrix',
        'OnboardingTimeline',
        'InsightCard',
        'EmailPreview',
      ]

      expectedComponents.forEach((name) => {
        expect(SALES_UI_COMPONENTS).toHaveProperty(name)
      })
    })

    it('should have valid structure for each component', () => {
      Object.entries(SALES_UI_COMPONENTS).forEach(([name, component]) => {
        expect(component).toHaveProperty('name', name)
        expect(component).toHaveProperty('description')
        expect(component).toHaveProperty('when_to_use')
        expect(component).toHaveProperty('required_context')
        expect(component).toHaveProperty('props_schema')
        expect(component).toHaveProperty('render')
        expect(component).toHaveProperty('skeleton')

        // Validate types
        expect(typeof component.description).toBe('string')
        expect(Array.isArray(component.when_to_use)).toBe(true)
        expect(Array.isArray(component.required_context)).toBe(true)
        expect(typeof component.render).toBe('function')
        expect(component.skeleton).toHaveProperty('height')
        expect(component.skeleton).toHaveProperty('variant')
      })
    })

    it('should have examples for key components', () => {
      const componentsWithExamples = [
        'ROICalculator',
        'DealFormGenerator',
        'DemoScheduler',
        'PricingComparison',
      ]

      componentsWithExamples.forEach((name) => {
        const component = SALES_UI_COMPONENTS[name]
        expect(component).toHaveProperty('example')
        expect(component.example).toHaveProperty('scenario')
        expect(component.example).toHaveProperty('invocation')
      })
    })
  })

  describe('validateComponentProps', () => {
    it('should validate valid ROICalculator props', () => {
      const validProps = {
        scenario: {
          currentCost: 15000,
          withSirius: 8000,
          monthlySavings: 7000,
          annualROI: 84000,
          paybackPeriod: 2,
        },
        industry: 'orthodontics',
        comparisonMode: true,
      }

      const result = validateComponentProps('ROICalculator', validProps)

      expect(result.valid).toBe(true)
      expect(result.data).toEqual(validProps)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid ROICalculator props (negative cost)', () => {
      const invalidProps = {
        scenario: {
          currentCost: -100, // Negative = invalid
          withSirius: 8000,
          monthlySavings: 7000,
          annualROI: 84000,
          paybackPeriod: 2,
        },
      }

      const result = validateComponentProps('ROICalculator', invalidProps)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('validation failed')
    })

    it('should reject non-existent component', () => {
      const result = validateComponentProps('NonExistentComponent', {})

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not found in registry')
      expect(result.error).toContain('Available:')
    })

    it('should validate DealFormGenerator with prefill', () => {
      const validProps = {
        prefill: {
          title: 'Test Deal',
          value: 12000,
          closeDate: '2026-03-15',
        },
        suggestedTags: ['test', 'high-value'],
        aiNotes: 'Test notes',
        quickCreate: false,
      }

      const result = validateComponentProps('DealFormGenerator', validProps)

      expect(result.valid).toBe(true)
      expect(result.data).toMatchObject({
        prefill: {
          title: 'Test Deal',
          value: 12000,
          closeDate: '2026-03-15',
        },
        suggestedTags: ['test', 'high-value'],
        aiNotes: 'Test notes',
      })
    })

    it('should validate DealFormGenerator without prefill', () => {
      const validProps = {}

      const result = validateComponentProps('DealFormGenerator', validProps)

      expect(result.valid).toBe(true)
    })

    it('should validate DemoScheduler with minimal props', () => {
      const minimalProps = {
        eventType: 'demo_30min',
      }

      const result = validateComponentProps('DemoScheduler', minimalProps)

      expect(result.valid).toBe(true)
    })

    it('should validate PricingComparison with highlighting', () => {
      const validProps = {
        highlighted: 'pro',
        emphasize_features: ['api_access', 'unlimited_contacts'],
        show_roi_badge: true,
        annual_savings: 84000,
      }

      const result = validateComponentProps('PricingComparison', validProps)

      expect(result.valid).toBe(true)
    })

    it('should reject invalid enum value', () => {
      const invalidProps = {
        highlighted: 'invalid-plan', // Should be 'free' or 'pro'
      }

      const result = validateComponentProps('PricingComparison', invalidProps)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getComponentsForAI', () => {
    it('should return simplified component list', () => {
      const aiComponents = getComponentsForAI()

      expect(Array.isArray(aiComponents)).toBe(true)
      expect(aiComponents).toHaveLength(10)
    })

    it('should include required fields for AI decision-making', () => {
      const aiComponents = getComponentsForAI()

      aiComponents.forEach((component) => {
        expect(component).toHaveProperty('name')
        expect(component).toHaveProperty('description')
        expect(component).toHaveProperty('when_to_use')
        expect(component).toHaveProperty('required_context')
        expect(component).toHaveProperty('optional_context')

        // Should NOT include implementation details
        expect(component).not.toHaveProperty('render')
        expect(component).not.toHaveProperty('props_schema')
      })
    })

    it('should include example scenarios where available', () => {
      const aiComponents = getComponentsForAI()
      const roiCalculator = aiComponents.find((c) => c.name === 'ROICalculator')

      expect(roiCalculator?.example_scenario).toBeDefined()
      expect(roiCalculator?.example_scenario).toContain('R$15k/mês')
    })
  })

  describe('getComponentDefinition', () => {
    it('should return component definition by name', () => {
      const component = getComponentDefinition('ROICalculator')

      expect(component).toBeDefined()
      expect(component?.name).toBe('ROICalculator')
      expect(component?.description).toContain('Calculadora interativa')
    })

    it('should return undefined for non-existent component', () => {
      const component = getComponentDefinition('NonExistent')

      expect(component).toBeUndefined()
    })
  })

  describe('hasComponent', () => {
    it('should return true for existing components', () => {
      expect(hasComponent('ROICalculator')).toBe(true)
      expect(hasComponent('DealFormGenerator')).toBe(true)
      expect(hasComponent('DemoScheduler')).toBe(true)
    })

    it('should return false for non-existent components', () => {
      expect(hasComponent('NonExistent')).toBe(false)
      expect(hasComponent('FakeComponent')).toBe(false)
    })
  })

  describe('getComponentNames', () => {
    it('should return array of all component names', () => {
      const names = getComponentNames()

      expect(Array.isArray(names)).toBe(true)
      expect(names).toHaveLength(10)
      expect(names).toContain('ROICalculator')
      expect(names).toContain('DealFormGenerator')
    })

    it('should return names in consistent order', () => {
      const names1 = getComponentNames()
      const names2 = getComponentNames()

      expect(names1).toEqual(names2)
    })
  })

  describe('Component Triggers', () => {
    it('should define triggers for conversion components', () => {
      expect(SALES_UI_COMPONENTS.ROICalculator.triggers_event).toBe('roi_calculated')
      expect(SALES_UI_COMPONENTS.DealFormGenerator.triggers_event).toBe('deal_created')
      expect(SALES_UI_COMPONENTS.DemoScheduler.triggers_event).toBe('demo_scheduled')
      expect(SALES_UI_COMPONENTS.ScriptPreview.triggers_event).toBe('script_copied')
    })
  })

  describe('Skeleton Configuration', () => {
    it('should have unique skeleton variants', () => {
      const variants = Object.values(SALES_UI_COMPONENTS)
        .map((c) => c.skeleton?.variant)
        .filter(Boolean)
      const uniqueVariants = new Set(variants)

      // Should have variety (not all the same)
      expect(uniqueVariants.size).toBeGreaterThan(3)
    })

    it('should have reasonable skeleton heights', () => {
      Object.values(SALES_UI_COMPONENTS).forEach((component) => {
        const height = component.skeleton?.height

        if (height) {
          expect(height).toBeGreaterThan(0)
          expect(height).toBeLessThan(1000) // Reasonable max height
        }
      })
    })
  })
})
