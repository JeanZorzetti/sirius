'use client'

import React, { useState } from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { DynamicUIComponent } from '@/components/generative-ui/DynamicUIComponent'
import { validateLayout, type MultiComponentLayout } from '@/lib/generative-ui/layout-engine'
import { cn } from '@/lib/utils'

export interface AccordionLayoutProps {
    layout: MultiComponentLayout
    className?: string
    onComponentError?: (componentId: string, error: Error) => void
    onAccordionChange?: (openItems: string[]) => void
    allowMultiple?: boolean
}

/**
 * Accordion Layout Component
 * 
 * Renders components in an expandable accordion interface.
 * Each component must have a label for the accordion trigger.
 */
export function AccordionLayout({
    layout,
    className,
    onComponentError,
    onAccordionChange,
    allowMultiple = true,
}: AccordionLayoutProps) {
    // Validate layout
    const validation = validateLayout(layout)

    if (!validation.valid) {
        return (
            <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                    Invalid Accordion Layout
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

    // Default open items
    const defaultOpen = normalizedLayout.defaultOpenAccordion?.map(
        idx => normalizedLayout.components[idx]?.id || `item-${idx}`
    ) || [normalizedLayout.components[0]?.id || 'item-0']

    const [openItems, setOpenItems] = useState<string[]>(defaultOpen)

    const handleValueChange = (value: string | string[]) => {
        const newValue = Array.isArray(value) ? value : [value]
        setOpenItems(newValue)
        onAccordionChange?.(newValue)
    }

    // Render different Accordion types to satisfy TypeScript
    if (allowMultiple) {
        return (
            <Accordion
                type="multiple"
                value={openItems}
                onValueChange={handleValueChange}
                className={cn('w-full', className)}
                data-layout-type="accordion"
                data-component-count={normalizedLayout.components.length}
            >
                {normalizedLayout.components.map((component, idx) => (
                    <AccordionItem
                        key={component.id || `accordion-item-${idx}`}
                        value={component.id || `item-${idx}`}
                        data-component-id={component.id}
                        data-component-name={component.name}
                    >
                        <AccordionTrigger className="text-left">
                            {component.label || component.name}
                        </AccordionTrigger>
                        <AccordionContent>
                            <ErrorBoundary
                                componentId={component.id || `accordion-item-${idx}`}
                                onError={onComponentError}
                            >
                                <DynamicUIComponent
                                    name={component.name}
                                    props={component.props}
                                />
                            </ErrorBoundary>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        )
    }

    return (
        <Accordion
            type="single"
            value={openItems[0] || ''}
            onValueChange={(value) => handleValueChange(value)}
            className={cn('w-full', className)}
            data-layout-type="accordion"
            data-component-count={normalizedLayout.components.length}
            collapsible
        >
            {normalizedLayout.components.map((component, idx) => (
                <AccordionItem
                    key={component.id || `accordion-item-${idx}`}
                    value={component.id || `item-${idx}`}
                    data-component-id={component.id}
                    data-component-name={component.name}
                >
                    <AccordionTrigger className="text-left">
                        {component.label || component.name}
                    </AccordionTrigger>
                    <AccordionContent>
                        <ErrorBoundary
                            componentId={component.id || `accordion-item-${idx}`}
                            onError={onComponentError}
                        >
                            <DynamicUIComponent
                                name={component.name}
                                props={component.props}
                            />
                        </ErrorBoundary>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

/**
 * Error Boundary for individual accordion items
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
        console.error(`[AccordionLayout] Component error in ${this.props.componentId}:`, error, errorInfo)
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
