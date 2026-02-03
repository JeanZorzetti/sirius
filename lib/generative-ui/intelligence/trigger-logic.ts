/**
 * Trigger Logic - Intelligence Layer
 *
 * Determines when to render UI components based on:
 * - User intent
 * - SPIN stage
 * - Lead score
 * - Conversation context
 */

import type { SPINState } from '@/lib/agi/spin-engine'
import type { ExtractedEntities, UserIntent, IntentAnalysis } from './context-extractor'

// ============================================
// TYPES
// ============================================

export type ComponentName =
  | 'ROICalculator'
  | 'DealFormGenerator'
  | 'PricingComparison'
  | 'ScriptPreview'
  | 'DemoScheduler'
  | 'QualificationDashboard'
  | 'CompetitorMatrix'
  | 'OnboardingTimeline'
  | 'InsightCard'
  | 'EmailPreview'

export interface TriggerContext {
  intent: IntentAnalysis
  entities: ExtractedEntities
  spinState: SPINState
  leadScore: number
  conversationLength: number
  lastComponentRendered: ComponentName | null
  turnsSinceLastComponent: number
}

export interface ComponentTrigger {
  component: ComponentName
  score: number // 0-100
  reason: string
  requiredData: string[]
  missingData: string[]
  canRender: boolean
}

export interface TriggerResult {
  shouldRender: boolean
  recommendation: ComponentTrigger | null
  alternatives: ComponentTrigger[]
  reasoning: string
}

// ============================================
// TRIGGER RULES
// ============================================

interface TriggerRule {
  component: ComponentName
  intents: UserIntent[]
  spinStages: SPINState[]
  minLeadScore: number
  requiredEntities: (keyof ExtractedEntities)[]
  baseScore: number
  bonuses: {
    condition: (ctx: TriggerContext) => boolean
    points: number
    description: string
  }[]
}

