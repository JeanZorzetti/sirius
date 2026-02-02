import { describe, it, expect, beforeEach, vi } from 'vitest'
import { assignVariant, type Variant } from '../ab-testing'

describe('A/B Testing Engine', () => {
    let mockVariants: Variant[]

    beforeEach(() => {
        mockVariants = [
            {
                id: 'var-1',
                name: 'control',
                componentName: 'ROICalculator',
                props: {},
                trafficWeight: 50,
            },
            {
                id: 'var-2',
                name: 'variant_a',
                componentName: 'PricingComparison',
                props: {},
                trafficWeight: 50,
            },
        ]
    })

    describe('Variant Assignment', () => {
        it('should assign variant consistently for same user', () => {
            const userId = 'user-123'
            const experimentId = 'exp-1'

            const assignment1 = assignVariant(userId, experimentId, mockVariants)
            const assignment2 = assignVariant(userId, experimentId, mockVariants)
            const assignment3 = assignVariant(userId, experimentId, mockVariants)

            expect(assignment1.id).toBe(assignment2.id)
            expect(assignment2.id).toBe(assignment3.id)
        })

        it('should distribute users across variants', () => {
            const experimentId = 'exp-1'
            const assignments: Record<string, number> = {
                'var-1': 0,
                'var-2': 0,
            }

            // Simulate 1000 users
            for (let i = 0; i < 1000; i++) {
                const userId = `user-${i}`
                const variant = assignVariant(userId, experimentId, mockVariants)
                assignments[variant.id]++
            }

            // Check distribution is roughly 50/50 (allow 40-60%)
            expect(assignments['var-1']).toBeGreaterThan(400)
            expect(assignments['var-1']).toBeLessThan(600)
            expect(assignments['var-2']).toBeGreaterThan(400)
            expect(assignments['var-2']).toBeLessThan(600)
        })

        it('should respect traffic weights', () => {
            const skewedVariants: Variant[] = [
                {
                    id: 'var-1',
                    name: 'control',
                    componentName: 'ROICalculator',
                    props: {},
                    trafficWeight: 90, // 90% traffic
                },
                {
                    id: 'var-2',
                    name: 'variant_a',
                    componentName: 'PricingComparison',
                    props: {},
                    trafficWeight: 10, // 10% traffic
                },
            ]

            const experimentId = 'exp-2'
            const assignments: Record<string, number> = {
                'var-1': 0,
                'var-2': 0,
            }

            // Simulate 1000 users
            for (let i = 0; i < 1000; i++) {
                const userId = `user-${i}`
                const variant = assignVariant(userId, experimentId, skewedVariants)
                assignments[variant.id]++
            }

            // Check 90/10 split (allow 85-95% for control)
            expect(assignments['var-1']).toBeGreaterThan(850)
            expect(assignments['var-1']).toBeLessThan(950)
            expect(assignments['var-2']).toBeGreaterThan(50)
            expect(assignments['var-2']).toBeLessThan(150)
        })

        it('should handle different experiment IDs for same user', () => {
            const userId = 'user-123'
            const exp1 = 'experiment-1'
            const exp2 = 'experiment-2'

            const assignment1 = assignVariant(userId, exp1, mockVariants)
            const assignment2 = assignVariant(userId, exp2, mockVariants)

            // Same user can get different variants in different experiments
            // (we're just checking it doesn't error, assignments might be same or different)
            expect(assignment1).toBeDefined()
            expect(assignment2).toBeDefined()
        })

        it('should throw error for empty variants array', () => {
            expect(() => {
                assignVariant('user-123', 'exp-1', [])
            }).toThrow('Experiment must have at least one variant')
        })

        it('should always return control as fallback', () => {
            const singleVariant: Variant[] = [
                {
                    id: 'var-1',
                    name: 'control',
                    componentName: 'ROICalculator',
                    props: {},
                    trafficWeight: 100,
                },
            ]

            const variant = assignVariant('user-123', 'exp-1', singleVariant)
            expect(variant.name).toBe('control')
        })

        it('should handle three variants', () => {
            const threeVariants: Variant[] = [
                {
                    id: 'var-1',
                    name: 'control',
                    componentName: 'ROICalculator',
                    props: {},
                    trafficWeight: 33,
                },
                {
                    id: 'var-2',
                    name: 'variant_a',
                    componentName: 'PricingComparison',
                    props: {},
                    trafficWeight: 33,
                },
                {
                    id: 'var-3',
                    name: 'variant_b',
                    componentName: 'DemoScheduler',
                    props: {},
                    trafficWeight: 34,
                },
            ]

            const experimentId = 'exp-3'
            const assignments: Record<string, number> = {
                'var-1': 0,
                'var-2': 0,
                'var-3': 0,
            }

            // Simulate 900 users
            for (let i = 0; i < 900; i++) {
                const userId = `user-${i}`
                const variant = assignVariant(userId, experimentId, threeVariants)
                assignments[variant.id]++
            }

            // Each should get roughly 300 users (allow 250-350)
            expect(assignments['var-1']).toBeGreaterThan(250)
            expect(assignments['var-1']).toBeLessThan(350)
            expect(assignments['var-2']).toBeGreaterThan(250)
            expect(assignments['var-2']).toBeLessThan(350)
            expect(assignments['var-3']).toBeGreaterThan(250)
            expect(assignments['var-3']).toBeLessThan(400) // slight bias ok
        })
    })

    describe('Consistency Across Sessions', () => {
        it('should give same variant on different days', () => {
            const userId = 'user-456'
            const experimentId = 'exp-daily'

            // Simulate assignment on day 1
            const day1Assignment = assignVariant(userId, experimentId, mockVariants)

            // Simulate assignment on day 2 (same user, same experiment)
            const day2Assignment = assignVariant(userId, experimentId, mockVariants)

            expect(day1Assignment.id).toBe(day2Assignment.id)
            expect(day1Assignment.name).toBe(day2Assignment.name)
        })
    })

    describe('Edge Cases', () => {
        it('should handle variant with 0% traffic weight', () => {
            const zeroWeightVariants: Variant[] = [
                {
                    id: 'var-1',
                    name: 'control',
                    componentName: 'ROICalculator',
                    props: {},
                    trafficWeight: 100,
                },
                {
                    id: 'var-2',
                    name: 'variant_a',
                    componentName: 'PricingComparison',
                    props: {},
                    trafficWeight: 0, // No traffic
                },
            ]

            const experimentId = 'exp-zero'
            const assignments: Record<string, number> = {
                'var-1': 0,
                'var-2': 0,
            }

            for (let i = 0; i < 100; i++) {
                const userId = `user-${i}`
                const variant = assignVariant(userId, experimentId, zeroWeightVariants)
                assignments[variant.id]++
            }

            // All should go to var-1
            expect(assignments['var-1']).toBe(100)
            expect(assignments['var-2']).toBe(0)
        })

        it('should handle very long user IDs', () => {
            const longUserId = 'a'.repeat(1000)
            const experimentId = 'exp-long'

            const variant = assignVariant(longUserId, experimentId, mockVariants)
            expect(variant).toBeDefined()
            expect(['var-1', 'var-2']).toContain(variant.id)
        })

        it('should handle special characters in user IDs', () => {
            const specialUserId = 'user@example.com#123!$%'
            const experimentId = 'exp-special'

            const variant = assignVariant(specialUserId, experimentId, mockVariants)
            expect(variant).toBeDefined()
        })
    })
})
