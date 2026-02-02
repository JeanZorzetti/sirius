'use client'

import React from 'react'
import { DynamicUIComponent } from '@/components/generative-ui/DynamicUIComponent'
import { generateGridClasses, validateLayout, type MultiComponentLayout } from '@/lib/generative-ui/layout-engine'
import { cn } from '@/lib/utils'

export interface GridLayoutProps {
    layout: MultiComponentLayout
    className?: string
    onComponentError?: (componentId: string, error: Error) => void
}

/**
 * Grid Layout Component
 * 
 * Renders components in a responsive CSS grid with configurable columns and gaps.
 * Automatically handles mobile breakpoints and column spanning.
 */
export function GridLayout({ layout, className, onComponentError }: GridLayoutProps) {
    // Validate layout
    const validation = validateLayout(layout)

    if (!validation.valid) {
        return (
            <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                    Invalid Grid Layout
                </h3>
                <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                    {validation.errors?.map((error, idx) => (
                        <li key={idx}>{error}</li>
                    ))}
                </ul>
            </div>
        )
    }

    const normalizedLayout = validation.normalized!
    const { containerClass, itemClasses } = generateGridClasses(normalizedLayout)

    return (
        <div
            className={cn(containerClass, className)}
            data-layout-type="grid"
            data-component-count={normalizedLayout.components.length}
        >
            {normalizedLayout.components.map((component, idx) => (
                <div
                    key={component.id || `grid-item-${idx}`}
                    className={cn(
                        itemClasses[idx],
                        'min-h-0', // Prevent grid item overflow
                    )}
                    data-component-id={component.id}
                    data-component-name={component.name}
                >
                    <ErrorBoundary
                        componentId={component.id || `grid-item-${idx}`}
                        onError={onComponentError}
                    >
                        <DynamicUIComponent
                            name={component.name}
                            props={component.props}
                        />
                    </ErrorBoundary>
                </div>
            ))}
        </div>
    )
}

/**
 * Error Boundary for individual grid items
 */
class ErrorBoundary extends React.Component<
    {
        componentId: string
        onError?: (componentId: string, error: Error) => void
        children: React.ReactNode
    },
    { hasError: boolean; error?: Error }
> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`[GridLayout] Component error in ${this.props.componentId}:`, error, errorInfo)
        this.props.onError?.(this.props.componentId, error)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Failed to load component
                    </p>
                    {this.state.error && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-mono">
                            {this.state.error.message}
                        </p>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
