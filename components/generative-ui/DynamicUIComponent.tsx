/**
 * Dynamic UI Component Renderer
 *
 * Dynamically loads and renders AI-selected components with:
 * - Lazy loading for performance
 * - Props validation
 * - Error boundaries
 * - Interaction tracking
 */

'use client'

import { Suspense, useState } from 'react'
import {
  SALES_UI_COMPONENTS,
  validateComponentProps,
  getComponentDefinition,
} from '@/lib/generative-ui/component-registry'
import { ComponentSkeleton } from './ComponentSkeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { DynamicUIComponentProps, ComponentInteraction } from '@/lib/generative-ui/types'

export function DynamicUIComponent({
  name,
  props,
  onInteraction,
}: DynamicUIComponentProps) {
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Get component definition
  const componentDef = getComponentDefinition(name)

  if (!componentDef) {
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

    // Call parent callback
    onInteraction?.(interaction)

    // Track analytics (optional - can be added later)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      ;(window as any).analytics.track('genui_interaction', interaction)
    }
  }

  // Retry logic
  const handleRetry = () => {
    setError(null)
    setRetryCount((prev) => prev + 1)
  }

  // Render component with error boundary
  try {
    const Component = componentDef.render

    return (
      <div className="genui-component my-4" data-component={name}>
        <Suspense
          fallback={
            <ComponentSkeleton
              height={componentDef.skeleton?.height || 400}
              variant={componentDef.skeleton?.variant || 'card'}
            />
          }
        >
          <Component
            {...validation.data}
            onInteraction={handleInteraction}
            key={retryCount} // Force remount on retry
          />
        </Suspense>
      </div>
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'

    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Erro ao renderizar componente</p>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }
}

/**
 * Wrapper with error boundary for production use
 */
export function DynamicUIComponentWithErrorBoundary(props: DynamicUIComponentProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                Erro inesperado ao renderizar componente
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message}
              </p>
              <Button variant="outline" size="sm" onClick={reset} className="mt-3">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      <DynamicUIComponent {...props} />
    </ErrorBoundary>
  )
}

/**
 * Simple error boundary component
 */
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode
    fallback: (error: Error, reset: () => void) => React.ReactNode
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[DynamicUIComponent] Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, () =>
        this.setState({ hasError: false, error: null })
      )
    }

    return this.props.children
  }
}
