/**
 * Tests for Trigger Logic - Intelligence Layer
 *
 * Tests component trigger evaluation based on intent, SPIN stage, and context.
 */

import { describe, it, expect } from 'vitest'
import {
  evaluateTriggers,
  shouldTriggerComponent,
  getComponentSuggestions,
  getSpinStageComponents,
  isComponentAppropriateForStage,
  type TriggerContext,
} from '../trigger-logic'
import type { ExtractedEntities, IntentAnalysis } from '../context-extractor'

// Helper to create base context
function createBaseContext(overrides: Partial<TriggerContext> = {}): TriggerContext {
  const baseEntities: ExtractedEntities = {
    monetaryValues: [],
    percentages: [],
    emails: [],
    phones: [],
    names: [],
    companies: [],
    dates: [],
    timeframes: [],
    competitors: [],
    industries: [],
    teamSizes: null,
    plans: [],
    painPoints: [],
    goals: [],
  }

  const baseIntent: IntentAnalysis = {
    primary: 'general_question',
    confidence: 0.5,
    secondary: null,
    signals: [],
  }

  return {
    intent: baseIntent,
    entities: baseEntities,
    spinState: 'Situation',
    leadScore: 50,
    conversationLength: 5,
    lastComponentRendered: null,
    turnsSinceLastComponent: 10,
    ...overrides,
  }
}

describe('evaluateTriggers', () => {
  it('recommends ROICalculator for ROI calculation intent with monetary data', () => {
    const context = createBaseContext({
      intent: {
        primary: 'roi_calculation',
        confidence: 0.8,
        secondary: null,
        signals: [],
      },
      entities: {
        ...createBaseContext().entities,
        monetaryValues: [
          { value: 15000, currency: 'BRL', context: 'cost', raw: 'R$ 15.000' },
        ],
      },
      spinState: 'Implication',
      leadScore: 60,
    })

    const result = evaluateTriggers(context)

    expect(result.shouldRender).toBe(true)
    expect(result.recommendation?.component).toBe('ROICalculator')
    expect(result.recommendation?.score).toBeGreaterThan(60)
  })

  it('recommends PricingComparison for pricing inquiry', () => {
    const context = createBaseContext({
      intent: {
        primary: 'pricing_inquiry',
        confidence: 0.9,
        secondary: null,
        signals: [],
      },
      spinState: 'NeedPayoff',
      leadScore: 50,
    })

    const result = evaluateTriggers(context)

    expect(result.shouldRender).toBe(true)
    expect(result.recommendation?.component).toBe('PricingComparison')
  })

  it('recommends DemoScheduler for demo request with high lead score', () => {
    const context = createBaseContext({
      intent: {
        primary: 'demo_request',
        confidence: 0.9,
        secondary: null,
        signals: [],
      },
      spinState: 'NeedPayoff',
      leadScore: 85,
      entities: {
        ...createBaseContext().entities,
        emails: ['test@test.com'],
        names: ['João'],
      },
    })

    const result = evaluateTriggers(context)

    expect(result.shouldRender).toBe(true)
    expect(result.recommendation?.component).toBe('DemoScheduler')
  })

  it('recommends CompetitorMatrix when competitor mentioned', () => {
    const context = createBaseContext({
      intent: {
        primary: 'competitor_comparison',
        confidence: 0.8,
        secondary: null,
        signals: [],
      },
      entities: {
        ...createBaseContext().entities,
        competitors: [
          { name: 'Pipedrive', normalized: 'pipedrive', sentiment: 'neutral' },
        ],
      },
      spinState: 'Problem',
      leadScore: 40,
    })

    const result = evaluateTriggers(context)

    expect(result.shouldRender).toBe(true)
    expect(result.recommendation?.component).toBe('CompetitorMatrix')
  })

  it('recommends OnboardingTimeline for implementation timeline intent', () => {
    const context = createBaseContext({
      intent: {
        primary: 'implementation_timeline',
        confidence: 0.9,
        secondary: null,
        signals: [],
      },
      spinState: 'NeedPayoff',
      leadScore: 70,
      entities: {
        ...createBaseContext().entities,
        teamSizes: 'small',
      },
    })

    const result = evaluateTriggers(context)

    expect(result.shouldRender).toBe(true)
    expect(result.recommendation?.component).toBe('OnboardingTimeline')
  })

  it('recommends DealFormGenerator for deal creation intent', () => {
    const context = createBaseContext({
      intent: {
        primary: 'deal_creation',
        confidence: 0.9,
        secondary: null,
        signals: [],
      },
      spinState: 'NeedPayoff',
      leadScore: 85,
      entities: {
        ...createBaseContext().entities,
        companies: ['Empresa XYZ'],
      },
    })

    const result = evaluateTriggers(context)

    expect(result.shouldRender).toBe(true)
    expect(result.recommendation?.component).toBe('DealFormGenerator')
  })

  it('does not recommend component when lead score is too low', () => {
    const context = createBaseContext({
      intent: {
        primary: 'demo_request',
        confidence: 0.9,
        secondary: null,
        signals: [],
      },
      spinState: 'NeedPayoff',
      leadScore: 30, // Below minimum for DemoScheduler
    })

    const result = evaluateTriggers(context)

    // Should either not render or recommend something else
    if (result.recommendation?.component === 'DemoScheduler') {
      expect(result.recommendation.score).toBeLessThan(60)
    }
  })

  it('prevents rendering same component too frequently', () => {
    const context = createBaseContext({
      intent: {
        primary: 'roi_calculation',
        confidence: 0.9,
        secondary: null,
        signals: [],
      },
      entities: {
        ...createBaseContext().entities,
        monetaryValues: [
          { value: 15000, currency: 'BRL', context: 'cost', raw: 'R$ 15.000' },
        ],
      },
      spinState: 'Implication',
      leadScore: 70,
      lastComponentRendered: 'ROICalculator',
      turnsSinceLastComponent: 1, // Too recent
    })

    const result = evaluateTriggers(context)

    // Should either not render or have lower score
    expect(result.shouldRender).toBe(false)
  })

  it('provides alternatives when main recommendation exists', () => {
    const context = createBaseContext({
      intent: {
        primary: 'pricing_inquiry',
        confidence: 0.9,
        secondary: 'roi_calculation',
        signals: [],
      },
      entities: {
        ...createBaseContext().entities,
        monetaryValues: [
          { value: 15000, currency: 'BRL', context: 'cost', raw: 'R$ 15.000' },
        ],
      },
      spinState: 'Implication',
      leadScore: 60,
    })

    const result = evaluateTriggers(context)

    expect(result.alternatives.length).toBeGreaterThan(0)
  })

  it('provides reasoning for not rendering', () => {
    const context = createBaseContext({
      intent: {
        primary: 'general_question',
        confidence: 0.3,
        secondary: null,
        signals: [],
      },
      spinState: 'Situation',
      leadScore: 20,
    })

    const result = evaluateTriggers(context)

    expect(result.reasoning).toBeTruthy()
  })
})

