/**
 * Generative UI - Main Exports
 *
 * Centralized exports for the Generative UI system.
 */

// Types
export type {
  ThinkingState,
  StreamChunk,
  SkeletonConfig,
  SkeletonVariant,
  ComponentDefinition,
  ComponentRegistry,
  ValidationResult,
  RenderUIComponentParams,
  UIMetadata,
  ComponentInteraction,
  DynamicUIComponentProps,
  ParsedMessage,
} from './types'

// Schemas
export {
  ROICalculatorPropsSchema,
  DealFormGeneratorPropsSchema,
  PricingComparisonPropsSchema,
  ScriptPreviewPropsSchema,
  DemoSchedulerPropsSchema,
  QualificationDashboardPropsSchema,
  CompetitorMatrixPropsSchema,
  OnboardingTimelinePropsSchema,
  InsightCardPropsSchema,
  EmailPreviewPropsSchema,
} from './schemas'

export type {
  ROICalculatorProps,
  DealFormGeneratorProps,
  PricingComparisonProps,
  ScriptPreviewProps,
  DemoSchedulerProps,
  QualificationDashboardProps,
  CompetitorMatrixProps,
  OnboardingTimelineProps,
  InsightCardProps,
  EmailPreviewProps,
} from './schemas'

// Component Registry
export {
  SALES_UI_COMPONENTS,
  validateComponentProps,
  getComponentsForAI,
  getComponentDefinition,
  hasComponent,
  getComponentNames,
} from './component-registry'