const TRIGGER_RULES: TriggerRule[] = [
  {
    component: 'ROICalculator',
    intents: ['roi_calculation', 'pricing_inquiry'],
    spinStages: ['Situation', 'Problem', 'Implication', 'NeedPayoff'], // Allow in any SPIN stage
    minLeadScore: 20, // Lower threshold to allow showing calculator sooner
    requiredEntities: [], // Don't require monetary values - can show calculator with defaults
    baseScore: 70, // Higher base score since ROI is important
    bonuses: [
      {
        condition: (ctx) => ctx.entities.monetaryValues.some(v => v.context === 'cost'),
        points: 20,
        description: 'Has cost data for prefill',
      },
      {
        condition: (ctx) => ctx.intent.primary === 'roi_calculation',
        points: 25,
        description: 'Direct ROI question',
      },
      {
        condition: (ctx) => ctx.spinState === 'Implication',
        points: 10,
        description: 'In Implication stage',
      },
      {
        condition: (ctx) => ctx.leadScore >= 50,
        points: 5,
        description: 'Lead score >= 50',
      },
    ],
  },
  {
    component: 'PricingComparison',
    intents: ['pricing_inquiry', 'objection'],
    spinStages: ['Problem', 'Implication', 'NeedPayoff'],
    minLeadScore: 20,
    requiredEntities: [],
    baseScore: 55,
    bonuses: [
      {
        condition: (ctx) => ctx.intent.primary === 'pricing_inquiry',
        points: 25,
        description: 'Direct pricing question',
      },
      {
        condition: (ctx) => ctx.spinState === 'NeedPayoff',
        points: 15,
        description: 'In NeedPayoff stage',
      },
      {
        condition: (ctx) => ctx.intent.primary === 'objection',
        points: 10,
        description: 'Price objection handling',
      },
    ],
  },
  {
    component: 'DemoScheduler',
    intents: ['demo_request', 'closing_intent'],
    spinStages: ['NeedPayoff'],
    minLeadScore: 70,
    requiredEntities: [],
    baseScore: 70,
    bonuses: [
      {
        condition: (ctx) => ctx.intent.primary === 'demo_request',
        points: 20,
        description: 'Direct demo request',
      },
      {
        condition: (ctx) => ctx.leadScore >= 80,
        points: 15,
        description: 'High lead score',
      },
      {
        condition: (ctx) => ctx.entities.emails.length > 0,
        points: 10,
        description: 'Has email for prefill',
      },
      {
        condition: (ctx) => ctx.entities.names.length > 0,
        points: 5,
        description: 'Has name for prefill',
      },
    ],
  },
  {
    component: 'DealFormGenerator',
    intents: ['deal_creation', 'closing_intent'],
    spinStages: ['NeedPayoff'],
    minLeadScore: 60,
    requiredEntities: [],
    baseScore: 65,
    bonuses: [
      {
        condition: (ctx) => ctx.intent.primary === 'closing_intent',
        points: 25,
        description: 'Closing intent detected',
      },
      {
        condition: (ctx) => ctx.leadScore >= 80,
        points: 15,
        description: 'High qualification',
      },
      {
        condition: (ctx) => ctx.entities.companies.length > 0,
        points: 10,
        description: 'Has company name',
      },
      {
        condition: (ctx) => ctx.entities.monetaryValues.length > 0,
        points: 5,
        description: 'Has deal value hint',
      },
    ],
  },
  {
    component: 'CompetitorMatrix',
    intents: ['competitor_comparison'],
    spinStages: ['Problem', 'Implication', 'NeedPayoff'],
    minLeadScore: 20,
    requiredEntities: ['competitors'],
    baseScore: 70,
    bonuses: [
      {
        condition: (ctx) => ctx.entities.competitors.length >= 2,
        points: 15,
        description: 'Multiple competitors mentioned',
      },
      {
        condition: (ctx) => ctx.entities.competitors.some(c => c.sentiment === 'negative'),
        points: 10,
        description: 'Negative competitor sentiment',
      },
    ],
  },
  {
    component: 'QualificationDashboard',
    intents: ['qualification_check'],
    spinStages: ['Problem', 'Implication'],
    minLeadScore: 40,
    requiredEntities: [],
    baseScore: 55,
    bonuses: [
      {
        condition: (ctx) => ctx.conversationLength >= 6,
        points: 20,
        description: 'Sufficient conversation depth',
      },
      {
        condition: (ctx) => ctx.entities.painPoints.length >= 2,
        points: 15,
        description: 'Multiple pain points identified',
      },
      {
        condition: (ctx) => ctx.intent.primary === 'qualification_check',
        points: 15,
        description: 'Direct fit question',
      },
    ],
  },
  {
    component: 'OnboardingTimeline',
    intents: ['implementation_timeline'],
    spinStages: ['Implication', 'NeedPayoff'],
    minLeadScore: 50,
    requiredEntities: [],
    baseScore: 60,
    bonuses: [
      {
        condition: (ctx) => ctx.intent.primary === 'implementation_timeline',
        points: 25,
        description: 'Direct timeline question',
      },
      {
        condition: (ctx) => ctx.entities.teamSizes !== null,
        points: 15,
        description: 'Team size known',
      },
      {
        condition: (ctx) => ctx.leadScore >= 70,
        points: 10,
        description: 'Qualified lead',
      },
    ],
  },
  {
    component: 'ScriptPreview',
    intents: ['script_generation'],
    spinStages: ['Situation', 'Problem', 'Implication', 'NeedPayoff'],
    minLeadScore: 0,
    requiredEntities: [],
    baseScore: 65,
    bonuses: [
      {
        condition: (ctx) => ctx.intent.primary === 'script_generation',
        points: 30,
        description: 'Direct script request',
      },
    ],
  },
  {
    component: 'InsightCard',
    intents: ['general_question'],
    spinStages: ['Problem', 'Implication'],
    minLeadScore: 30,
    requiredEntities: ['painPoints'],
    baseScore: 40,
    bonuses: [
      {
        condition: (ctx) => ctx.entities.painPoints.length >= 3,
        points: 20,
        description: 'Multiple pain points to highlight',
      },
      {
        condition: (ctx) => ctx.spinState === 'Problem',
        points: 15,
        description: 'Good stage for insights',
      },
    ],
  },
  {
    component: 'EmailPreview',
    intents: ['script_generation'],
    spinStages: ['Situation', 'Problem', 'Implication', 'NeedPayoff'],
    minLeadScore: 0,
    requiredEntities: [],
    baseScore: 50,
    bonuses: [
      {
        condition: (ctx) =>
          ctx.intent.primary === 'script_generation' &&
          ctx.intent.signals.some(s => s.includes('email')),
        points: 35,
        description: 'Email template requested',
      },
    ],
  },
]

// ============================================
// TRIGGER EVALUATION
// ============================================

