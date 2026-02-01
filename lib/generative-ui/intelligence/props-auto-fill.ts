/**
 * Props Auto-Fill - Intelligence Layer
 *
 * Automatically infers component props from conversation context.
 * Provides fallbacks for missing data.
 */

import type { ExtractedEntities, CompetitorMention } from './context-extractor'
import type { ComponentName } from './trigger-logic'
import type { SPINState } from '@/lib/agi/spin-engine'

// ============================================
// TYPES
// ============================================

export interface AutoFillContext {
  entities: ExtractedEntities
  spinState: SPINState
  leadScore: number
  conversationSummary?: string
  dealContext?: {
    contactName?: string
    contactEmail?: string
    company?: string
    value?: number
  }
}

export interface AutoFillResult<T = Record<string, unknown>> {
  props: T
  confidence: number // 0-1
  filledFields: string[]
  missingFields: string[]
  warnings: string[]
}

// ============================================
// ROI CALCULATOR AUTO-FILL
// ============================================

interface ROICalculatorProps {
  scenario: {
    currentCost: number
    withSirius: number
    monthlySavings: number
    annualROI: number
    paybackPeriod: number
  }
  industry?: 'orthodontics' | 'retail' | 'services' | 'manufacturing' | 'other'
  comparisonMode?: boolean
}

export function autoFillROICalculator(context: AutoFillContext): AutoFillResult<ROICalculatorProps> {
  const filledFields: string[] = []
  const missingFields: string[] = []
  const warnings: string[] = []

  // Find cost-related monetary values
  const costValues = context.entities.monetaryValues.filter(v => v.context === 'cost')
  const anyValues = context.entities.monetaryValues

  let currentCost = 15000 // Default
  if (costValues.length > 0) {
    currentCost = costValues[0].value
    filledFields.push('currentCost')
  } else if (anyValues.length > 0) {
    currentCost = anyValues[0].value
    filledFields.push('currentCost (inferred)')
    warnings.push('Used non-cost value as currentCost - may need confirmation')
  } else {
    missingFields.push('currentCost')
    warnings.push('Using default currentCost of R$15,000 - ask user to confirm')
  }

  // Calculate Sirius cost (PRO plan = R$97/user, estimate based on team size)
  let teamMultiplier = 5 // Default 5 users
  if (context.entities.teamSizes) {
    const sizeMap = { solo: 1, small: 3, medium: 8, large: 20 }
    teamMultiplier = sizeMap[context.entities.teamSizes]
    filledFields.push('teamSize')
  }

  const withSirius = 97 * teamMultiplier
  const monthlySavings = Math.max(0, currentCost - withSirius)
  const annualROI = monthlySavings * 12
  const paybackPeriod = monthlySavings > 0 ? Math.ceil(withSirius / monthlySavings) : 0

  // Detect industry from entities or pain points
  let industry: ROICalculatorProps['industry'] = 'other'
  const allText = [...context.entities.painPoints, ...context.entities.goals].join(' ').toLowerCase()
  if (allText.includes('clínica') || allText.includes('ortodont') || allText.includes('odonto')) {
    industry = 'orthodontics'
    filledFields.push('industry')
  } else if (allText.includes('loja') || allText.includes('varejo') || allText.includes('venda')) {
    industry = 'retail'
    filledFields.push('industry')
  }

  const props: ROICalculatorProps = {
    scenario: {
      currentCost,
      withSirius,
      monthlySavings,
      annualROI,
      paybackPeriod,
    },
    industry,
    comparisonMode: true,
  }

  const confidence = filledFields.includes('currentCost') ? 0.8 : 0.4

  return { props, confidence, filledFields, missingFields, warnings }
}

// ============================================
// DEAL FORM AUTO-FILL
// ============================================

interface DealFormProps {
  prefill?: {
    title?: string
    value?: number
    closeDate?: string
    contactId?: string
    pipelineId?: string
    stageId?: string
  }
  suggestedTags?: string[]
  aiNotes?: string
  quickCreate?: boolean
}

