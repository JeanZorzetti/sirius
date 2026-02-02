import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    ComponentCacheStore,
    createCacheKey,
    hashString,
    hashContext,
    type CachedComponent,
} from '../cache-store'

describe('ComponentCacheStore', () => {
    let store: ComponentCacheStore

    beforeEach(() => {
        store = new ComponentCacheStore({
            maxSize: 5,
            defaultTTL: 1000, // 1 second for testing
        })
    })

    describe('Basic Operations', () => {
        it('should store and retrieve components', () => {
            const component = {
                id: 'test-1',
                componentName: 'ROICalculator',
                props: { initial: 1000 },
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            }

            store.set('key-1', component)
            const retrieved = store.get('key-1')

            expect(retrieved).toBeTruthy()
            expect(retrieved?.componentName).toBe('ROICalculator')
            expect(retrieved?.props).toEqual({ initial: 1000 })
        })

        it('should return null for non-existent keys', () => {
            const retrieved = store.get('non-existent')
            expect(retrieved).toBeNull()
        })

        it('should increment hit count on retrieval', () => {
            const component = {
                id: 'test-1',
                componentName: 'ROICalculator',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            }

            store.set('key-1', component)

            const first = store.get('key-1')
            expect(first?.hitCount).toBe(1)

            const second = store.get('key-1')
            expect(second?.hitCount).toBe(2)
        })
    })

    describe('TTL and Expiration', () => {
        it('should respect component-specific TTL', () => {
            const store = new ComponentCacheStore({
                componentTTLs: {
                    FastExpire: 100, // 100ms
                },
            })

            store.set('key-1', {
                id: 'test-1',
                componentName: 'FastExpire',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            // Should be available immediately
            expect(store.get('key-1')).toBeTruthy()

            // Wait for expiration
            vi.useFakeTimers()
            vi.advanceTimersByTime(150)

            expect(store.get('key-1')).toBeNull()

            vi.useRealTimers()
        })

        it('should use default TTL when component TTL not specified', async () => {
            const store = new ComponentCacheStore({
                defaultTTL: 100, // 100ms default
            })

            store.set('key-1', {
                id: 'test-1',
                componentName: 'UnknownComponent',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            // Should be available immediately
            expect(store.get('key-1')).toBeTruthy()

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 150))

            expect(store.get('key-1')).toBeNull()
        })
    })

    describe('LRU Eviction', () => {
        it('should evict oldest entry when max size reached', () => {
            // Max size is 5
            for (let i = 1; i <= 5; i++) {
                store.set(`key-${i}`, {
                    id: `test-${i}`,
                    componentName: 'Test',
                    props: {},
                    timestamp: Date.now(),
                    contextHash: 'ctx-123',
                })
            }

            // All 5 should be present
            expect(store.getStats().size).toBe(5)

            // Add 6th item - should evict key-1 (oldest)
            store.set('key-6', {
                id: 'test-6',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            expect(store.getStats().size).toBe(5)
            expect(store.get('key-1')).toBeNull() // Evicted
            expect(store.get('key-6')).toBeTruthy() // New entry present
        })

        it('should move accessed items to end (LRU)', () => {
            for (let i = 1; i <= 5; i++) {
                store.set(`key-${i}`, {
                    id: `test-${i}`,
                    componentName: 'Test',
                    props: {},
                    timestamp: Date.now(),
                    contextHash: 'ctx-123',
                })
            }

            // Access key-1 to make it most recently used
            store.get('key-1')

            // Add new item - should evict key-2 (now oldest)
            store.set('key-6', {
                id: 'test-6',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            expect(store.get('key-1')).toBeTruthy() // Still present
            expect(store.get('key-2')).toBeNull() // Evicted
        })
    })

    describe('Invalidation', () => {
        beforeEach(() => {
            store.set('roi-1', {
                id: 'roi-1',
                componentName: 'ROICalculator',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            store.set('pricing-1', {
                id: 'pricing-1',
                componentName: 'PricingComparison',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            store.set('roi-2', {
                id: 'roi-2',
                componentName: 'ROICalculator',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-456',
            })
        })

        it('should invalidate by component name', () => {
            const count = store.invalidateComponent('ROICalculator')

            expect(count).toBe(2) // Both ROI entries
            expect(store.get('roi-1')).toBeNull()
            expect(store.get('roi-2')).toBeNull()
            expect(store.get('pricing-1')).toBeTruthy() // Unaffected
        })

        it('should invalidate by pattern', () => {
            const count = store.invalidate(/roi/)

            expect(count).toBe(2)
            expect(store.get('roi-1')).toBeNull()
            expect(store.get('roi-2')).toBeNull()
        })

        it('should clear all cache', () => {
            store.clear()

            expect(store.getStats().size).toBe(0)
            expect(store.get('roi-1')).toBeNull()
            expect(store.get('pricing-1')).toBeNull()
        })
    })

    describe('Statistics', () => {
        it('should track hits and misses', () => {
            store.set('key-1', {
                id: 'test-1',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            store.get('key-1') // Hit
            store.get('key-1') // Hit
            store.get('key-2') // Miss
            store.get('key-3') // Miss

            const stats = store.getStats()
            expect(stats.hits).toBe(2)
            expect(stats.misses).toBe(2)
            expect(stats.hitRate).toBe(50) // 2/(2+2) * 100
        })

        it('should calculate average hit count', () => {
            store.set('key-1', {
                id: 'test-1',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            store.set('key-2', {
                id: 'test-2',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            store.get('key-1') // hitCount = 1
            store.get('key-1') // hitCount = 2
            store.get('key-2') // hitCount = 1

            const stats = store.getStats()
            expect(stats.avgHitCount).toBe(1.5) // (2 + 1) / 2
        })

        it('should track evictions', () => {
            const store = new ComponentCacheStore({ maxSize: 2 })

            store.set('key-1', {
                id: 'test-1',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            store.set('key-2', {
                id: 'test-2',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            // This should evict key-1
            store.set('key-3', {
                id: 'test-3',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            const stats = store.getStats()
            expect(stats.totalEvictions).toBe(1)
        })
    })

    describe('Additional Utilities', () => {
        it('should get all cached components', () => {
            store.set('key-1', {
                id: 'test-1',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            store.set('key-2', {
                id: 'test-2',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            const all = store.getAll()
            expect(all.length).toBe(2)
        })

        it('should get top N hits', () => {
            store.set('key-1', {
                id: 'test-1',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            store.set('key-2', {
                id: 'test-2',
                componentName: 'Test',
                props: {},
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            // Make key-2 more popular
            store.get('key-1')
            store.get('key-2')
            store.get('key-2')
            store.get('key-2')

            const topHits = store.getTopHits(1)
            expect(topHits.length).toBe(1)
            expect(topHits[0].id).toBe('test-2')
            expect(topHits[0].hitCount).toBe(3)
        })

        it('should calculate cache size in bytes', () => {
            store.set('key-1', {
                id: 'test-1',
                componentName: 'Test',
                props: { data: 'small' },
                timestamp: Date.now(),
                contextHash: 'ctx-123',
            })

            const size = store.getSizeInBytes()
            expect(size).toBeGreaterThan(0)
        })
    })
})

describe('Hash Functions', () => {
    it('should hash strings consistently', () => {
        const hash1 = hashString('test')
        const hash2 = hashString('test')

        expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different strings', () => {
        const hash1 = hashString('test1')
        const hash2 = hashString('test2')

        expect(hash1).not.toBe(hash2)
    })

    it('should hash context objects consistently', () => {
        const ctx = { userId: '123', orgId: '456' }
        const hash1 = hashContext(ctx)
        const hash2 = hashContext(ctx)

        expect(hash1).toBe(hash2)
    })

    it('should produce same hash regardless of key order', () => {
        const ctx1 = { userId: '123', orgId: '456' }
        const ctx2 = { orgId: '456', userId: '123' }

        const hash1 = hashContext(ctx1)
        const hash2 = hashContext(ctx2)

        expect(hash1).toBe(hash2)
    })

    it('should create cache keys correctly', () => {
        const key = createCacheKey('ctx-123', 'query-456')
        expect(key).toContain('ctx-123')
        expect(key).toContain(':')
    })
})
