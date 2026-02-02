/**
 * A/B Testing Engine
 * 
 * Handles experiment management, variant assignment, and event tracking
 * for systematic UI/UX testing.
 */

import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export interface Variant {
    id: string
    name: string
    componentName: string
    props: Record<string, any>
    trafficWeight: number
}

export interface ExperimentConfig {
    id: string
    name: string
    status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
    variants: Variant[]
}

export interface ExperimentResults {
    experimentId: string
    variants: VariantResults[]
    winner: string | null
    isSignificant: boolean
    pValue: number
}

export interface VariantResults {
    variantId: string
    variantName: string
    impressions: number
    interactions: number
    conversions: number
    conversionRate: number
    confidenceInterval: {
        lower: number
        upper: number
    }
}

export type EventType = 'impression' | 'interaction' | 'conversion'

// ============================================================================
// CONSISTENT HASHING
// ============================================================================

/**
 * MurmurHash3 implementation for consistent variant assignment
 * Ensures the same user always gets the same variant
 */
function murmur3(key: string, seed = 0): number {
    const remainder = key.length & 3 // key.length % 4
    const bytes = key.length - remainder
    let h1 = seed
    let c1 = 0xcc9e2d51
    let c2 = 0x1b873593
    let i = 0

    while (i < bytes) {
        let k1 =
            (key.charCodeAt(i) & 0xff) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24)
        ++i

        k1 = Math.imul(k1, c1)
        k1 = (k1 << 15) | (k1 >>> 17)
        k1 = Math.imul(k1, c2)

        h1 ^= k1
        h1 = (h1 << 13) | (h1 >>> 19)
        h1 = Math.imul(h1, 5) + 0xe6546b64
    }

    let k1 = 0

    switch (remainder) {
        case 3:
            k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16
        case 2:
            k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8
        case 1:
            k1 ^= key.charCodeAt(i) & 0xff
            k1 = Math.imul(k1, c1)
            k1 = (k1 << 15) | (k1 >>> 17)
            k1 = Math.imul(k1, c2)
            h1 ^= k1
    }

    h1 ^= key.length
    h1 ^= h1 >>> 16
    h1 = Math.imul(h1, 0x85ebca6b)
    h1 ^= h1 >>> 13
    h1 = Math.imul(h1, 0xc2b2ae35)
    h1 ^= h1 >>> 16

    return h1 >>> 0
}

/**
 * Hash user ID to get consistent number 0-99
 */
function hashUserId(userId: string, experimentId: string): number {
    const hash = murmur3(userId + experimentId)
    return hash % 100
}

// ============================================================================
// VARIANT ASSIGNMENT
// ============================================================================

/**
 * Assign variant to user based on consistent hashing
 * Same user + same experiment = same variant (always)
 */
export function assignVariant(
    userId: string,
    experimentId: string,
    variants: Variant[]
): Variant {
    if (variants.length === 0) {
        throw new Error('Experiment must have at least one variant')
    }

    // Sort variants by name for consistency
    const sortedVariants = [...variants].sort((a, b) => a.name.localeCompare(b.name))

    // Get hash (0-99)
    const hash = hashUserId(userId, experimentId)

    // Find variant based on cumulative traffic weights
    let cumulative = 0
    for (const variant of sortedVariants) {
        cumulative += variant.trafficWeight
        if (hash < cumulative) {
            return variant
        }
    }

    // Fallback to first variant (control)
    return sortedVariants[0]
}

/**
 * Get or assign variant for user (with DB persistence)
 */
export async function getVariantForUser(
    experimentId: string,
    userId: string
): Promise<Variant | null> {
    // Get experiment
    const experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: { variants: true },
    })

    if (!experiment || experiment.status !== 'RUNNING') {
        return null
    }

    // Convert DB variants to Variant type
    const variants: Variant[] = experiment.variants.map((v) => ({
        id: v.id,
        name: v.name,
        componentName: v.componentName,
        props: v.props as Record<string, any>,
        trafficWeight: v.trafficWeight,
    }))

    // Assign variant using consistent hashing
    const assignedVariant = assignVariant(userId, experimentId, variants)

    return assignedVariant
}

// ============================================================================
// EVENT TRACKING
// ============================================================================

/**
 * Track impression (user saw the variant)
 */
export async function trackImpression(
    experimentId: string,
    variantId: string,
    sessionId: string,
    userId?: string
): Promise<void> {
    await prisma.experimentEvent.create({
        data: {
            experimentId,
            variantId,
            sessionId,
            userId,
            eventType: 'impression',
        },
    })
}