export function autoFillDealForm(context: AutoFillContext): AutoFillResult<DealFormProps> {
  const filledFields: string[] = []
  const missingFields: string[] = []
  const warnings: string[] = []

  const prefill: DealFormProps['prefill'] = {}

  // Generate title from company name
  if (context.entities.companies.length > 0) {
    prefill.title = `Implementação Sirius CRM - ${context.entities.companies[0]}`
    filledFields.push('title')
  } else if (context.dealContext?.company) {
    prefill.title = `Implementação Sirius CRM - ${context.dealContext.company}`
    filledFields.push('title')
  } else {
    missingFields.push('title')
  }

  // Extract deal value
  if (context.entities.monetaryValues.length > 0) {
    prefill.value = context.entities.monetaryValues[0].value
    filledFields.push('value')
  } else if (context.dealContext?.value) {
    prefill.value = context.dealContext.value
    filledFields.push('value')
  }

  // Set close date (default: 30 days from now)
  const closeDate = new Date()
  closeDate.setDate(closeDate.getDate() + 30)
  prefill.closeDate = closeDate.toISOString().split('T')[0]
  filledFields.push('closeDate (default)')

  // Generate tags from context
  const suggestedTags: string[] = []

  if (context.entities.competitors.length > 0) {
    suggestedTags.push('concorrente-avaliado')
  }
  if (context.leadScore >= 80) {
    suggestedTags.push('high-value')
  }
  if (context.spinState === 'NeedPayoff') {
    suggestedTags.push('qualificado')
  }
  if (context.entities.painPoints.length >= 2) {
    suggestedTags.push('pain-identified')
  }

  // Add industry tags
  const allText = context.entities.painPoints.join(' ').toLowerCase()
  if (allText.includes('clínica') || allText.includes('ortodont')) {
    suggestedTags.push('ortodontia')
  }

  // Generate AI notes
  const aiNotes: string[] = []
  if (context.entities.painPoints.length > 0) {
    aiNotes.push(`Pain Points: ${context.entities.painPoints.slice(0, 3).join(', ')}`)
  }
  if (context.entities.goals.length > 0) {
    aiNotes.push(`Objetivos: ${context.entities.goals.slice(0, 2).join(', ')}`)
  }
  if (context.entities.competitors.length > 0) {
    aiNotes.push(`Concorrentes avaliados: ${context.entities.competitors.map(c => c.name).join(', ')}`)
  }
  aiNotes.push(`Lead Score: ${context.leadScore}/100 | SPIN Stage: ${context.spinState}`)

  const props: DealFormProps = {
    prefill,
    suggestedTags,
    aiNotes: aiNotes.join('\n'),
    quickCreate: false,
  }

  const confidence = filledFields.length / 4 // 4 key fields

  return { props, confidence, filledFields, missingFields, warnings }
}

// ============================================
// DEMO SCHEDULER AUTO-FILL
// ============================================

interface DemoSchedulerProps {
  eventType: 'demo_30min' | 'demo_60min' | 'onboarding_call'
  prefill?: {
    name?: string
    email?: string
    company?: string
  }
  autoTriggerCRM?: boolean
}

