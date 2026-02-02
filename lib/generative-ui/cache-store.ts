/**
 * Component Cache Store with LRU eviction strategy
 * 
 * Caches generated UI components to reduce LLM API calls and improve performance.
 * Uses context hashing to ensure cache hits are contextually relevant.
 */

export interface CachedComponent {
    id: string
    componentName: string
    props: any
    timestamp: number
    hitCount: number
    contextHash: string
    lastAccessed: number
    ttl: number // Time to live in milliseconds
}

export interface CacheStats {
    hits: number
    misses: number
    hitRate: number
    size: number
    maxSize: number
    totalEvictions: number
    avgHitCount: number
    oldestEntry: number | null
}

export interface CacheConfig {
    maxSize?: number
    defaultTTL?: number
    componentTTLs?: Record<string, number>
}

/**
 * LRU Cache Store for Generative UI Components
 */
export class ComponentCacheStore {
    private cache: Map<string, CachedComponent>
    private maxSize: number
    private defaultTTL: number
    private componentTTLs: Record<string, number>
    private stats = {
        hits: 0,
        misses: 0,
        totalEvictions: 0,
    }

    constructor(config: CacheConfig = {}) {
        this.cache = new Map()
        this.maxSize = config.maxSize || 100
        this.defaultTTL = config.defaultTTL || 1000 * 60 * 60 // 1 hour default
        this.componentTTLs = config.componentTTLs || {
            ROICalculator: 1000 * 60 * 60, // 1 hour
            PricingComparison: 1000 * 60 * 30, // 30 min
            DealFormGenerator: 1000 * 60 * 5, // 5 min (changes frequently)
            QualificationDashboard: 1000 * 60 * 15, // 15 min
            InsightCard: 1000 * 60 * 60, // 1 hour
            ProgressTracker: 1000 * 60 * 10, // 10 min
        }
    }

    /**
     * Get a component from cache
     */
    get(key: string): CachedComponent | null {
        const cached = this.cache.get(key)

        if (!cached) {
            this.stats.misses++
            return null
        }

        // Check if expired
        const now = Date.now()
        if (now - cached.timestamp > cached.ttl) {
            this.cache.delete(key)
            this.stats.misses++
            return null
        }

        // Update access time and hit count (LRU)
        cached.lastAccessed = now
        cached.hitCount++
        this.stats.hits++

        // Move to end (most recently used)
        this.cache.delete(key)
        this.cache.set(key, cached)

        return cached
    }

    /**
     * Set a component in cache with LRU eviction
     */
    set(key: string, component: Omit<CachedComponent, 'hitCount' | 'lastAccessed' | 'ttl'>): void {
        const now = Date.now()
        const ttl = this.componentTTLs[component.componentName] || this.defaultTTL

        const cached: CachedComponent = {
            ...component,
            hitCount: 0,
            lastAccessed: now,
            ttl,
        }

        // Evict oldest if at max size
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictOldest()
        }

        this.cache.set(key, cached)
    }

    /**
     * Evict the least recently used (oldest) entry
     */
    private evictOldest(): void {
        const firstKey = this.cache.keys().next().value
        if (firstKey) {
            this.cache.delete(firstKey)
            this.stats.totalEvictions++
        }
    }

    /**
     * Invalidate cache entries matching a pattern
     */
    invalidate(pattern: string | RegExp): number {
        let count = 0
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

        for (const [key, cached] of this.cache.entries()) {
            if (regex.test(key) || regex.test(cached.componentName)) {
                this.cache.delete(key)
                count++
            }
        }

        return count
    }

    /**
     * Invalidate by component name
     */
    invalidateComponent(componentName: string): number {
        return this.invalidate(new RegExp(componentName))
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear()
        this.stats = {
            hits: 0,
            misses: 0,
            totalEvictions: 0,
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const totalRequests = this.stats.hits + this.stats.misses
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0

        const entries = Array.from(this.cache.values())
        const avgHitCount = entries.length > 0
            ? entries.reduce((sum, e) => sum + e.hitCount, 0) / entries.length
            : 0

        const oldestEntry = entries.length > 0
            ? Math.min(...entries.map(e => e.timestamp))
            : null

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: Math.round(hitRate * 100) / 100,
            size: this.cache.size,
            maxSize: this.maxSize,
            totalEvictions: this.stats.totalEvictions,
            avgHitCount: Math.round(avgHitCount * 100) / 100,
            oldestEntry,
        }
    }

    /**
     * Get all cached components (for debugging/admin)
     */
    getAll(): CachedComponent[] {
        return Array.from(this.cache.values())
    }

    /**
     * Get top N most hit components
     */
    getTopHits(n: number = 10): CachedComponent[] {
        return Array.from(this.cache.values())
            .sort((a, b) => b.hitCount - a.hitCount)
            .slice(0, n)
    }

    /**
     * Get cache size in bytes (approximate)
     */
    getSizeInBytes(): number {
        let size = 0
        for (const cached of this.cache.values()) {
            size += JSON.stringify(cached).length
        }
        return size
    }
}

// Global singleton instance
export const componentCacheStore = new ComponentCacheStore({
    maxSize: 100,
    defaultTTL: 1000 * 60 * 60, // 1 hour
})

/**
 * Hash function for cache keys
 * Combines context hash and query to create unique cache key
 */
export function createCacheKey(contextHash: string, query: string): string {
    return `${contextHash}:${hashString(query)}`
}

/**
 * Simple hash function for strings
 */
export function hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
}

/**
 * Hash context object to create consistent cache keys
 */
export function hashContext(context: Record<string, any>): string {
    // Sort keys for consistent hashing
    const sortedKeys = Object.keys(context).sort()
    const values = sortedKeys.map(key => `${key}:${JSON.stringify(context[key])}`)
    return hashString(values.join('|'))
}
