/**
 * Optimistic Updates System for Generative UI
 * 
 * Provides utilities for implementing optimistic UI updates during async operations.
 * Automatically handles rollback on errors and success confirmations.
 * 
 * @module lib/generative-ui/optimistic-updates
 */

export type OptimisticUpdateStatus = 'pending' | 'success' | 'error' | 'rolled-back'

export interface OptimisticUpdate<TData = any> {
    id: string
    timestamp: number
    status: OptimisticUpdateStatus
    data: TData
    originalData?: TData
    error?: Error
    retryCount: number
    maxRetries: number
}

export interface OptimisticUpdateOptions<TData = any> {
    /**
     * Unique identifier for this update
     */
    id?: string

    /**
     * Original data before the update (for rollback)
     */
    originalData?: TData

    /**
     * Maximum number of retry attempts on failure
     * @default 3
     */
    maxRetries?: number

    /**
     * Delay between retry attempts in milliseconds
     * @default 1000
     */
    retryDelay?: number

    /**
     * Callback when update succeeds
     */
    onSuccess?: (data: TData) => void

    /**
     * Callback when update fails (after all retries)
     */
    onError?: (error: Error) => void

    /**
     * Callback when update is rolled back
     */
    onRollback?: (originalData: TData) => void
}

/**
 * Store for managing optimistic updates
 */
class OptimisticUpdateStore {
    private updates: Map<string, OptimisticUpdate> = new Map()
    private subscribers: Set<() => void> = new Set()

    /**
     * Add or update an optimistic update
     */
    set(id: string, update: OptimisticUpdate): void {
        this.updates.set(id, update)
        this.notify()
    }

    /**
     * Get an optimistic update by ID
     */
    get(id: string): OptimisticUpdate | undefined {
        return this.updates.get(id)
    }

    /**
     * Remove an optimistic update
     */
    delete(id: string): void {
        this.updates.delete(id)
        this.notify()
    }

    /**
     * Get all optimistic updates
     */
    getAll(): OptimisticUpdate[] {
        return Array.from(this.updates.values())
    }

    /**
     * Get all pending updates
     */
    getPending(): OptimisticUpdate[] {
        return this.getAll().filter(u => u.status === 'pending')
    }

    /**
     * Subscribe to updates
     */
    subscribe(callback: () => void): () => void {
        this.subscribers.add(callback)
        return () => this.subscribers.delete(callback)
    }

    /**
     * Notify all subscribers
     */
    private notify(): void {
        this.subscribers.forEach(callback => callback())
    }

    /**
     * Clear all updates
     */
    clear(): void {
        this.updates.clear()
        this.notify()
    }
}

// Global store instance
export const optimisticUpdateStore = new OptimisticUpdateStore()

/**
 * Generate a unique ID for an optimistic update
 */
function generateUpdateId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create an optimistic update and execute the async operation
 * 
 * @example
 * ```typescript
 * const result = await createOptimisticUpdate(
 *   { currentData: items, newItem: item },
 *   async (data) => {
 *     const response = await fetch('/api/items', {
 *       method: 'POST',
 *       body: JSON.stringify(data.newItem)
 *     })
 *     return response.json()
 *   },
 *   {
 *     originalData: items,
 *     onSuccess: (result) => console.log('Item created:', result),
 *     onError: (error) => console.error('Failed to create item:', error)
 *   }
 * )
 * ```
 */
export async function createOptimisticUpdate<TData, TResult = TData>(
    data: TData,
    operation: (data: TData) => Promise<TResult>,
    options: OptimisticUpdateOptions<TData> = {}
): Promise<TResult> {
    const {
        id = generateUpdateId(),
        originalData,
        maxRetries = 3,
        retryDelay = 1000,
        onSuccess,
        onError,
        onRollback,
    } = options

    // Create optimistic update record
    const update: OptimisticUpdate<TData> = {
        id,
        timestamp: Date.now(),
        status: 'pending',
        data,
        originalData,
        retryCount: 0,
        maxRetries,
    }

    optimisticUpdateStore.set(id, update)

    // Execute operation with retry logic
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await operation(data)

            // Success!
            update.status = 'success'
            optimisticUpdateStore.set(id, update)

            // Clean up after a delay
            setTimeout(() => optimisticUpdateStore.delete(id), 5000)

            onSuccess?.(data)
            return result
        } catch (error) {
            lastError = error as Error
            update.retryCount = attempt + 1

            if (attempt < maxRetries) {
                // Wait before retry
                await sleep(retryDelay * (attempt + 1)) // Exponential backoff
                continue
            }

            // All retries exhausted
            break
        }
    }

    // Failed after all retries
    update.status = 'error'
    update.error = lastError
    optimisticUpdateStore.set(id, update)

    // Rollback if we have original data
    if (originalData !== undefined) {
        update.status = 'rolled-back'
        optimisticUpdateStore.set(id, update)
        onRollback?.(originalData)
    }

    onError?.(lastError!)

    throw lastError
}

/**
 * Rollback an optimistic update manually
 */
export function rollbackOptimisticUpdate(id: string): void {
    const update = optimisticUpdateStore.get(id)
    if (!update) return

    if (update.originalData !== undefined) {
        update.status = 'rolled-back'
        optimisticUpdateStore.set(id, update)

        // Clean up after a delay
        setTimeout(() => optimisticUpdateStore.delete(id), 3000)
    }
}

/**
 * Clear all optimistic updates
 */
export function clearOptimisticUpdates(): void {
    optimisticUpdateStore.clear()
}

/**
 * Get the current status of an optimistic update
 */
export function getOptimisticUpdateStatus(id: string): OptimisticUpdateStatus | null {
    const update = optimisticUpdateStore.get(id)
    return update?.status ?? null
}

/**
 * Check if there are any pending optimistic updates
 */
export function hasPendingUpdates(): boolean {
    return optimisticUpdateStore.getPending().length > 0
}
