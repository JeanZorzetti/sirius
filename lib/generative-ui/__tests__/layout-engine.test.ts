import { describe, it, expect } from 'vitest'
import {
    validateLayout,
    generateGridClasses,
    generateFlexClasses,
    recommendLayoutType,
    autoGenerateLayout,
    optimizeForMobile,
    getLayoutMetadata,
    type MultiComponentLayout,
    type LayoutComponent,
} from '../layout-engine'

describe('Layout Engine', () => {
    describe('validateLayout', () => {
        it('should validate a valid grid layout', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [
                    { name: 'ROICalculator', props: {}, span: 6 },
                    { name: 'PricingComparison', props: {}, span: 6 },
                ],
                gap: 4,
                responsive: true,
            }

            const result = validateLayout(layout)
            expect(result.valid).toBe(true)
            expect(result.normalized).toBeDefined()
        })

        it('should reject layout with no components', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [],
            }

            const result = validateLayout(layout)
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Layout must contain at least 1 component')
        })

        it('should reject layout with too many components', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: Array(7).fill({ name: 'Test', props: {} }),
            }

            const result = validateLayout(layout)
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('Layout cannot contain more than 6 components')
        })

        it('should reject tabs layout without labels', () => {
            const layout: MultiComponentLayout = {
                type: 'tabs',
                components: [
                    { name: 'Component1', props: {} }, // Missing label
                    { name: 'Component2', props: {}, label: 'Tab 2' },
                ],
            }

            const result = validateLayout(layout)
            expect(result.valid).toBe(false)
            expect(result.errors).toContain('All components in tabs layout must have labels')
        })

        it('should normalize layout with defaults', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [
                    { name: 'Test', props: {} },
                ],
            }

            const result = validateLayout(layout)
            expect(result.valid).toBe(true)
            expect(result.normalized?.gap).toBe(4)
            expect(result.normalized?.responsive).toBe(true)
            expect(result.normalized?.components[0].span).toBe(12)
            expect(result.normalized?.components[0].id).toBeDefined()
        })
    })

    describe('generateGridClasses', () => {
        it('should generate grid classes for 2-column layout', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [
                    { name: 'A', props: {}, span: 6 },
                    { name: 'B', props: {}, span: 6 },
                ],
                columns: 2,
                gap: 4,
                responsive: true,
            }

            const { containerClass, itemClasses } = generateGridClasses(layout)

            expect(containerClass).toContain('grid')
            expect(containerClass).toContain('gap-4')
            expect(containerClass).toContain('grid-cols-1')
            expect(containerClass).toContain('md:grid-cols-2')
            expect(itemClasses.length).toBe(2)
        })

        it('should generate non-responsive grid classes', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [{ name: 'A', props: {} }],
                columns: 3,
                responsive: false,
            }

            const { containerClass } = generateGridClasses(layout)

            expect(containerClass).toContain('grid-cols-3')
            expect(containerClass).not.toContain('md:')
        })

        it('should calculate column spans correctly', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [
                    { name: 'A', props: {}, span: 12 }, // Full width
                    { name: 'B', props: {}, span: 6 },  // Half width
                    { name: 'C', props: {}, span: 6 },  // Half width
                ],
                columns: 2,
            }

            const { itemClasses } = generateGridClasses(layout)

            expect(itemClasses[0]).toContain('col-span-2') // Full width in 2-col grid
            expect(itemClasses[1]).toContain('col-span-1') // Half width
            expect(itemClasses[2]).toContain('col-span-1') // Half width
        })
    })

    describe('generateFlexClasses', () => {
        it('should generate row flex classes for 2 components', () => {
            const layout: MultiComponentLayout = {
                type: 'flex',
                components: [
                    { name: 'A', props: {} },
                    { name: 'B', props: {} },
                ],
                gap: 4,
                responsive: true,
            }

            const { containerClass, itemClasses } = generateFlexClasses(layout)

            expect(containerClass).toContain('flex')
            expect(containerClass).toContain('gap-4')
            expect(containerClass).toContain('flex-col md:flex-row')
            expect(itemClasses.every(c => c === 'flex-1 min-w-0')).toBe(true)
        })

        it('should generate column flex classes for 4+ components', () => {
            const layout: MultiComponentLayout = {
                type: 'flex',
                components: Array(4).fill({ name: 'Test', props: {} }),
                responsive: true,
            }

            const { containerClass, itemClasses } = generateFlexClasses(layout)

            expect(containerClass).toContain('flex-col')
            expect(itemClasses.every(c => c === 'w-full')).toBe(true)
        })
    })

    describe('recommendLayoutType', () => {
        it('should recommend stack for single component', () => {
            const components: LayoutComponent[] = [
                { name: 'Test', props: {} },
            ]

            const type = recommendLayoutType(components)
            expect(type).toBe('stack')
        })

        it('should recommend flex for 2 components', () => {
            const components: LayoutComponent[] = [
                { name: 'A', props: {} },
                { name: 'B', props: {} },
            ]

            const type = recommendLayoutType(components)
            expect(type).toBe('flex')
        })

        it('should recommend tabs for 3 components with labels', () => {
            const components: LayoutComponent[] = [
                { name: 'A', props: {}, label: 'Tab A' },
                { name: 'B', props: {}, label: 'Tab B' },
                { name: 'C', props: {}, label: 'Tab C' },
            ]

            const type = recommendLayoutType(components)
            expect(type).toBe('tabs')
        })

        it('should recommend grid for 3-6 components without labels', () => {
            const components: LayoutComponent[] = [
                { name: 'A', props: {} },
                { name: 'B', props: {} },
                { name: 'C', props: {} },
                { name: 'D', props: {} },
            ]

            const type = recommendLayoutType(components)
            expect(type).toBe('grid')
        })
    })

    describe('autoGenerateLayout', () => {
        it('should auto-generate grid layout for 3 components', () => {
            const components: LayoutComponent[] = [
                { name: 'A', props: {} },
                { name: 'B', props: {} },
                { name: 'C', props: {} },
            ]

            const layout = autoGenerateLayout(components)

            expect(layout.type).toBe('grid')
            expect(layout.columns).toBe(3)
            expect(layout.responsive).toBe(true)
            expect(layout.gap).toBe(4)
            expect(layout.components.every(c => c.id && c.label)).toBe(true)
        })

        it('should respect preferred type', () => {
            const components: LayoutComponent[] = [
                { name: 'A', props: {} },
                { name: 'B', props: {} },
            ]

            const layout = autoGenerateLayout(components, 'accordion')

            expect(layout.type).toBe('accordion')
            expect(layout.defaultOpenAccordion).toEqual([0])
        })

        it('should set default tab for tabs layout', () => {
            const components: LayoutComponent[] = [
                { name: 'A', props: {}, label: 'Tab A' },
                { name: 'B', props: {}, label: 'Tab B' },
            ]

            const layout = autoGenerateLayout(components, 'tabs')

            expect(layout.defaultActiveTab).toBe(0)
        })
    })

    describe('optimizeForMobile', () => {
        it('should force full width spans for grid on mobile', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [
                    { name: 'A', props: {}, span: 4 },
                    { name: 'B', props: {}, span: 4 },
                    { name: 'C', props: {}, span: 4 },
                ],
                responsive: false,
            }

            const optimized = optimizeForMobile(layout)

            expect(optimized.responsive).toBe(true)
            expect(optimized.components.every(c => c.span === 12)).toBe(true)
        })

        it('should not modify non-grid layouts', () => {
            const layout: MultiComponentLayout = {
                type: 'flex',
                components: [
                    { name: 'A', props: {} },
                ],
            }

            const optimized = optimizeForMobile(layout)

            expect(optimized.type).toBe('flex')
            expect(optimized.components).toEqual(layout.components)
        })
    })

    describe('getLayoutMetadata', () => {
        it('should return metadata for valid grid layout', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [
                    { name: 'A', props: {} },
                    { name: 'B', props: {} },
                ],
            }

            const metadata = getLayoutMetadata(layout)

            expect(metadata.type).toBe('grid')
            expect(metadata.componentCount).toBe(2)
            expect(metadata.gap).toBe(4)
            expect(metadata.responsive).toBe(true)
            expect(metadata.classes).toBeDefined()
        })

        it('should throw for invalid layout', () => {
            const layout: MultiComponentLayout = {
                type: 'grid',
                components: [],
            }

            expect(() => getLayoutMetadata(layout)).toThrow('Invalid layout')
        })

        it('should return null classes for tabs/accordion', () => {
            const layout: MultiComponentLayout = {
                type: 'tabs',
                components: [
                    { name: 'A', props: {}, label: 'Tab A' },
                ],
            }

            const metadata = getLayoutMetadata(layout)

            expect(metadata.classes).toBeNull()
        })
    })
})