function evaluateRule(rule: TriggerRule, context: TriggerContext): ComponentTrigger {
  let score = 0
  const reasons: string[] = []
  const missingData: string[] = []

  // Check intent match
  if (rule.intents.includes(context.intent.primary)) {
    score += rule.baseScore
    reasons.push(`Intent matches: ${context.intent.primary}`)
  } else if (context.intent.secondary && rule.intents.includes(context.intent.secondary)) {
    score += rule.baseScore * 0.7
    reasons.push(`Secondary intent matches: ${context.intent.secondary}`)
  } else {
    // No intent match - low base score
    score += rule.baseScore * 0.3
  }

  // Check SPIN stage
  if (rule.spinStages.includes(context.spinState)) {
    score += 10
    reasons.push(`SPIN stage compatible: ${context.spinState}`)
  } else {
    score -= 15
    reasons.push(`SPIN stage not ideal: ${context.spinState}`)
  }

  // Check lead score
  if (context.leadScore >= rule.minLeadScore) {
    score += 5
  } else {
    score -= 20
    reasons.push(`Lead score below minimum: ${context.leadScore} < ${rule.minLeadScore}`)
  }

  // Check required entities
  for (const entityType of rule.requiredEntities) {
    const entity = context.entities[entityType]
    const hasEntity = Array.isArray(entity)
      ? entity.length > 0
      : entity !== null && entity !== undefined

    if (!hasEntity) {
      missingData.push(entityType)
      score -= 25
    }
  }

  // Apply bonuses
  for (const bonus of rule.bonuses) {
    if (bonus.condition(context)) {
      score += bonus.points
      reasons.push(bonus.description)
    }
  }

  // Prevent rendering same component too frequently
  if (context.lastComponentRendered === rule.component && context.turnsSinceLastComponent < 3) {
    score -= 40
    reasons.push('Recently rendered - cooling down')
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score))

  return {
    component: rule.component,
    score,
    reason: reasons.join('; '),
    requiredData: rule.requiredEntities,
    missingData,
    canRender: missingData.length === 0 && score >= 50,
  }
}

// ============================================
// MAIN TRIGGER FUNCTION
// ============================================

/**
 * Evaluate all trigger rules and determine which component to render
 */
export function evaluateTriggers(context: TriggerContext): TriggerResult {
  const evaluations = TRIGGER_RULES.map(rule => evaluateRule(rule, context))

  // Sort by score descending
  evaluations.sort((a, b) => b.score - a.score)

  const topCandidate = evaluations[0]
  const alternatives = evaluations.slice(1, 4).filter(e => e.score >= 40)

  // Determine if we should render
  const shouldRender =
    topCandidate.canRender &&
    topCandidate.score >= 50 && // Lowered from 60 to be more permissive
    context.turnsSinceLastComponent >= 2

  let reasoning = ''
  if (!shouldRender) {
    if (!topCandidate.canRender) {
      reasoning = `Missing required data: ${topCandidate.missingData.join(', ')}`
    } else if (topCandidate.score < 50) {
      reasoning = `Score too low (${topCandidate.score}/100) - not confident enough`
    } else if (context.turnsSinceLastComponent < 2) {
      reasoning = 'Too soon after last component - maintaining conversation flow'
    }
  } else {
    reasoning = `High confidence (${topCandidate.score}/100): ${topCandidate.reason}`
  }

  return {
    shouldRender,
    recommendation: shouldRender ? topCandidate : null,
    alternatives,
    reasoning,
  }
}

/**
 * Check if a specific component should be triggered
 */
export function shouldTriggerComponent(
  component: ComponentName,
  context: TriggerContext
): { shouldTrigger: boolean; score: number; reason: string } {
  const rule = TRIGGER_RULES.find(r => r.component === component)

  if (!rule) {
    return { shouldTrigger: false, score: 0, reason: 'Component not in trigger rules' }
  }

  const evaluation = evaluateRule(rule, context)

  return {
    shouldTrigger: evaluation.canRender && evaluation.score >= 60,
    score: evaluation.score,
    reason: evaluation.reason,
  }
}

/**
 * Get component suggestions for current context
 */
export function getComponentSuggestions(context: TriggerContext): ComponentTrigger[] {
  return TRIGGER_RULES
    .map(rule => evaluateRule(rule, context))
    .filter(e => e.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

// ============================================
// SPIN STAGE COMPATIBILITY
// ============================================

const SPIN_COMPONENT_AFFINITY: Record<SPINState, ComponentName[]> = {
  Situation: ['ScriptPreview', 'EmailPreview'],
  Problem: ['InsightCard', 'QualificationDashboard', 'CompetitorMatrix'],
  Implication: ['ROICalculator', 'QualificationDashboard', 'OnboardingTimeline'],
  NeedPayoff: ['PricingComparison', 'DemoScheduler', 'DealFormGenerator', 'OnboardingTimeline'],
}

/**
 * Get components most suitable for current SPIN stage
 */
export function getSpinStageComponents(spinState: SPINState): ComponentName[] {
  return SPIN_COMPONENT_AFFINITY[spinState] || []
}

/**
 * Check if component is appropriate for SPIN stage
 */
export function isComponentAppropriateForStage(
  component: ComponentName,
  spinState: SPINState
): boolean {
  return SPIN_COMPONENT_AFFINITY[spinState]?.includes(component) ?? false
}
