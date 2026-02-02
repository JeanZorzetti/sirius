'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export interface WorkflowProgressProps {
    steps?: { id: string; title: string }[]
    currentStepId?: string
    completedSteps?: string[]
    variant?: 'steps' | 'bar' | 'dots' | 'compact'
    progress?: number
    className?: string
}

/**
 * Workflow Progress Indicator
 * 
 * Displays workflow progress in various styles:
 * - steps: Numbered step indicators with lines
 * - bar: Linear progress bar
 * - dots: Minimal dot indicators
 * - compact: Text-only "Step X of Y"
 */
export function WorkflowProgress({
    steps = [],
    currentStepId,
    completedSteps = [],
    variant = 'steps',
    progress = 0,
    className,
}: WorkflowProgressProps) {
    if (variant === 'bar') {
        return (
            <div className={cn('w-full', className)}>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{progress}% complete</span>
                    {steps.length > 0 && (
                        <span>{completedSteps.length} of {steps.length} steps</span>
                    )}
                </div>
                <Progress value={progress} className="h-2" />
            </div>
        )
    }

    if (variant === 'compact') {
        const currentIndex = steps.findIndex(s => s.id === currentStepId)
        return (
            <div className={cn('text-sm text-muted-foreground', className)}>
                Step {currentIndex + 1} of {steps.length}
            </div>
        )
    }

    if (variant === 'dots') {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                {steps.map((step, idx) => {
                    const isCompleted = completedSteps.includes(step.id)
                    const isCurrent = step.id === currentStepId

                    return (
                        <div
                            key={step.id}
                            className={cn(
                                'h-2 rounded-full transition-all',
                                isCompleted && 'w-8 bg-primary',
                                isCurrent && 'w-6 bg-primary/60',
                                !isCompleted && !isCurrent && 'w-2 bg-muted'
                            )}
                        />
                    )
                })}
            </div>
        )
    }

    // Default: steps variant
    return (
        <div className={cn('w-full', className)}>
            <div className="flex items-center justify-between">
                {steps.map((step, idx) => {
                    const isCompleted = completedSteps.includes(step.id)
                    const isCurrent = step.id === currentStepId
                    const isLast = idx === steps.length - 1

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step indicator */}
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className={cn(
                                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                                        isCompleted && 'bg-primary border-primary text-primary-foreground',
                                        isCurrent && !isCompleted && 'border-primary bg-background text-primary',
                                        !isCompleted && !isCurrent && 'border-muted bg-muted/20 text-muted-foreground'
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-semibold">{idx + 1}</span>
                                    )}
                                </div>

                                <div className="text-center max-w-24">
                                    <p
                                        className={cn(
                                            'text-xs truncate',
                                            isCurrent && 'font-semibold text-foreground',
                                            !isCurrent && 'text-muted-foreground'
                                        )}
                                    >
                                        {step.title}
                                    </p>
                                </div>
                            </div>

                            {/* Connector line */}
                            {!isLast && (
                                <div
                                    className={cn(
                                        'h-[2px] flex-1 mx-2 transition-colors',
                                        isCompleted ? 'bg-primary' : 'bg-muted'
                                    )}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