/**
 * Track interaction (user clicked/interacted with variant)
 */
export async function trackInteraction(
    experimentId: string,
    variantId: string,
    sessionId: string,
    userId?: string,
    metadata?: Record<string, any>
): Promise<void> {
    await prisma.experimentEvent.create({
        data: {
            experimentId,
            variantId,
            sessionId,
            userId,
            eventType: 'interaction',
            metadata: metadata || {},
        },
    })
}

/**
 * Track conversion (user completed goal action)
 */
export async function trackConversion(
    experimentId: string,
    variantId: string,
    sessionId: string,
    userId?: string,
    metadata?: Record<string, any>
): Promise<void> {
    await prisma.experimentEvent.create({
        data: {
            experimentId,
            variantId,
            sessionId,
            userId,
            eventType: 'conversion',
            metadata: metadata || {},
        },
    })
}

// ============================================================================
// RESULTS & ANALYSIS
// ============================================================================

/**
 * Calculate experiment results with statistical significance
 */
export async function calculateResults(experimentId: string): Promise<ExperimentResults> {
    const experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: {
            variants: {
                include: {
                    events: true,
                },
            },
        },
    })

    if (!experiment) {
        throw new Error(`Experiment ${experimentId} not found`)
    }

    // Calculate metrics for each variant
    const variantResults: VariantResults[] = experiment.variants.map((variant) => {
        const impressions = variant.events.filter((e) => e.eventType === 'impression').length
        const interactions = variant.events.filter((e) => e.eventType === 'interaction').length
        const conversions = variant.events.filter((e) => e.eventType === 'conversion').length

        const conversionRate = impressions > 0 ? conversions / impressions : 0

        // Wilson score confidence interval (95%)
        const z = 1.96 // 95% confidence
        const pHat = conversionRate
        const n = impressions

        let lower = 0
        let upper = 0

        if (n > 0) {
            const denominator = 1 + (z * z) / n
            const center = pHat + (z * z) / (2 * n)
            const margin = z * Math.sqrt((pHat * (1 - pHat) + (z * z) / (4 * n)) / n)

            lower = (center - margin) / denominator
            upper = (center + margin) / denominator
        }

        return {
            variantId: variant.id,
            variantName: variant.name,
            impressions,
            interactions,
            conversions,
            conversionRate,
            confidenceInterval: {
                lower: Math.max(0, lower),
                upper: Math.min(1, upper),
            },
        }
    })

    // Determine winner (simple: highest conversion rate with enough data)
    let winner: string | null = null
    let isSignificant = false
    let pValue = 1.0

    if (variantResults.length >= 2) {
        // Find control (first variant alphabetically)
        const control = variantResults.sort((a, b) => a.variantName.localeCompare(b.variantName))[0]

        // Find best performer
        const best = variantResults.reduce((prev, current) =>
            current.conversionRate > prev.conversionRate ? current : prev
        )

        // Simple chi-square test (2x2 contingency table)
        if (control.impressions >= 100 && best.impressions >= 100) {
            const a = best.conversions
            const b = best.impressions - best.conversions
            const c = control.conversions
            const d = control.impressions - control.conversions

            const n = a + b + c + d
            const chiSquare =
                (n * Math.pow(a * d - b * c, 2)) / ((a + b) * (c + d) * (a + c) * (b + d))

            // Critical value for p<0.05 with df=1 is 3.841
            pValue = chiSquare > 3.841 ? 0.04 : 0.5 // simplified
            isSignificant = chiSquare > 3.841

            if (isSignificant && best.variantId !== control.variantId) {
                winner = best.variantId
            }
        }
    }

    return {
        experimentId,
        variants: variantResults,
        winner,
        isSignificant,
        pValue,
    }
}

/**
 * Get experiment winner (if statistically significant)
 */
export async function getWinner(experimentId: string): Promise<Variant | null> {
    const results = await calculateResults(experimentId)

    if (!results.winner) {
        return null
    }

    const experiment = await prisma.experiment.findUnique({
        where: { id: experimentId },
        include: { variants: true },
    })

    const winnerVariant = experiment?.variants.find((v) => v.id === results.winner)

    if (!winnerVariant) {
        return null
    }

    return {
        id: winnerVariant.id,
        name: winnerVariant.name,
        componentName: winnerVariant.componentName,
        props: winnerVariant.props as Record<string, any>,
        trafficWeight: winnerVariant.trafficWeight,
    }
}
