'use client'

import React from 'react'
import { GridLayout } from './GridLayout'
import { FlexLayout } from './FlexLayout'
import { TabsLayout } from './TabsLayout'
import { AccordionLayout } from './AccordionLayout'
import { DynamicUIComponent } from '@/components/generative-ui/DynamicUIComponent'
import type { MultiComponentLayout } from '@/lib/generative-ui/layout-engine'

export interface MultiComponentRendererProps {
    layout: MultiComponentLayout
    className?: string
    onComponentError?: (componentId: string, error: Error) => void
}

/**
 * Multi-Component Renderer
 * 
 * Automatically selects the appropriate layout component based on layout type.
 * Handles single components as well.
 */
export function MultiComponentRenderer({
    layout,
    className,
    onComponentError,
}: MultiComponentRendererProps) {
    // Single component - render directly
    if (layout.components.length === 1) {
        const component = layout.components[0]
        return (
            <div className={className} data-layout-type="single">
                <DynamicUIComponent
                    name={component.name}
                    props={component.props}
                />
            </div>
        )
    }

    // Multiple components - use layout system
    switch (layout.type) {
        case 'grid':
            return (
                <GridLayout
                    layout={layout}
                    className={className}
                    onComponentError={onComponentError}
                />
            )

        case 'flex':
        case 'stack': // Stack is just flex with column direction
            return (
                <FlexLayout
                    layout={layout}
                    className={className}
                    onComponentError={onComponentError}
                />
            )

        case 'tabs':
            return (
                <TabsLayout
                    layout={layout}
                    className={className}
                    onComponentError={onComponentError}
                />
            )

        case 'accordion':
            return (
                <AccordionLayout
                    layout={layout}
                    className={className}
                    onComponentError={onComponentError}
                />
            )

        default:
            return (
                <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
                    <p className="text-sm text-red-700 dark:text-red-300">
                        Unknown layout type: {layout.type}
                    </p>
                </div>
            )
    }
}
