/**
 * Generative UI - Zod Schemas
 *
 * Type-safe validation schemas for all component props.
 * These ensure AI-generated props are valid before rendering.
 */

import { z } from 'zod'

/**
 * ROICalculator - Interactive ROI calculator
 */
export const ROICalculatorPropsSchema = z.object({
  scenario: z.object({
    currentCost: z.number().positive().describe('Current monthly cost'),
    withSirius: z.number().positive().describe('Estimated cost with Sirius CRM'),
    monthlySavings: z.number().describe('Monthly savings amount'),
    annualROI: z.number().describe('Annual return on investment'),
    paybackPeriod: z.number().positive().describe('Payback period in months'),
  }),
  industry: z
    .enum(['orthodontics', 'retail', 'services', 'manufacturing', 'other'])
    .optional()
    .describe('Industry vertical for contextualized calculations'),
  comparisonMode: z
    .boolean()
    .default(false)
    .describe('Show before/after comparison view'),
})

export type ROICalculatorProps = z.infer<typeof ROICalculatorPropsSchema>

/**
 * DealFormGenerator - Dynamic deal creation form
 */
export const DealFormGeneratorPropsSchema = z.object({
  prefill: z
    .object({
      title: z.string().optional(),
      value: z.number().positive().optional(),
      closeDate: z.string().optional().describe('ISO date string'),
      contactId: z.string().optional(),
      pipelineId: z.string().optional(),
      stageId: z.string().optional(),
    })
    .optional(),
  suggestedTags: z
    .array(z.string())
    .optional()
    .describe('Tags extracted from conversation'),
  aiNotes: z
    .string()
    .optional()
    .describe('AI-generated summary to prepopulate notes'),
  quickCreate: z
    .boolean()
    .default(false)
    .describe('Simplified form with fewer fields'),
})

export type DealFormGeneratorProps = z.infer<typeof DealFormGeneratorPropsSchema>

/**
 * PricingComparison - FREE vs PRO plans table
 */
export const PricingComparisonPropsSchema = z.object({
  highlighted: z.enum(['free', 'pro']).describe('Which plan to highlight'),
  emphasize_features: z
    .array(z.string())
    .optional()
    .describe('Feature IDs to emphasize'),
  show_roi_badge: z
    .boolean()
    .default(false)
    .describe('Show ROI badge on PRO plan'),
  annual_savings: z
    .number()
    .optional()
    .describe('Annual savings amount to display'),
})

export type PricingComparisonProps = z.infer<typeof PricingComparisonPropsSchema>

/**
 * ScriptPreview - Sales script preview with editing
 */
export const ScriptPreviewPropsSchema = z.object({
  scriptType: z.enum([
    'cold_call',
    'cold_email',
    'follow_up',
    'demo_pitch',
    'objection_handling',
  ]),
  content: z.string().min(1).describe('Script content (markdown supported)'),
  metadata: z
    .object({
      targetRole: z.string().optional().describe('Target role (e.g., "CEO de clínica")'),
      painPoints: z.array(z.string()).optional(),
      valueProps: z.array(z.string()).optional(),
    })
    .optional(),
  editable: z.boolean().default(true).describe('Allow inline editing'),
  showCopyButton: z.boolean().default(true).describe('Show copy to clipboard button'),
})

export type ScriptPreviewProps = z.infer<typeof ScriptPreviewPropsSchema>

/**
 * DemoScheduler - Calendly embed for demo scheduling
 */
export const DemoSchedulerPropsSchema = z.object({
  eventType: z
    .enum(['demo_30min', 'demo_60min', 'onboarding_call'])
    .describe('Calendly event type'),
  prefill: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      company: z.string().optional(),
    })
    .optional()
    .describe('Prefill contact data'),
  autoTriggerCRM: z
    .boolean()
    .default(true)
    .describe('Automatically create deal on scheduling'),
})

export type DemoSchedulerProps = z.infer<typeof DemoSchedulerPropsSchema>

/**
 * QualificationDashboard - BANT/MEDDIC score visualization
 */
export const QualificationDashboardPropsSchema = z.object({
  scores: z.object({
    budget: z.number().min(0).max(100),
    authority: z.number().min(0).max(100),
    need: z.number().min(0).max(100),
    timeline: z.number().min(0).max(100),
  }),
  overall: z.number().min(0).max(100).describe('Overall qualification score'),
  recommendations: z.array(z.string()).describe('AI recommendations'),
  nextSteps: z.array(z.string()).describe('Suggested next steps'),
})

export type QualificationDashboardProps = z.infer<typeof QualificationDashboardPropsSchema>

/**
 * CompetitorMatrix - Sirius vs Competitors comparison
 */
export const CompetitorMatrixPropsSchema = z.object({
  competitors: z
    .array(z.enum(['pipedrive', 'rdstation', 'hubspot', 'salesforce', 'zoho']))
    .min(1)
    .max(3)
    .describe('Competitors to compare (max 3)'),
  focusFeatures: z
    .array(z.string())
    .optional()
    .describe('Features to highlight'),
  showPricing: z.boolean().default(true).describe('Include pricing comparison'),
})

export type CompetitorMatrixProps = z.infer<typeof CompetitorMatrixPropsSchema>

/**
 * OnboardingTimeline - Implementation timeline visualization
 */
export const OnboardingTimelinePropsSchema = z.object({
  plan: z.enum(['free', 'pro']),
  teamSize: z.enum(['solo', 'small', 'medium', 'large']).optional(),
  hasIntegrations: z
    .boolean()
    .default(false)
    .describe('Whether customer needs integrations setup'),
  estimatedDays: z
    .number()
    .positive()
    .optional()
    .describe('Custom estimated days (auto-calculated if not provided)'),
})

export type OnboardingTimelineProps = z.infer<typeof OnboardingTimelinePropsSchema>

/**
 * InsightCard - AI insight/recommendation card
 */
export const InsightCardPropsSchema = z.object({
  type: z.enum(['opportunity', 'risk', 'recommendation', 'alert']),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('AI confidence score (0-1)'),
  actions: z
    .array(
      z.object({
        label: z.string(),
        action: z.enum(['create_deal', 'schedule_demo', 'send_email', 'add_note']),
        params: z.record(z.string(), z.any()).optional(),
      })
    )
    .optional()
    .describe('Quick action buttons'),
})

export type InsightCardProps = z.infer<typeof InsightCardPropsSchema>

/**
 * EmailPreview - Email template preview with editing
 */
export const EmailPreviewPropsSchema = z.object({
  template: z.object({
    subject: z.string().min(1).max(200),
    body: z.string().min(1).describe('HTML or Markdown content'),
    variables: z
      .record(z.string(), z.string())
      .optional()
      .describe('Template variables (e.g., {contact_name: "João"})'),
  }),
  testMode: z
    .boolean()
    .default(false)
    .describe('Show test send button'),
})

export type EmailPreviewProps = z.infer<typeof EmailPreviewPropsSchema>
