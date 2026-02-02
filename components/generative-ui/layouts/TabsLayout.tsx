'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DynamicUIComponent } from '@/components/generative-ui/DynamicUIComponent'
import { validateLayout, type MultiComponentLayout } from '@/lib/generative-ui/layout-engine'
import { cn } from '@/lib/utils'

export interface TabsLayoutProps {
    layout: MultiComponentLayout
    className?: string
    onComponentError?: (componentId: string, error: Error) => void
    onTabChange?: (tabIndex: number) => void
}

/**
 * Tabs Layout Component
 * 
 * Renders components in a tabbed interface.
 * Each component must have a label for the tab trigger.
 */
export function TabsLayout({ layout, className, onComponentError, onTabChange }: TabsLayoutProps) {
    // Validate layout
    const validation = validateLayout(layout)

    if (!validation.valid) {
        return (
            <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                    Invalid Tabs Layout
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
    const defaultTab = normalizedLayout.components[normalizedLayout.defaultActiveTab || 0]?.id ||
        normalizedLayout.components[0]?.id

    const [activeTab, setActiveTab] = useState(defaultTab)

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        const index = normalizedLayout.components.findIndex(c => c.id === value)
        if (index !== -1) {
            onTabChange?.(index)
        }
    }

    return (
        <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className={cn('w-full', className)}
            data-layout-type="tabs"
            data-component-count={normalizedLayout.components.length}
        >
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${normalizedLayout.components.length}, 1fr)` }}>
                {normalizedLayout.components.map((component) => (
                    <TabsTrigger
                        key={component.id}
                        value={component.id!}
                        className="relative"
                    >
                        {component.label || component.name}
                    </TabsTrigger>
                ))}
            </TabsList>

            {normalizedLayout.components.map((component) => (
                <TabsContent
                    key={component.id}
                    value={component.id!}
                    className="mt-4"
                    data-component-id={component.id}
                    data-component-name={component.name}
                >
                    <ErrorBoundary
                        componentId={component.id!}
                        onError={onComponentError}
                    >
                        <DynamicUIComponent
                            name={component.name}
                            props={component.props}
                        />
                    </ErrorBoundary>
                </TabsContent>
            ))}
        </Tabs>
    )
}

/**
 * Error Boundary for individual tabs
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
        console.error(`[TabsLayout] Component error in ${this.props.componentId}:`, error, errorInfo)
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
