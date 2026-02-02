/**
 * Layout Engine for Multi-Component Generative UI
 * 
 * Enables AI to render multiple components in organized layouts:
 * - Grid: Responsive multi-column layouts
 * - Flex: Side-by-side or stacked components
 * - Tabs: Tabbed interface for related components
 * - Accordion: Expandable sections
 */

import { z } from 'zod'

// ============================================================================
// Types & Schemas
// ============================================================================

export const LayoutType = z.enum(['grid', 'flex', 'tabs', 'accordion', 'stack'])

export type LayoutType = z.infer<typeof LayoutType>

/**
 * Component configuration within a layout
 */
export const LayoutComponentSchema = z.object({
    name: z.string().describe('Component name from registry'),
    props: z.record(z.string(), z.any()).describe('Component props'),
    span: z.number().min(1).max(12).optional().describe('Grid column span (1-12)'),
    label: z.string().optional().describe('Tab/Accordion label'),
    id: z.string().optional().describe('Unique identifier for this component instance'),
})

export type LayoutComponent = z.infer<typeof LayoutComponentSchema>

/**
 * Multi-component layout configuration
 */
export const MultiComponentLayoutSchema = z.object({
    type: LayoutType,
    components: z.array(LayoutComponentSchema).min(1).max(6).describe('1-6 components'),
    gap: z.number().min(0).max(12).optional().default(4).describe('Spacing between components (0-12)'),
    responsive: z.boolean().optional().default(true).describe('Enable responsive breakpoints'),
    columns: z.number().min(1).max(12).optional().describe('Number of columns for grid layout'),
    defaultActiveTab: z.number().optional().describe('Default active tab index (0-based)'),
    defaultOpenAccordion: z.array(z.number()).optional().describe('Default open accordion indices'),
})

export type MultiComponentLayout = z.infer<typeof MultiComponentLayoutSchema>

// ============================================================================
// Layout Engine
// ============================================================================

/**
 * Validate and normalize layout configuration
 */
export function validateLayout(layout: MultiComponentLayout): {
    valid: boolean
    errors?: string[]
    normalized?: MultiComponentLayout
} {
    const errors: string[] = []

    // Validate component count
    if (layout.components.length === 0) {
        errors.push('Layout must contain at least 1 component')
    }

    if (layout.components.length > 6) {
        errors.push('Layout cannot contain more than 6 components')
    }

    // Validate grid spans
    if (layout.type === 'grid') {
        const totalSpan = layout.components.reduce((sum, c) => sum + (c.span || 12), 0)
        if (totalSpan > 12 * Math.ceil(layout.components.length / (layout.columns || 2))) {
            errors.push('Total grid span exceeds available columns')
        }
    }

    // Validate tabs have labels
    if (layout.type === 'tabs') {
        const missingLabels = layout.components.filter(c => !c.label)
        if (missingLabels.length > 0) {
            errors.push('All components in tabs layout must have labels')
        }
    }

    // Validate accordion has labels
    if (layout.type === 'accordion') {
        const missingLabels = layout.components.filter(c => !c.label)
        if (missingLabels.length > 0) {
            errors.push('All components in accordion layout must have labels')
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors }
    }

    // Normalize layout
    const normalized: MultiComponentLayout = {
        ...layout,
        gap: layout.gap ?? 4,
        responsive: layout.responsive ?? true,
        components: layout.components.map((c, idx) => ({
            ...c,
            id: c.id || `component-${idx}`,
            span: c.span || 12,
        })),
    }

    return { valid: true, normalized }
}

/**
 * Calculate responsive grid classes based on component count and spans
 */
export function generateGridClasses(layout: MultiComponentLayout): {
    containerClass: string
    itemClasses: string[]
} {
    const gap = layout.gap ?? 4
    const responsive = layout.responsive ?? true
    const columns = layout.columns || Math.min(layout.components.length, 3)

    // Container classes
    const containerClass = [
        'grid',
        `gap-${gap}`,
        responsive && `grid-cols-1 md:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns}`,
        !responsive && `grid-cols-${columns}`,
    ]
        .filter(Boolean)
        .join(' ')

    // Item classes for each component
    const itemClasses = layout.components.map(c => {
        const span = c.span || 12
        const colSpan = Math.ceil((span / 12) * columns)
        return `col-span-${Math.min(colSpan, columns)}`
    })

    return { containerClass, itemClasses }
}

/**
 * Calculate flex layout classes
 */
export function generateFlexClasses(layout: MultiComponentLayout): {
    containerClass: string
    itemClasses: string[]
} {
    const gap = layout.gap ?? 4
    const responsive = layout.responsive ?? true

    // Determine flex direction based on component count
    const isRow = layout.components.length <= 3

    const containerClass = [
        'flex',
        `gap-${gap}`,
        responsive && (isRow ? 'flex-col md:flex-row' : 'flex-col'),
        !responsive && (isRow ? 'flex-row' : 'flex-col'),
        'items-stretch',
    ]
        .filter(Boolean)
        .join(' ')

    // Equal width for all items in row layout
    const itemClasses = layout.components.map(() => (isRow ? 'flex-1 min-w-0' : 'w-full'))

    return { containerClass, itemClasses }
}

/**
 * Get recommended layout type based on components and context
 */
export function recommendLayoutType(components: LayoutComponent[]): LayoutType {
    const count = components.length

    // Single component - stack
    if (count === 1) return 'stack'

    // 2 components - flex (side-by-side)
    if (count === 2) return 'flex'

    // 3-4 components with labels - tabs
    if (count >= 3 && count <= 4 && components.every(c => c.label)) {
        return 'tabs'
    }

    // 3-6 components - grid
    if (count >= 3 && count <= 6) return 'grid'

    // Fallback to stack
    return 'stack'
}

/**
 * Auto-generate layout configuration from components
 */
export function autoGenerateLayout(
    components: LayoutComponent[],
    preferredType?: LayoutType
): MultiComponentLayout {
    const type = preferredType || recommendLayoutType(components)

    const layout: MultiComponentLayout = {
        type,
        components: components.map((c, idx) => ({
            ...c,
            id: c.id || `component-${idx}`,
            label: c.label || `Item ${idx + 1}`,
        })),
        gap: 4,
        responsive: true,
    }

    // Add grid-specific config
    if (type === 'grid') {
        layout.columns = Math.min(components.length, 3)
    }

    // Add tabs-specific config
    if (type === 'tabs') {
        layout.defaultActiveTab = 0
    }

    // Add accordion-specific config
    if (type === 'accordion') {
        layout.defaultOpenAccordion = [0]
    }

    return layout
}

/**
 * Optimize layout for mobile devices
 */
export function optimizeForMobile(layout: MultiComponentLayout): MultiComponentLayout {
    return {
        ...layout,
        responsive: true,
        // Force single column on mobile for grid
        ...(layout.type === 'grid' && {
            components: layout.components.map(c => ({
                ...c,
                span: 12, // Full width on mobile
            })),
        }),
    }
}

/**
 * Get layout metadata for rendering
 */
export function getLayoutMetadata(layout: MultiComponentLayout) {
    const validation = validateLayout(layout)

    if (!validation.valid) {
        throw new Error(`Invalid layout: ${validation.errors?.join(', ')}`)
    }

    const normalized = validation.normalized!

    return {
        type: normalized.type,
        componentCount: normalized.components.length,
        gap: normalized.gap,
        responsive: normalized.responsive,
        classes:
            normalized.type === 'grid'
                ? generateGridClasses(normalized)
                : normalized.type === 'flex'
                    ? generateFlexClasses(normalized)
                    : null,
    }
}
