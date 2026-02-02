/**
 * Example: Using Optimistic Updates with DealFormGenerator
 * 
 * This example shows how to integrate optimistic updates in a form component
 */

'use client'

import { useState } from 'react'
import { useOptimisticUpdate, useSimpleOptimisticUpdate } from '@/hooks/useOptimisticUpdate'
import { DealFormGenerator } from '@/components/generative-ui/DealFormGenerator'

interface Deal {
    id: string
    title: string
    value: number
    tags: string[]
}

export function DealFormWithOptimisticUpdate() {
    const [deals, setDeals] = useState<Deal[]>([])

    const {
        data: optimisticDeals,
        isPending,
        executeUpdate,
    } = useOptimisticUpdate(deals)

    const handleDealCreated = async (dealData: Partial<Deal>) => {
        // Create optimistic deal
        const optimisticDeal: Deal = {
            id: `temp_${Date.now()}`,
            title: dealData.title || 'Novo Negócio',
            value: dealData.value || 0,
            tags: dealData.tags || [],
        }

        const newDeals = [...deals, optimisticDeal]

        try {
            // Execute with optimistic update
            const result = await executeUpdate(
                newDeals,
                async (data) => {
                    // Actual API call
                    const response = await fetch('/api/v1/deals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dealData),
                    })

                    if (!response.ok) {
                        throw new Error('Failed to create deal')
                    }

                    return response.json()
                },
                {
                    originalData: deals,
                    onSuccess: () => {
                        // Update state with real deals on success
                        // In practice, refetch or use  returned data
                        console.log('Deal created successfully')
                    },
                    onRollback: () => {
                        console.log('Deal creation failed, rolled back to original state')
                    },
                    onError: (error) => {
                        console.error('Failed to create deal:', error)
                        // Show error toast to user
                    },
                }
            )

            return result
        } catch (error) {
            // Error handled by optimistic update system
            return null
        }
    }

    return (
        <div>
            {/* Show loading indicator */}
            {isPending && (
                <div className="fixed top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
                    Salvando negócio...
                </div>
            )}

            {/* Show optimistic deals list */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Negócios ({optimisticDeals.length})</h2>
                <div className="space-y-2">
                    {optimisticDeals.map(deal => (
                        <div
                            key={deal.id}
                            className={`p-4 border rounded-lg ${deal.id.startsWith('temp_') ? 'opacity-50' : ''
                                }`}
                        >
                            <h3 className="font-semibold">{deal.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                R$ {deal.value.toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Deal form with optimistic update */}
            <DealFormGenerator
                prefill={{}}
                quickCreate={false}
                onInteraction={(action, component, data) => {
                    if (action === 'deal_created') {
                        handleDealCreated(data)
                    }
                }}
            />
        </div>
    )
}

/**
 * Example: Simple Optimistic Update with Like Button
 */
export function LikeButtonExample() {
    const [likes, setLikes] = useState(42)
    const { isPending, execute } = useSimpleOptimisticUpdate()

    const handleLike = () => {
        execute(
            // Optimistic update
            () => setLikes(prev => prev + 1),

            // Actual operation
            async () => {
                await fetch('/api/v1/posts/123/like', {
                    method: 'POST',
                })
            },

            // Rollback
            () => setLikes(prev => prev - 1)
        )
    }

    return (
        <button onClick={handleLike} disabled={isPending}>
            ❤️ {likes} {isPending && '...'}
        </button>
    )
}
