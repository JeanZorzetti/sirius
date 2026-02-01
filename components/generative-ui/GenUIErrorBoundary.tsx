/**
 * Generative UI Error Boundary
 *
 * Specialized error boundary for Generative UI components with:
 * - Automatic retry with exponential backoff
 * - Graceful degradation
 * - Error reporting
 * - Animated transitions
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, ChevronDown, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ErrorBoundaryProps {
  children: ReactNode
  componentName?: string
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  maxRetries?: number
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  isRetrying: boolean
  showDetails: boolean
}

export class GenUIErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName, onError } = this.props

    // Log error
    console.error(`[GenUIErrorBoundary] Error in ${componentName || 'unknown'}:`, error, errorInfo)

    // Update state with error info
    this.setState({ errorInfo })

    // Call custom error handler
    onError?.(error, errorInfo)

    // Report to analytics/monitoring if available
    if (typeof window !== 'undefined') {
      // PostHog tracking
      if ((window as any).posthog) {
        ;(window as any).posthog.capture('genui_component_error', {
          component: componentName,
          error_message: error.message,
          error_stack: error.stack,
          component_stack: errorInfo.componentStack,
        })
      }

      // Sentry tracking
      if ((window as any).Sentry) {
        ;(window as any).Sentry.captureException(error, {
          extra: {
            componentName,
            componentStack: errorInfo.componentStack,
          },
          tags: {
            type: 'genui_error',
          },
        })
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      return
    }

    this.setState({ isRetrying: true })

    // Exponential backoff: 500ms, 1s, 2s...
    const delay = Math.pow(2, retryCount) * 500

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
        retryCount: retryCount + 1,
      })
    }, delay)
  }

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  render() {
    const { children, componentName, fallback, maxRetries = 3, showDetails: alwaysShowDetails } = this.props
    const { hasError, error, errorInfo, retryCount, isRetrying, showDetails } = this.state

    if (!hasError) {
      return children
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback
    }

    const canRetry = retryCount < maxRetries

    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertCircle className="h-5 w-5" />
            Erro ao carregar componente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {componentName ? (
              <>
                Não foi possível renderizar o componente{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{componentName}</code>.
              </>
            ) : (
              'Não foi possível renderizar este componente.'
            )}
          </p>

          {error && (
            <p className="text-sm text-destructive/80 bg-destructive/10 p-2 rounded">
              {error.message}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              disabled={!canRetry || isRetrying}
              className={cn(isRetrying && 'opacity-70')}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isRetrying && 'animate-spin')} />
              {isRetrying ? 'Tentando...' : `Tentar novamente${canRetry ? ` (${maxRetries - retryCount})` : ''}`}
            </Button>

            {(alwaysShowDetails || process.env.NODE_ENV === 'development') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={this.toggleDetails}
                className="text-muted-foreground"
              >
                <Bug className="h-4 w-4 mr-2" />
                Detalhes
                <ChevronDown
                  className={cn('h-4 w-4 ml-1 transition-transform', showDetails && 'rotate-180')}
                />
              </Button>
            )}
          </div>

          {!canRetry && (
            <p className="text-xs text-muted-foreground">
              Limite de tentativas atingido. Por favor, recarregue a página ou entre em contato
              com o suporte.
            </p>
          )}

          {showDetails && (
            <div className="space-y-2 text-xs">
              {error?.stack && (
                <details open>
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-40 text-[10px]">
                    {error.stack}
                  </pre>
                </details>
              )}
              {errorInfo?.componentStack && (
                <details>
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Component Stack
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-40 text-[10px]">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
}

/**
 * HOC to wrap a component with GenUIErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <GenUIErrorBoundary componentName={componentName}>
      <WrappedComponent {...props} />
    </GenUIErrorBoundary>
  )

  WithErrorBoundary.displayName = `WithErrorBoundary(${componentName})`

  return WithErrorBoundary
}
