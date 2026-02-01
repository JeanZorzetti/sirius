/**
 * Intelligence Layer - Generative UI
 *
 * Central module for AI-powered UI decisions.
 * Exports all intelligence utilities for use in the chat API.
 */

// Context Extraction
export {
  extractEntities,
  extractEntitiesFromHistory,
  detectIntent,
  extractMonetaryValues,
  extractCompetitors,
  extractEmails,
  extractPhones,
  extractNames,
  extractCompanies,
  extractTeamSize,
  extractPainPoints,
  extractGoals,
  type ExtractedEntities,
  type MonetaryValue,
  type DateEntity,
  type CompetitorMention,
  type TeamSize,
  type UserIntent,
  type IntentAnalysis,
} from './context-extractor'

// Trigger Logic
export {
  evaluateTriggers,
  shouldTriggerComponent,
  getComponentSuggestions,
  getSpinStageComponents,
  isComponentAppropriateForStage,
  type ComponentName,
  type TriggerContext,
  type ComponentTrigger,
  type TriggerResult,
} from './trigger-logic'

// Props Auto-Fill
export {
  autoFillProps,
  autoFillROICalculator,
  autoFillDealForm,
  autoFillDemoScheduler,
  autoFillPricingComparison,
  autoFillCompetitorMatrix,
  autoFillQualificationDashboard,
  autoFillOnboardingTimeline,
  type AutoFillContext,
  type AutoFillResult,
} from './props-auto-fill'

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { extractEntitiesFromHistory, detectIntent, type ExtractedEntities, type IntentAnalysis } from './context-extractor'
import { evaluateTriggers, type TriggerContext, type TriggerResult } from './trigger-logic'
import { autoFillProps, type AutoFillContext, type AutoFillResult } from './props-auto-fill'
import type { SPINState } from '@/lib/agi/spin-engine'

export interface IntelligenceContext {
  messages: { role: string; content: string }[]
  spinState: SPINState
  leadScore: number
  lastComponentRendered?: string
  turnsSinceLastComponent?: number
  dealContext?: {
    contactName?: string
    contactEmail?: string
    company?: string
    value?: number
  }
}

export interface IntelligenceResult {
  entities: ExtractedEntities
  intent: IntentAnalysis
  trigger: TriggerResult
  suggestedProps?: Record<string, unknown>
  confidence: number
}

/**
 * Run full intelligence analysis on conversation
 */
export function analyzeConversation(context: IntelligenceContext): IntelligenceResult {
  // Extract entities from all messages
  const entities = extractEntitiesFromHistory(context.messages)

  // Detect intent from last user message
  const lastUserMessage = context.messages
    .filter(m => m.role === 'user')
    .pop()
  const intent = lastUserMessage
    ? detectIntent(lastUserMessage.content)
    : { primary: 'general_question' as const, confidence: 0.3, secondary: null, signals: [] }

  // Build trigger context
  const triggerContext: TriggerContext = {
    intent,
    entities,
    spinState: context.spinState,
    leadScore: context.leadScore,
    conversationLength: context.messages.filter(m => m.role === 'user').length,
    lastComponentRendered: context.lastComponentRendered as any || null,
    turnsSinceLastComponent: context.turnsSinceLastComponent ?? 10,
  }

  // Evaluate triggers
  const trigger = evaluateTriggers(triggerContext)

  // Auto-fill props if we have a recommendation
  let suggestedProps: Record<string, unknown> | undefined
  let propsConfidence = 0

  if (trigger.recommendation) {
    const autoFillContext: AutoFillContext = {
      entities,
      spinState: context.spinState,
      leadScore: context.leadScore,
      dealContext: context.dealContext,
    }

    try {
      const result = autoFillProps(trigger.recommendation.component as any, autoFillContext)
      suggestedProps = result.props
      propsConfidence = result.confidence
    } catch {
      // Component doesn't have auto-fill yet
    }
  }

  // Calculate overall confidence
  const confidence = trigger.recommendation
    ? (intent.confidence + trigger.recommendation.score / 100 + propsConfidence) / 3
    : intent.confidence * 0.5

  return {
    entities,
    intent,
    trigger,
    suggestedProps,
    confidence,
  }
}

/**
 * Quick check if any UI should be rendered for a message
 */
export function shouldRenderUI(
  message: string,
  spinState: SPINState,
  leadScore: number
): { should: boolean; component?: string; reason: string } {
  const intent = detectIntent(message)
  const entities = extractEntitiesFromHistory([{ role: 'user', content: message }])

  const triggerContext: TriggerContext = {
    intent,
    entities,
    spinState,
    leadScore,
    conversationLength: 5, // Assume mid-conversation
    lastComponentRendered: null,
    turnsSinceLastComponent: 10,
  }

  const result = evaluateTriggers(triggerContext)

  return {
    should: result.shouldRender,
    component: result.recommendation?.component,
    reason: result.reasoning,
  }
}