describe('shouldTriggerComponent', () => {
  it('returns true for ROICalculator with appropriate context', () => {
    const context = createBaseContext({
      intent: {
        primary: 'roi_calculation',
        confidence: 0.9,
        secondary: null,
        signals: [],
      },
      entities: {
        ...createBaseContext().entities,
        monetaryValues: [
          { value: 15000, currency: 'BRL', context: 'cost', raw: 'R$ 15.000' },
        ],
      },
      spinState: 'Implication',
      leadScore: 60,
    })

    const result = shouldTriggerComponent('ROICalculator', context)

    expect(result.shouldTrigger).toBe(true)
    expect(result.score).toBeGreaterThan(60)
  })

  it('returns false for unknown component', () => {
    const context = createBaseContext()
    const result = shouldTriggerComponent('UnknownComponent' as any, context)

    expect(result.shouldTrigger).toBe(false)
    expect(result.reason).toContain('not in trigger rules')
  })

  it('returns score and reason even when not triggered', () => {
    const context = createBaseContext({
      intent: {
        primary: 'general_question',
        confidence: 0.3,
        secondary: null,
        signals: [],
      },
    })

    const result = shouldTriggerComponent('DemoScheduler', context)

    expect(typeof result.score).toBe('number')
    expect(result.reason).toBeTruthy()
  })
})

describe('getComponentSuggestions', () => {
  it('returns sorted suggestions by score', () => {
    const context = createBaseContext({
      intent: {
        primary: 'pricing_inquiry',
        confidence: 0.8,
        secondary: 'roi_calculation',
        signals: [],
      },
      entities: {
        ...createBaseContext().entities,
        monetaryValues: [
          { value: 15000, currency: 'BRL', context: 'cost', raw: 'R$ 15.000' },
        ],
      },
      spinState: 'Implication',
      leadScore: 60,
    })

    const suggestions = getComponentSuggestions(context)

    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions.length).toBeLessThanOrEqual(3)

    // Check sorted by score descending
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i].score).toBeLessThanOrEqual(suggestions[i - 1].score)
    }
  })

  it('filters out low-score components', () => {
    const context = createBaseContext({
      intent: {
        primary: 'general_question',
        confidence: 0.3,
        secondary: null,
        signals: [],
      },
    })

    const suggestions = getComponentSuggestions(context)

    // All suggestions should have score >= 40
    suggestions.forEach(s => {
      expect(s.score).toBeGreaterThanOrEqual(40)
    })
  })
})

describe('getSpinStageComponents', () => {
  it('returns appropriate components for Situation stage', () => {
    const components = getSpinStageComponents('Situation')

    expect(components).toContain('ScriptPreview')
    expect(components).toContain('EmailPreview')
  })

  it('returns appropriate components for Problem stage', () => {
    const components = getSpinStageComponents('Problem')

    expect(components).toContain('InsightCard')
    expect(components).toContain('QualificationDashboard')
    expect(components).toContain('CompetitorMatrix')
  })

  it('returns appropriate components for Implication stage', () => {
    const components = getSpinStageComponents('Implication')

    expect(components).toContain('ROICalculator')
    expect(components).toContain('QualificationDashboard')
    expect(components).toContain('OnboardingTimeline')
  })

  it('returns appropriate components for NeedPayoff stage', () => {
    const components = getSpinStageComponents('NeedPayoff')

    expect(components).toContain('PricingComparison')
    expect(components).toContain('DemoScheduler')
    expect(components).toContain('DealFormGenerator')
  })
})

describe('isComponentAppropriateForStage', () => {
  it('returns true for ROICalculator in Implication stage', () => {
    expect(isComponentAppropriateForStage('ROICalculator', 'Implication')).toBe(true)
  })

  it('returns false for ROICalculator in Situation stage', () => {
    expect(isComponentAppropriateForStage('ROICalculator', 'Situation')).toBe(false)
  })

  it('returns true for DemoScheduler in NeedPayoff stage', () => {
    expect(isComponentAppropriateForStage('DemoScheduler', 'NeedPayoff')).toBe(true)
  })

  it('returns false for DemoScheduler in Problem stage', () => {
    expect(isComponentAppropriateForStage('DemoScheduler', 'Problem')).toBe(false)
  })

  it('returns true for ScriptPreview in Situation stage', () => {
    expect(isComponentAppropriateForStage('ScriptPreview', 'Situation')).toBe(true)
  })
})
