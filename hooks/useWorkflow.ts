'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    workflowEngine,
    type WorkflowDefinition,
    type WorkflowState,
    type WorkflowStep,
} from '@/lib/generative-ui/workflow-engine'

export interface UseWorkflowOptions {
    onComplete?: (data: Record<string, any>) => void | Promise<void>
    onStepChange?: (step: WorkflowStep) => void
    autoStart?: boolean
}

export interface UseWorkflowReturn {
    // State
    state: WorkflowState | null
    currentStep: WorkflowStep | null
    progress: number
    isLoading: boolean
    error: string | null

    // Capabilities
    canGoBack: boolean
    canGoNext: boolean
    canSkip: boolean
    isCompleted: boolean

    // Actions
    start: (initialData?: Record<string, any>) => void
    goNext: (stepData: Record<string, any>) => Promise<void>
    goBack: () => void
    skip: () => void
    reset: () => void
    updateData: (data: Record<string, any>) => void
    clearError: () => void
}

/**
 * React hook for managing workflow state
 * 
 * @example
 * ```tsx
 * const workflow = useWorkflow('deal-creation', dealCreationDefinition)
 * 
 * <div>
 *   <h1>{workflow.currentStep?.title}</h1>
 *   <WorkflowProgress progress={workflow.progress} />
 *   
 *   <DynamicUIComponent 
 *     name={workflow.currentStep?.componentName}
 *     props={workflow.currentStep?.componentProps}
 *   />
 *   
 *   <WorkflowNav
 *     canGoBack={workflow.canGoBack}
 *     canGoNext={workflow.canGoNext}
 *     onBack={workflow.goBack}
 *     onNext={(data) => workflow.goNext(data)}
 *   />
 * </div>
 * ```
 */
export function useWorkflow(
    workflowId: string,
    definition: WorkflowDefinition,
    options: UseWorkflowOptions = {}
): UseWorkflowReturn {
    const { onComplete, onStepChange, autoStart = true } = options

    const [state, setState] = useState<WorkflowState | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Register workflow definition
    useEffect(() => {
        workflowEngine.registerWorkflow(definition)
    }, [definition])

    // Load or start workflow
    useEffect(() => {
        const existingState = workflowEngine.getState(workflowId)

        if (existingState) {
            setState(existingState)
        } else if (autoStart) {
            const newState = workflowEngine.startWorkflow(workflowId)
            setState(newState)
        }
    }, [workflowId, autoStart])

    // Current step
    const currentStep = useMemo(() => {
        if (!state) return null
        return workflowEngine.getCurrentStep(workflowId)
    }, [workflowId, state?.currentStepId])

    // Progress
    const progress = useMemo(() => {
        return workflowEngine.getProgress(workflowId)
    }, [workflowId, state?.completedSteps.length])

    // Capabilities
    const canGoBack = useMemo(() => {
        if (!state || !definition) return false
        const currentIndex = definition.steps.findIndex(s => s.id === state.currentStepId)
        return currentIndex > 0
    }, [state?.currentStepId, definition])

    const canGoNext = useMemo(() => {
        return !state?.completed && currentStep !== null
    }, [state?.completed, currentStep])

    const canSkip = useMemo(() => {
        return currentStep?.canSkip || false
    }, [currentStep])

    const isCompleted = state?.completed || false

    // Actions
    const start = useCallback((initialData?: Record<string, any>) => {
        const newState = workflowEngine.startWorkflow(workflowId, initialData)
        setState(newState)
        setError(null)
    }, [workflowId])

    const goNext = useCallback(async (stepData: Record<string, any>) => {
        if (!state) return

        setIsLoading(true)
        setError(null)

        try {
            const result = await workflowEngine.nextStep(workflowId, stepData)

            if (result.success) {
                setState(result.state)

                // Call onStepChange if provided
                if (onStepChange) {
                    const nextStep = workflowEngine.getCurrentStep(workflowId)
                    if (nextStep) {
                        onStepChange(nextStep)
                    }
                }

                // Call onComplete if workflow finished
                if (result.state.completed && onComplete) {
                    await onComplete(result.state.data)
                }
            } else {
                setError(result.error || 'Failed to advance to next step')
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }, [workflowId, state, onComplete, onStepChange])

    const goBack = useCallback(() => {
        if (!state) return

        const result = workflowEngine.previousStep(workflowId)

        if (result.success) {
            setState(result.state)
            setError(null)

            if (onStepChange && currentStep) {
                onStepChange(currentStep)
            }
        } else {
            setError(result.error || 'Failed to go back')
        }
    }, [workflowId, state, currentStep, onStepChange])

    const skip = useCallback(() => {
        if (!state) return

        const result = workflowEngine.skipStep(workflowId)

        if (result.success) {
            setState(result.state)
            setError(null)

            if (onStepChange) {
                const nextStep = workflowEngine.getCurrentStep(workflowId)
                if (nextStep) {
                    onStepChange(nextStep)
                }
            }
        } else {
            setError(result.error || 'Failed to skip step')
        }
    }, [workflowId, state, onStepChange])

    const reset = useCallback(() => {
        const newState = workflowEngine.resetWorkflow(workflowId)
        setState(newState)
        setError(null)
    }, [workflowId])

    const updateData = useCallback((data: Record<string, any>) => {
        workflowEngine.updateData(workflowId, data)
        const updatedState = workflowEngine.getState(workflowId)
        if (updatedState) {
            setState(updatedState)
        }
    }, [workflowId])

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    return {
        // State
        state,
        currentStep,
        progress,
        isLoading,
        error,

        // Capabilities
        canGoBack,
        canGoNext,
        canSkip,
        isCompleted,

        // Actions
        start,
        goNext,
        goBack,
        skip,
        reset,
        updateData,
        clearError,
    }
}