export function autoFillDemoScheduler(context: AutoFillContext): AutoFillResult<DemoSchedulerProps> {
  const filledFields: string[] = []
  const missingFields: string[] = []
  const warnings: string[] = []

  const prefill: DemoSchedulerProps['prefill'] = {}

  // Fill name
  if (context.entities.names.length > 0) {
    prefill.name = context.entities.names[0]
    filledFields.push('name')
  } else if (context.dealContext?.contactName) {
    prefill.name = context.dealContext.contactName
    filledFields.push('name')
  } else {
    missingFields.push('name')
  }

  // Fill email
  if (context.entities.emails.length > 0) {
    prefill.email = context.entities.emails[0]
    filledFields.push('email')
  } else if (context.dealContext?.contactEmail) {
    prefill.email = context.dealContext.contactEmail
    filledFields.push('email')
  } else {
    missingFields.push('email')
  }

  // Fill company
  if (context.entities.companies.length > 0) {
    prefill.company = context.entities.companies[0]
    filledFields.push('company')
  } else if (context.dealContext?.company) {
    prefill.company = context.dealContext.company
    filledFields.push('company')
  }

  // Determine event type based on lead score and context
  let eventType: DemoSchedulerProps['eventType'] = 'demo_30min'
  if (context.leadScore >= 80) {
    eventType = 'demo_60min' // High-value leads get full demo
    filledFields.push('eventType (high-value)')
  } else if (context.spinState === 'NeedPayoff') {
    eventType = 'demo_60min'
    filledFields.push('eventType (NeedPayoff)')
  }

  const props: DemoSchedulerProps = {
    eventType,
    prefill: Object.keys(prefill).length > 0 ? prefill : undefined,
    autoTriggerCRM: true,
  }

  const confidence = (filledFields.length / 4) * 0.9

  return { props, confidence, filledFields, missingFields, warnings }
}

// ============================================
// PRICING COMPARISON AUTO-FILL
// ============================================

interface PricingComparisonProps {
  highlighted: 'free' | 'pro'
  emphasize_features?: string[]
  show_roi_badge?: boolean
  annual_savings?: number
}

export function autoFillPricingComparison(context: AutoFillContext): AutoFillResult<PricingComparisonProps> {
  const filledFields: string[] = []
  const warnings: string[] = []

  // Determine which plan to highlight based on context
  let highlighted: 'free' | 'pro' = 'pro'
  if (context.leadScore < 40) {
    highlighted = 'free' // Low-score leads see free first
  }
  filledFields.push('highlighted')

  // Emphasize features based on pain points
  const emphasize_features: string[] = []
  const painText = context.entities.painPoints.join(' ').toLowerCase()

  if (painText.includes('api') || painText.includes('integra')) {
    emphasize_features.push('api_access')
  }
  if (painText.includes('contato') || painText.includes('lead') || painText.includes('cliente')) {
    emphasize_features.push('contacts')
  }
  if (painText.includes('automat') || painText.includes('manual')) {
    emphasize_features.push('automations')
  }
  if (painText.includes('ia') || painText.includes('inteligên') || painText.includes('ai')) {
    emphasize_features.push('agi_assistant')
  }

  if (emphasize_features.length > 0) {
    filledFields.push('emphasize_features')
  }

  // Calculate annual savings if we have cost data
  let annual_savings: number | undefined
  const costValues = context.entities.monetaryValues.filter(v => v.context === 'cost')
  if (costValues.length > 0) {
    const currentMonthly = costValues[0].value
    const siriusMonthly = 97 * 5 // Estimate 5 users
    annual_savings = Math.max(0, (currentMonthly - siriusMonthly) * 12)
    filledFields.push('annual_savings')
  }

  const props: PricingComparisonProps = {
    highlighted,
    emphasize_features: emphasize_features.length > 0 ? emphasize_features : undefined,
    show_roi_badge: context.leadScore >= 60,
    annual_savings,
  }

  return { props, confidence: 0.85, filledFields, missingFields: [], warnings }
}

// ============================================
// COMPETITOR MATRIX AUTO-FILL
// ============================================

interface CompetitorMatrixProps {
  competitors: ('pipedrive' | 'rdstation' | 'hubspot' | 'salesforce' | 'zoho')[]
  focusFeatures?: string[]
  showPricing?: boolean
}

