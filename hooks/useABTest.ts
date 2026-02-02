'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Variant } from '@/lib/generative-ui/ab-testing'

export interface UseABTestOptions {
    /** Auto-track impression on mount (default: true) */
    autoTrackImpression?: boolean
    /** Callback when variant is assigned */
    onVariantAssigned?: (variant: Variant) => void
    /** Callback when tracking fails */
    onError?: (error: Error) => void
}

export interface UseABTestReturn {
    /** Assigned variant (null if loading or experiment not running) */
    variant: Variant | null
    /** Whether this is the control variant */
    isControl: boolean
    /** Loading state */
    isLoading: boolean
    /** Error state */
    error: string | null
    /**
     * Track impression (auto-called on mount if autoTrackImpression=true)
     */
    trackImpression: () => Promise<void>
    /**
     * Track interaction (user clicked/engaged with variant)
     */
    trackInteraction: (metadata?: Record<string, any>) => Promise<void>
    /**
     * Track conversion (user completed goal action)
     */
    trackConversion: (metadata?: Record<string, any>) => Promise<void>
}

/**
 * React Hook for A/B Testing
 * 
 * Assigns user to experiment variant and provides tracking methods.
 * Uses consistent hashing to ensure same user always gets same variant.
 * 
 * @example
 * ```tsx
 * function AIChat() {
 *   const { variant, trackInteraction, trackConversion } = useABTest('roi-vs-pricing', userId)
 *   
 *   if (!variant) return <Skeleton />
 *   
 *   return (
 *     <DynamicUIComponent
 *       name={variant.componentName}
 *       props={variant.props}
 *       onClick={() => trackInteraction({ clicked: true })}
 *     />
 *   )
 * }
 * ```
 */
export function useABTest(
    experimentId: string,
    userId: string,
    options: UseABTestOptions = {}
): UseABTestReturn {
    const {
        autoTrackImpression = true,
        onVariantAssigned,
        onError,
    } = options

    const [variant, setVariant] = useState<Variant | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const impressionTracked = useRef(false)
    const sessionIdRef = useRef<string | null>(null)

    // Get or create session ID (persistent across page reloads)
    useEffect(() => {
        if (typeof window === 'undefined') return

        const storageKey = 'ab-test-session-id'
        let sessionId = localStorage.getItem(storageKey)

        if (!sessionId) {
            sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            localStorage.setItem(storageKey, sessionId)
        }

        sessionIdRef.current = sessionId
    }, [])

    // Fetch variant assignment
    useEffect(() => {
        if (!userId || !experimentId) return

        const fetchVariant = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(`/api/ab-testing/${experimentId}/assign`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }),
                })

                if (!response.ok) {
                    throw new Error(`Failed to assign variant: ${response.statusText}`)
                }

                const data = await response.json()

                if (data.variant) {
                    setVariant(data.variant)
                    onVariantAssigned?.(data.variant)
                } else {
                    // Experiment not running or doesn't exist
                    setVariant(null)
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error'
                setError(errorMsg)
                onError?.(err instanceof Error ? err : new Error(errorMsg))
            } finally {
                setIsLoading(false)
            }
        }

        fetchVariant()
    }, [experimentId, userId, onVariantAssigned, onError])

    // Auto-track impression on mount
    useEffect(() => {
        if (!autoTrackImpression || !variant || impressionTracked.current) return

        trackImpression()
    }, [variant, autoTrackImpression])

    // Track impression
    const trackImpression = useCallback(async () => {
        if (!variant || !sessionIdRef.current || impressionTracked.current) return

        impressionTracked.current = true

        try {
            await fetch(`/api/ab-testing/${experimentId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variantId: variant.id,
                    userId,
                    sessionId: sessionIdRef.current,
                    eventType: 'impression',
                }),
            })
        } catch (err) {
            console.error('[useABTest] Failed to track impression:', err)
        }
    }, [variant, experimentId, userId])

    // Track interaction
    const trackInteraction = useCallback(
        async (metadata?: Record<string, any>) => {
            if (!variant || !sessionIdRef.current) return

            try {
                await fetch(`/api/ab-testing/${experimentId}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variantId: variant.id,
                        userId,
                        sessionId: sessionIdRef.current,
                        eventType: 'interaction',
                        metadata,
                    }),
                })
            } catch (err) {
                console.error('[useABTest] Failed to track interaction:', err)
            }
        },
        [variant, experimentId, userId]
    )

    // Track conversion
    const trackConversion = useCallback(
        async (metadata?: Record<string, any>) => {
            if (!variant || !sessionIdRef.current) return

            try {
                await fetch(`/api/ab-testing/${experimentId}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variantId: variant.id,
                        userId,
                        sessionId: sessionIdRef.current,
                        eventType: 'conversion',
                        metadata,
                    }),
                })
            } catch (err) {
                console.error('[useABTest] Failed to track conversion:', err)
            }
        },
        [variant, experimentId, userId]
    )

    const isControl = variant?.name === 'control'

    return {
        variant,
        isControl,
        isLoading,
        error,
        trackImpression,
        trackInteraction,
        trackConversion,
    }
}
