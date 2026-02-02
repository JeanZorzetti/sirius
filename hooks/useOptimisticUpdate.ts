/**
 * React Hook for Optimistic Updates
 * 
 * Provides a simple interface for implementing optimistic UI updates
 * with automatic state management, rollback, and error handling.
 * 
 * @module hooks/useOptimisticUpdate
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import {
    createOptimisticUpdate,
    rollbackOptimisticUpdate,
    optimisticUpdateStore,
    type OptimisticUpdate,
    type OptimisticUpdateOptions,
} from '@/lib/generative-ui/optimistic-updates'

export interface UseOptimisticUpdateResult<TData> {
    /**
     * Current optimistic data (includes pending updates)
     */
    data: TData

    /**
     * Whether any updates are pending
     */
    isPending: boolean

    /**
     * List of all active updates
     */
    updates: OptimisticUpdate<TData>[]

    /**
     * Execute an optimistic update
     */
    executeUpdate: <TResult = TData>(
        newData: TData,
        operation: (data: TData) => Promise<TResult>,
        options?: OptimisticUpdateOptions<TData>
    ) => Promise<TResult>

    /**
     * Rollback a specific update by ID
     */
    rollback: (id: string) => void

    /**
     * Reset to original data (rollback all)
     */
    reset: () => void
}

/**
 * Hook for managing optimistic updates
 * 
 * @example
 * ```typescript
 * function TodoList() {
 *   const [todos, setTodos] = useState([])
 *   
 *   const {
 *     data: optimisticTodos,
 *     isPending,
 *     executeUpdate
 *   } = useOptimisticUpdate(todos)
 *   
 *   const addTodo = async (text: string) => {
 *     const newTodo = { id: Date.now(), text, completed: false }
 *     const newTodos = [...todos, newTodo]
 *     
 *     try {
 *       await executeUpdate(
 *         newTodos,
 *         async (data) => {
 *           const response = await fetch('/api/todos', {
 *             method: 'POST',
 *             body: JSON.stringify(newTodo)
 *           })
 *           return response.json()
 *         },
 *         {
 *           originalData: todos,
 *           onSuccess: () => setTodos(newTodos),
 *           onRollback: () => console.log('Todo creation failed, rolled back')
 *         }
 *       )
 *     } catch (error) {
 *       console.error('Failed to add todo:', error)
 *     }
 *   }
 *   
 *   return (
 *     <div>
 *       {isPending && <div>Saving...</div>}
 *       {optimisticTodos.map(todo => (
 *         <div key={todo.id}>{todo.text}</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useOptimisticUpdate<TData>(
    initialData: TData
): UseOptimisticUpdateResult<TData> {
    const [data, setData] = useState<TData>(initialData)
    const [updates, setUpdates] = useState<OptimisticUpdate<TData>[]>([])

    // Subscribe to update store changes
    useEffect(() => {
        const unsubscribe = optimisticUpdateStore.subscribe(() => {
            setUpdates(optimisticUpdateStore.getAll() as OptimisticUpdate<TData>[])
        })

        return unsubscribe
    }, [])

    // Update data when initialData changes
    useEffect(() => {
        setData(initialData)
    }, [initialData])

    const executeUpdate = useCallback(
        async <TResult = TData>(
            newData: TData,
            operation: (data: TData) => Promise<TResult>,
            options: OptimisticUpdateOptions<TData> = {}
        ): Promise<TResult> => {
            // Immediately update UI with optimistic data
            setData(newData)

            try {
                const result = await createOptimisticUpdate(newData, operation, {
                    ...options,
                    originalData: options.originalData ?? initialData,
                    onRollback: (originalData) => {
                        // Rollback UI to original data
                        setData(originalData)
                        options.onRollback?.(originalData)
                    },
                })

                return result
            } catch (error) {
                // Error already handled by createOptimisticUpdate
                // Data already rolled back via onRollback
                throw error
            }
        },
        [initialData]
    )

    const rollback = useCallback((id: string) => {
        rollbackOptimisticUpdate(id)
        setData(initialData)
    }, [initialData])

    const reset = useCallback(() => {
        setData(initialData)
        setUpdates([])
    }, [initialData])

    const isPending = updates.some(u => u.status === 'pending')

    return {
        data,
        isPending,
        updates,
        executeUpdate,
        rollback,
        reset,
    }
}

/**
 * Simpler hook for single optimistic updates (no complex state management)
 * 
 * @example
 * ```typescript
 * function LikeButton({ postId, initialLikes }: Props) {
 *   const { isPending, execute } = useSimpleOptimisticUpdate()
 *   const [likes, setLikes] = useState(initialLikes)
 *   
 *   const handleLike = () => {
 *     execute(
 *       () => setLikes(likes + 1), // Optimistic update
 *       async () => {
 *         await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
 *       },
 *       () => setLikes(likes) // Rollback
 *     )
 *   }
 *   
 *   return (
 *     <button onClick={handleLike} disabled={isPending}>
 *       {likes} Likes {isPending && '...'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useSimpleOptimisticUpdate() {
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const execute = useCallback(
        async (
            optimisticUpdate: () => void,
            operation: () => Promise<void>,
            rollback: () => void
        ) => {
            setIsPending(true)
            setError(null)

            // Apply optimistic update immediately
            optimisticUpdate()

            try {
                await operation()
            } catch (err) {
                // Rollback on error
                rollback()
                setError(err as Error)
                throw err
            } finally {
                setIsPending(false)
            }
        },
        []
    )

    return {
        isPending,
        error,
        execute,
    }
}