export function autoFillCompetitorMatrix(context: AutoFillContext): AutoFillResult<CompetitorMatrixProps> {
  const filledFields: string[] = []
  const missingFields: string[] = []
  const warnings: string[] = []

  // Extract competitor names
  const competitors = context.entities.competitors
    .map(c => c.normalized)
    .filter((c): c is CompetitorMatrixProps['competitors'][number] =>
      ['pipedrive', 'rdstation', 'hubspot', 'salesforce', 'zoho'].includes(c)
    )
    .slice(0, 3)

  if (competitors.length === 0) {
    missingFields.push('competitors')
    // Default to common competitors
    competitors.push('pipedrive')
    warnings.push('No competitors mentioned - defaulting to Pipedrive')
  } else {
    filledFields.push('competitors')
  }

  // Determine focus features based on pain points
  const focusFeatures: string[] = []
  const painText = context.entities.painPoints.join(' ').toLowerCase()

  if (painText.includes('ia') || painText.includes('inteligên')) {
    focusFeatures.push('ai_assistant')
  }
  if (painText.includes('whatsapp') || painText.includes('mensag')) {
    focusFeatures.push('whatsapp_integration')
  }
  if (painText.includes('brasil') || painText.includes('real') || painText.includes('brl')) {
    focusFeatures.push('brazilian_support')
  }

  const props: CompetitorMatrixProps = {
    competitors,
    focusFeatures: focusFeatures.length > 0 ? focusFeatures : undefined,
    showPricing: true,
  }

  const confidence = competitors.length > 0 ? 0.9 : 0.5

  return { props, confidence, filledFields, missingFields, warnings }
}

// ============================================
// QUALIFICATION DASHBOARD AUTO-FILL
// ============================================

interface QualificationDashboardProps {
  scores: {
    budget: number
    authority: number
    need: number
    timeline: number
  }
  overall: number
  recommendations: string[]
  nextSteps: string[]
}

export function autoFillQualificationDashboard(context: AutoFillContext): AutoFillResult<QualificationDashboardProps> {
  const filledFields: string[] = ['scores', 'recommendations', 'nextSteps']

  // Calculate BANT scores based on context
  let budgetScore = 50
  let authorityScore = 50
  let needScore = 50
  let timelineScore = 50

  // Budget indicators
  if (context.entities.monetaryValues.length > 0) {
    budgetScore += 30
  }
  if (context.entities.painPoints.some(p => p.toLowerCase().includes('custo'))) {
    budgetScore += 10
  }

  // Authority indicators
  if (context.entities.names.some(n => n.match(/Dr\.|CEO|Diretor|Gerente/i))) {
    authorityScore += 40
  }

  // Need indicators
  needScore += Math.min(40, context.entities.painPoints.length * 15)
  if (context.spinState === 'Implication' || context.spinState === 'NeedPayoff') {
    needScore += 10
  }

  // Timeline indicators
  if (context.entities.goals.some(g => g.toLowerCase().includes('urgente'))) {
    timelineScore += 30
  }
  if (context.spinState === 'NeedPayoff') {
    timelineScore += 20
  }

  // Normalize scores
  budgetScore = Math.min(100, budgetScore)
  authorityScore = Math.min(100, authorityScore)
  needScore = Math.min(100, needScore)
  timelineScore = Math.min(100, timelineScore)

  const overall = Math.round((budgetScore + authorityScore + needScore + timelineScore) / 4)

  // Generate recommendations
  const recommendations: string[] = []
  if (budgetScore >= 70) recommendations.push('Budget disponível identificado ✓')
  if (authorityScore >= 70) recommendations.push('Decisor confirmado ✓')
  if (needScore >= 70) recommendations.push('Necessidade clara identificada ✓')
  if (timelineScore >= 70) recommendations.push('Timeline definido ✓')
  if (overall < 60) recommendations.push('Continuar qualificação para aumentar score')

  // Generate next steps
  const nextSteps: string[] = []
  if (overall >= 80) {
    nextSteps.push('Agendar demo completa (60min)')
    nextSteps.push('Preparar proposta comercial')
  } else if (overall >= 60) {
    nextSteps.push('Agendar demo inicial (30min)')
    nextSteps.push('Validar integrações necessárias')
  } else {
    nextSteps.push('Aprofundar diagnóstico de necessidades')
    nextSteps.push('Identificar decisores')
  }

  const props: QualificationDashboardProps = {
    scores: {
      budget: budgetScore,
      authority: authorityScore,
      need: needScore,
      timeline: timelineScore,
    },
    overall,
    recommendations,
    nextSteps,
  }

  return { props, confidence: 0.75, filledFields, missingFields: [], warnings: [] }
}

