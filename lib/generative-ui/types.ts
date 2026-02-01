/**
 * Generative UI - Type Definitions
 *
 * Core types for the Generative UI system that enables AI to dynamically
 * render React components during conversational sales interactions.
 */

import { ComponentType } from 'react'
import { z } from 'zod'

/**
 * Thinking states displayed to user during AI processing
 */
export type ThinkingState =
  | 'thinking'
  | 'querying_knowledge'
  | 'analyzing_deal'
  | 'calculating_roi'
  | 'generating_script'
  | 'checking_availability'
  | 'analyzing_fit'
  | 'generating_ui'
  | 'extracting_context'

/**
 * Stream chunk types for progressive rendering
 */
export type StreamChunk =
  | { type: 'text'; content: string }
  | { type: 'ui_component'; name: string; props: Record<string, any>; skeleton: SkeletonConfig; reasoning?: string }
  | { type: 'thinking'; state: ThinkingState; message?: string }
  | { type: 'error'; message: string; recoverable: boolean }

/**
 * Skeleton configuration for loading states
 */
export interface SkeletonConfig {
  height: number
  variant: SkeletonVariant
}

export type SkeletonVariant =
  | 'calculator'
  | 'form'
  | 'table'
  | 'dashboard'
  | 'timeline'
  | 'card'
  | 'email'
  | 'iframe'
  | 'text'
  | 'chart'
  | 'metrics'
  | 'comparison'
  | 'wizard'
  | 'insight'

/**
 * Component definition in the registry
 */
export interface ComponentDefinition<TProps = any> {
  /** Unique component identifier */
  name: string

  /** Human-readable description for AI */
  description: string

  /** Conditions when AI should use this component */
  when_to_use: string[]

  /** Required context fields that must be extracted from conversation */
  required_context: string[]

  /** Optional context fields that enhance the component */
  optional_context?: string[]

  /** Zod schema for props validation */
  props_schema: z.ZodSchema<TProps>

  /** React component to render */
  render: ComponentType<TProps>

  /** Skeleton configuration for loading state */
  skeleton?: SkeletonConfig

  /** CRM event triggered when component is interacted with */
  triggers_event?: string

  /** Example usage for AI reference */
  example?: {
    scenario: string
    invocation: TProps
  }
}

/**
 * Component registry type
 */
export type ComponentRegistry = Record<string, ComponentDefinition>

/**
 * Validation result for component props
 */
export interface ValidationResult<TData = any> {
  valid: boolean
  error?: string
  data?: TData
}

/**
 * AI tool invocation parameters for rendering UI
 */
export interface RenderUIComponentParams {
  component_name: string
  props: Record<string, any>
  reasoning: string
  position?: 'before_text' | 'after_text' | 'replace_text'
}

/**
 * UI metadata returned from AI tool execution
 */
export interface UIMetadata {
  type: 'ui_component'
  name: string
  props: Record<string, any>
  reasoning: string
  position: 'before_text' | 'after_text' | 'replace_text'
  skeleton?: SkeletonConfig
}

/**
 * Component interaction event data
 */
export interface ComponentInteraction {
  component: string
  interaction_type: string
  field?: string
  value?: any
  timestamp: Date
}

/**
 * Props for DynamicUIComponent
 */
export interface DynamicUIComponentProps {
  name: string
  props: Record<string, any>
  onInteraction?: (data: ComponentInteraction) => void
}

/**
 * Message chunk parsed from AI response
 */
export interface ParsedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  chunks: StreamChunk[]
  timestamp: Date
}
