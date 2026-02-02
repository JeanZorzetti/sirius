import { useCallback, useMemo } from 'react'
import {
    componentCacheStore,
    createCacheKey,
    hashContext,
    type CachedComponent,
    type CacheStats,
} from '@/lib/generative-ui/cache-store'

/**
 * Hook for component caching with context awareness
 * 
 * @param context - Current conversation/user context
 * @returns Cache utilities
 */
export function useComponentCache(context: Record<string, any> = {}) {
    // Memoize context hash to avoid recalculation
    const contextHash = useMemo(() => hashContext(context), [context])

    /**
     * Get a cached component by query
     */
    const getCached = useCallback(
        (query: string): CachedComponent | null => {
            const key = createCacheKey(contextHash, query)
            return componentCacheStore.get(key)
        },
        [contextHash]
    )

    /**
     * Set a component in cache
     */
    const setCached = useCallback(
        (query: string, componentName: string, props: any): void => {
            const key = createCacheKey(contextHash, query)
            componentCacheStore.set(key, {
                id: key,
                componentName,
                props,
                timestamp: Date.now(),
                contextHash,
            })
        },
        [contextHash]
    )

    /**
     * Invalidate cache for a specific component
     */
    const invalidateComponent = useCallback((componentName: string): number => {
        return componentCacheStore.invalidateComponent(componentName)
    }, [])

    /**
     * Invalidate cache matching a pattern
     */
    const invalidate = useCallback((pattern: string | RegExp): number => {
        return componentCacheStore.invalidate(pattern)
    }, [])

    /**
     * Clear all cache
     */
    const clearCache = useCallback((): void => {
        componentCacheStore.clear()
    }, [])

    /**
     * Get cache statistics
     */
    const stats: CacheStats = useMemo(() => {
        return componentCacheStore.getStats()
    }, [])

    return {
        getCached,
        setCached,
        invalidateComponent,
        invalidate,
        clearCache,
        stats,
    }
}

/**
 * Hook specifically for accessing cache stats (for admin dashboard)
 */
export function useCacheStats() {
    const stats = componentCacheStore.getStats()
    const topHits = componentCacheStore.getTopHits(10)
    const allCached = componentCacheStore.getAll()
    const sizeInBytes = componentCacheStore.getSizeInBytes()

    return {
        stats,
        topHits,
        allCached,
        sizeInBytes,
        sizeInKB: Math.round(sizeInBytes / 1024 * 100) / 100,
        sizeInMB: Math.round(sizeInBytes / (1024 * 1024) * 100) / 100,
    }
}