// ============================================
// ONBOARDING TIMELINE AUTO-FILL
// ============================================

interface OnboardingTimelineProps {
  plan: 'free' | 'pro'
  teamSize?: 'solo' | 'small' | 'medium' | 'large'
  hasIntegrations?: boolean
  estimatedDays?: number
}

export function autoFillOnboardingTimeline(context: AutoFillContext): AutoFillResult<OnboardingTimelineProps> {
  const filledFields: string[] = []
  const missingFields: string[] = []

  // Determine plan based on lead score
  const plan: 'free' | 'pro' = context.leadScore >= 60 ? 'pro' : 'free'
  filledFields.push('plan')

  // Get team size
  const teamSize = context.entities.teamSizes
  if (teamSize) {
    filledFields.push('teamSize')
  } else {
    missingFields.push('teamSize')
  }

  // Check for integration mentions
  const allText = [...context.entities.painPoints, ...context.entities.goals].join(' ').toLowerCase()
  const hasIntegrations = allText.includes('integra') || allText.includes('api') || allText.includes('whatsapp')
  if (hasIntegrations) {
    filledFields.push('hasIntegrations')
  }

  // Calculate estimated days
  let estimatedDays = plan === 'free' ? 3 : 14
  if (teamSize === 'large') estimatedDays += 7
  if (hasIntegrations) estimatedDays += 3

  const props: OnboardingTimelineProps = {
    plan,
    teamSize: teamSize || undefined,
    hasIntegrations,
    estimatedDays,
  }

  return { props, confidence: 0.8, filledFields, missingFields, warnings: [] }
}

// ============================================
// MAIN AUTO-FILL FUNCTION
// ============================================

type PropsMap = {
  ROICalculator: ROICalculatorProps
  DealFormGenerator: DealFormProps
  DemoScheduler: DemoSchedulerProps
  PricingComparison: PricingComparisonProps
  CompetitorMatrix: CompetitorMatrixProps
  QualificationDashboard: QualificationDashboardProps
  OnboardingTimeline: OnboardingTimelineProps
}

/**
 * Auto-fill props for any component
 */
export function autoFillProps<T extends keyof PropsMap>(
  component: T,
  context: AutoFillContext
): AutoFillResult<PropsMap[T]> {
  switch (component) {
    case 'ROICalculator':
      return autoFillROICalculator(context) as AutoFillResult<PropsMap[T]>
    case 'DealFormGenerator':
      return autoFillDealForm(context) as AutoFillResult<PropsMap[T]>
    case 'DemoScheduler':
      return autoFillDemoScheduler(context) as AutoFillResult<PropsMap[T]>
    case 'PricingComparison':
      return autoFillPricingComparison(context) as AutoFillResult<PropsMap[T]>
    case 'CompetitorMatrix':
      return autoFillCompetitorMatrix(context) as AutoFillResult<PropsMap[T]>
    case 'QualificationDashboard':
      return autoFillQualificationDashboard(context) as AutoFillResult<PropsMap[T]>
    case 'OnboardingTimeline':
      return autoFillOnboardingTimeline(context) as AutoFillResult<PropsMap[T]>
    default:
      return {
        props: {} as PropsMap[T],
        confidence: 0,
        filledFields: [],
        missingFields: ['all'],
        warnings: [`No auto-fill available for ${component}`],
      }
  }
}
