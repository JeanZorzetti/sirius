/**
 * AGI Tool - Render UI Component
 *
 * Allows the AI to dynamically render React components during conversations.
 * The AI decides which component to use based on context and conversation flow.
 */

import { z } from 'zod'
import {
  validateComponentProps,
  getComponentDefinition,
  getComponentNames,
} from '@/lib/generative-ui/component-registry'
import type { UIMetadata } from '@/lib/generative-ui/types'

/**
 * Tool parameters schema
 */
const renderUIComponentParamsSchema = z.object({
  component_name: z
    .enum(getComponentNames() as [string, ...string[]])
    .describe('Name of the UI component to render from the registry'),

  props: z
    .record(z.string(), z.any())
    .describe('Props to pass to the component, extracted from conversation context'),

  reasoning: z
    .string()
    .min(10)
    .max(500)
    .describe('Explanation of why this component helps the sales conversation at this moment'),

  position: z
    .enum(['before_text', 'after_text', 'replace_text'])
    .default('after_text')
    .describe('Where to position the component relative to text response'),
})

/**
 * Tool execution result
 */
interface ToolResult {
  success: boolean
  ui_metadata?: UIMetadata
  error?: string
}

/**
 * AI Tool: render_ui_component
 *
 * This tool enables the AI to render interactive UI components during sales conversations.
 *
 * Usage guidelines for AI:
 * 1. ONLY use when a visual component genuinely helps the conversation
 * 2. ALWAYS extract props from confirmed conversation context (don't invent data)
 * 3. Explain the component before rendering it ("Let me show you...")
 * 4. Use ONE component per response (avoid visual overload)
 * 5. If missing required context, ask user before rendering
 *
 * @example
 * // Good usage
 * User: "How much will I save?"
 * AI: "Based on what you told me (R$15k/month current cost), let me calculate your ROI:"
 * [Calls render_ui_component with ROICalculator]
 *
 * @example
 * // Bad usage
 * User: "How much will I save?"
 * AI: [Calls render_ui_component immediately without context]
 * // Error: Missing required context (currentCost)
 */
export const renderUIComponentTool = {
  name: 'render_ui_component',

  description: `Render an interactive UI component to support the sales conversation.

Available components:
- ROICalculator: Show ROI calculations and savings
- DealFormGenerator: Create deal with prefilled data
- PricingComparison: Compare FREE vs PRO plans
- ScriptPreview: Display generated sales scripts
- DemoScheduler: Schedule demo via Calendly
- QualificationDashboard: Show BANT/MEDDIC scores
- CompetitorMatrix: Compare Sirius with competitors
- OnboardingTimeline: Show implementation timeline
- InsightCard: Display AI insights and recommendations
- EmailPreview: Preview email templates

Use this tool when:
- A visual demonstration would clarify a concept
- User needs an interactive tool (calculator, form, scheduler)
- Data is better presented visually than in text
- You want to facilitate an action (schedule demo, create deal)

IMPORTANT RULES:
1. Only use with CONFIRMED data from conversation (never guess values)
2. Explain component before rendering ("Let me show you...")
3. One component per response (avoid clutter)
4. If missing data, ask first before rendering`,

  parameters: renderUIComponentParamsSchema,

  /**
   * Execute the tool - validate and prepare UI metadata
   */
  execute: async (params: z.infer<typeof renderUIComponentParamsSchema>): Promise<ToolResult> => {
    const { component_name, props, reasoning, position } = params

    // Validate component exists
    const componentDef = getComponentDefinition(component_name)
    if (!componentDef) {
      return {
        success: false,
        error: `Component "${component_name}" not found in registry`,
      }
    }

    // Validate props against schema
    const validation = validateComponentProps(component_name, props)
    if (!validation.valid) {
      return {
        success: false,
        error: `Props validation failed for ${component_name}: ${validation.error}`,
      }
    }

    // Prepare UI metadata for streaming
    const ui_metadata: UIMetadata = {
      type: 'ui_component',
      name: component_name,
      props: validation.data,
      reasoning,
      position,
      skeleton: componentDef.skeleton,
    }

    return {
      success: true,
      ui_metadata,
    }
  },
}

/**
 * Helper: Format component list for system prompt
 */
export function formatComponentListForPrompt(): string {
  return getComponentNames()
    .map((name) => {
      const def = getComponentDefinition(name)!
      return `- ${name}: ${def.description}
  When to use: ${def.when_to_use.slice(0, 2).join('; ')}
  Required context: ${def.required_context.join(', ') || 'none'}`
    })
    .join('\n\n')
}
