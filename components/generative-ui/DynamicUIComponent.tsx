/**
 * Dynamic UI Component Renderer
 *
 * Dynamically loads and renders AI-selected components with:
 * - Lazy loading for performance (code splitting)
 * - Props validation with Zod
 * - Error boundaries with retry logic
 * - Interaction tracking with PostHog
 * - Smooth entrance animations
 */

'use client'

import React, { Suspense, useState, useEffect, useRef } from 'react'
import {
  validateComponentProps,
  getComponentDefinition,
} from '@/lib/generative-ui/component-registry'
import { getLazyComponent, preloadComponent } from '@/lib/generative-ui/lazy-components'
import { ComponentSkeleton } from './ComponentSkeleton'
import { GenUIErrorBoundary } from './GenUIErrorBoundary'
import { AnimatedComponent } from './AnimatedComponent'
import { useComponentAnalytics } from '@/hooks/useComponentAnalytics'
import { AlertCircle } from 'lucide-react'
import type { DynamicUIComponentProps, ComponentInteraction } from '@/lib/generative-ui/types'

export function DynamicUIComponent({
  name,
  props,
  onInteraction,
  sessionId,
  conversationTurn,
  spinState,
  animate = true,
}: DynamicUIComponentProps & {
  sessionId?: string
  conversationTurn?: number
  spinState?: string
  animate?: boolean
}) {
  const [retryCount, setRetryCount] = useState(0)
  const renderStartTime = useRef<number>(Date.now())
  const hasTrackedRender = useRef(false)

  // Analytics tracking
  const analytics = useComponentAnalytics({
    component: name,
    sessionId,
    conversationTurn,
    spinState,
  })

  // Get component definition for validation and skeleton
  const componentDef = getComponentDefinition(name)

  // Get lazy-loaded component
  const LazyComponent = getLazyComponent(name)

  // Track render time
  useEffect(() => {
    if (!hasTrackedRender.current && LazyComponent) {
      const renderTime = Date.now() - renderStartTime.current
      analytics.trackRender({
        render_time_ms: renderTime,
        props_source: props?._source || 'conversation_extracted',
        has_prefilled_data: Object.keys(props || {}).length > 0,
      })
      hasTrackedRender.current = true
    }
  }, [LazyComponent, analytics, props])

  // Component not found
  if (!componentDef || !LazyComponent) {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Componente não encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              O componente <code className="bg-muted px-1 py-0.5 rounded">{name}</code> não
              está disponível no registry.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Validate props
  const validation = validateComponentProps(name, props)

  if (!validation.valid) {
    return (
      <div className="p-4 border border-yellow-500/50 rounded-lg bg-yellow-500/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-600">Erro de validação</p>
            <p className="text-sm text-muted-foreground mt-1">
              {validation.error}
            </p>
            <details className="mt-2">
              <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                Ver props recebidos
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(props, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    )
  }

  // Handle interaction tracking
  const handleInteraction = (interactionType: string, field?: string, value?: any) => {
    const interaction: ComponentInteraction = {
      component: name,
      interaction_type: interactionType,
      field,
      value,
      timestamp: new Date(),
    }

    // Track with analytics hook
    analytics.trackInteraction({
      interaction_type: interactionType,
      field,
      value,
      timestamp: new Date(),
    })

    // Call parent callback
    onInteraction?.(interaction)
  }

  // Handle conversion events
  const handleConversion = (event: string, dealValue?: number) => {
    analytics.trackConversion({
      event,
      deal_value: dealValue,
      time_to_conversion_ms: Date.now() - renderStartTime.current,
      from_component: name,
    })
  }

  // Render with error boundary, suspense, and optional animation
  const content = (
    <GenUIErrorBoundary
      componentName={name}
      onError={(error) => analytics.trackError(error)}
      maxRetries={3}
    >
      <div className="genui-component my-4" data-component={name} data-testid={`genui-${name.toLowerCase()}`}>
        <Suspense
          fallback={
            <ComponentSkeleton
              height={componentDef.skeleton?.height || 400}
              variant={componentDef.skeleton?.variant || 'card'}
            />
          }
        >
          <LazyComponent
            {...validation.data}
            onInteraction={handleInteraction}
            onConversion={handleConversion}
            key={retryCount}
          />
        </Suspense>
      </div>
    </GenUIErrorBoundary>
  )

  // Wrap with animation if enabled
  if (animate) {
    return (
      <AnimatedComponent variant="slideUp" delay={0.1}>
        {content}
      </AnimatedComponent>
    )
  }

  return content
}

/**
 * Wrapper with error boundary for production use
 * Now uses the enhanced GenUIErrorBoundary
 */
export function DynamicUIComponentWithErrorBoundary(
  props: DynamicUIComponentProps & {
    sessionId?: string
    conversationTurn?: number
    spinState?: string
    animate?: boolean
  }
) {
  return (
    <GenUIErrorBoundary componentName={props.name} maxRetries={3}>
      <DynamicUIComponent {...props} />
    </GenUIErrorBoundary>
  )
}

/**
 * Preload a component before it's needed
 * Useful for improving perceived performance
 */
export { preloadComponent } from '@/lib/generative-ui/lazy-components'

/**
 * Re-export animation components for convenience
 */
export { AnimatedComponent, StaggeredContainer } from './AnimatedComponent'
