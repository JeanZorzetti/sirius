'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, SkipForward, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WorkflowNavProps {
    canGoBack?: boolean
    canGoNext?: boolean
    canSkip?: boolean
    isCompleted?: boolean
    isLoading?: boolean
    onBack?: () => void
    onNext?: (data?: any) => void | Promise<void>
    onSkip?: () => void
    nextLabel?: string
    backLabel?: string
    skipLabel?: string
    finishLabel?: string
    className?: string
}

/**
 * Workflow Navigation Controls
 * 
 * Provides Back, Next, Skip, and Finish buttons for workflow navigation.
 */
export function WorkflowNav({
    canGoBack = false,
    canGoNext = true,
    canSkip = false,
    isCompleted = false,
    isLoading = false,
    onBack,
    onNext,
    onSkip,
    nextLabel = 'Next',
    backLabel = 'Back',
    skipLabel = 'Skip',
    finishLabel = 'Finish',
    className,
}: WorkflowNavProps) {
    return (
        <div className={cn('flex items-center justify-between gap-4', className)}>
            {/* Back button */}
            <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={!canGoBack || isLoading}
                className={cn(!canGoBack && 'invisible')}
            >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {backLabel}
            </Button>

            <div className="flex items-center gap-2">
                {/* Skip button */}
                {canSkip && !isCompleted && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onSkip}
                        disabled={isLoading}
                    >
                        <SkipForward className="w-4 h-4 mr-2" />
                        {skipLabel}
                    </Button>
                )}

                {/* Next/Finish button */}
                <Button
                    type="submit"
                    onClick={() => onNext?.()}
                    disabled={!canGoNext || isLoading || isCompleted}
                    className="min-w-24"
                >
                    {isLoading ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Processing...
                        </>
                    ) : isCompleted ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Completed
                        </>
                    ) : !canGoNext ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            {finishLabel}
                        </>
                    ) : (
                        <>
                            {nextLabel}
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
