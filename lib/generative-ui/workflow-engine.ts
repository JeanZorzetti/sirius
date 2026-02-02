/**
 * Interactive Workflow Engine
 * 
 * State machine for multi-step workflows with validation, branching, and persistence.
 */

import { z } from 'zod'

// ============================================================================
// Types & Schemas
// ============================================================================

/**
 * Individual workflow step definition
 */
export interface WorkflowStep {
    id: string
    title: string
    description?: string
    componentName: string  // Component from registry
    componentProps?: Record<string, any>
    validation?: (data: any, allData: any) => boolean | Promise<boolean> | string
    next?: string | ((data: any, allData: any) => string)  // Next step ID or function
    canSkip?: boolean
    onComplete?: (data: any, allData: any) => void | Promise<void>
}

/**
 * Complete workflow definition
 */
export interface WorkflowDefinition {
    id: string
    name: string
    description?: string
    steps: WorkflowStep[]
    initialData?: Record<string, any>
    onComplete?: (data: Record<string, any>) => void | Promise<void>
}

/**
 * Current workflow state
 */
export interface WorkflowState {
    workflowId: string
    currentStepId: string
    completedSteps: string[]
    skippedSteps: string[]
    data: Record<string, any>
    errors: Record<string, string>
    startedAt: number
    lastUpdated: number
    completed: boolean
}

// ============================================================================
// Workflow Engine
// ============================================================================

export class WorkflowEngine {
    private workflows: Map<string, WorkflowDefinition> = new Map()
    private states: Map<string, WorkflowState> = new Map()
    private storageKey = 'workflow-states'

    constructor() {
        this.loadFromStorage()
    }

    /**
     * Register a workflow definition
     */
    registerWorkflow(definition: WorkflowDefinition): void {
        if (!definition.steps || definition.steps.length === 0) {
            throw new Error(`Workflow "${definition.id}" must have at least one step`)
        }

        this.workflows.set(definition.id, definition)
    }

    /**
     * Start or resume a workflow
     */
    startWorkflow(workflowId: string, initialData?: Record<string, any>): WorkflowState {
        const definition = this.workflows.get(workflowId)
        if (!definition) {
            throw new Error(`Workflow "${workflowId}" not found. Did you register it?`)
        }

        // Check if already exists
        const existing = this.states.get(workflowId)
        if (existing && !existing.completed) {
            return existing
        }

        // Create new state
        const state: WorkflowState = {
            workflowId,
            currentStepId: definition.steps[0].id,
            completedSteps: [],
            skippedSteps: [],
            data: initialData || definition.initialData || {},
            errors: {},
            startedAt: Date.now(),
            lastUpdated: Date.now(),
            completed: false,
        }

        this.states.set(workflowId, state)
        this.saveToStorage()

        return state
    }

    /**
     * Get current workflow state
     */
    getState(workflowId: string): WorkflowState | null {
        return this.states.get(workflowId) || null
    }

    /**
     * Get current step definition
     */
    getCurrentStep(workflowId: string): WorkflowStep | null {
        const state = this.getState(workflowId)
        if (!state) return null

        const definition = this.workflows.get(workflowId)
        if (!definition) return null

        return definition.steps.find(s => s.id === state.currentStepId) || null
    }

    /**
     * Calculate workflow progress (0-100)
     */
    getProgress(workflowId: string): number {
        const state = this.getState(workflowId)
        if (!state) return 0

        const definition = this.workflows.get(workflowId)
        if (!definition) return 0

        if (state.completed) return 100

        const totalSteps = definition.steps.length
        const completedSteps = state.completedSteps.length

        return Math.round((completedSteps / totalSteps) * 100)
    }

    /**
     * Advance to next step
     */
    async nextStep(
        workflowId: string,
        stepData: Record<string, any>
    ): Promise<{ success: boolean; error?: string; state: WorkflowState }> {
        const state = this.getState(workflowId)
        if (!state) {
            return { success: false, error: 'Workflow not found', state: state! }
        }

        if (state.completed) {
            return { success: false, error: 'Workflow already completed', state }
        }

        const definition = this.workflows.get(workflowId)
        if (!definition) {
            return { success: false, error: 'Workflow definition not found', state }
        }

        const currentStep = this.getCurrentStep(workflowId)
        if (!currentStep) {
            return { success: false, error: 'Current step not found', state }
        }

        // Validate step data
        if (currentStep.validation) {
            try {
                const result = await currentStep.validation(stepData, state.data)
                if (result === false) {
                    return { success: false, error: 'Validation failed', state }
                }
                if (typeof result === 'string') {
                    return { success: false, error: result, state }
                }
            } catch (error: any) {
                return { success: false, error: error.message || 'Validation error', state }
            }
        }

        // Merge step data
        state.data = { ...state.data, [currentStep.id]: stepData }
        state.completedSteps.push(currentStep.id)
        state.lastUpdated = Date.now()

        // Run onComplete callback
        if (currentStep.onComplete) {
            try {
                await currentStep.onComplete(stepData, state.data)
            } catch (error) {
                console.error(`[WorkflowEngine] onComplete error for step ${currentStep.id}:`, error)
            }
        }

        // Determine next step
        const nextStepId = this.getNextStepId(definition, currentStep, state.data)

        if (!nextStepId) {
            // Workflow complete
            state.completed = true
            state.currentStepId = currentStep.id // Stay on last step

            if (definition.onComplete) {
                try {
                    await definition.onComplete(state.data)
                } catch (error) {
                    console.error(`[WorkflowEngine] onComplete error for workflow ${workflowId}:`, error)
                }
            }
        } else {
            state.currentStepId = nextStepId
        }

        this.states.set(workflowId, state)
        this.saveToStorage()

        return { success: true, state }
    }

    /**
     * Go back to previous step
     */
    previousStep(workflowId: string): { success: boolean; error?: string; state: WorkflowState } {
        const state = this.getState(workflowId)
        if (!state) {
            return { success: false, error: 'Workflow not found', state: state! }
        }

        const definition = this.workflows.get(workflowId)
        if (!definition) {
            return { success: false, error: 'Workflow definition not found', state }
        }

        const currentIndex = definition.steps.findIndex(s => s.id === state.currentStepId)
        if (currentIndex <= 0) {
            return { success: false, error: 'Already at first step', state }
        }

        // Move to previous step
        const previousStep = definition.steps[currentIndex - 1]
        state.currentStepId = previousStep.id

        // Remove from completed if it was completed
        state.completedSteps = state.completedSteps.filter(id => id !== previousStep.id)
        state.skippedSteps = state.skippedSteps.filter(id => id !== previousStep.id)
        state.completed = false
        state.lastUpdated = Date.now()

        this.states.set(workflowId, state)
        this.saveToStorage()

        return { success: true, state }
    }

    /**
     * Skip current step (if allowed)
     */
    skipStep(workflowId: string): { success: boolean; error?: string; state: WorkflowState } {
        const state = this.getState(workflowId)
        if (!state) {
            return { success: false, error: 'Workflow not found', state: state! }
        }

        const currentStep = this.getCurrentStep(workflowId)
        if (!currentStep) {
            return { success: false, error: 'Current step not found', state }
        }

        if (!currentStep.canSkip) {
            return { success: false, error: 'This step cannot be skipped', state }
        }

        const definition = this.workflows.get(workflowId)
        if (!definition) {
            return { success: false, error: 'Workflow definition not found', state }
        }

        // Mark as skipped
        state.skippedSteps.push(currentStep.id)
        state.lastUpdated = Date.now()

        // Determine next step
        const nextStepId = this.getNextStepId(definition, currentStep, state.data)

        if (!nextStepId) {
            state.completed = true
        } else {
            state.currentStepId = nextStepId
        }

        this.states.set(workflowId, state)
        this.saveToStorage()

        return { success: true, state }
    }

    /**
     * Reset workflow to beginning
     */
    resetWorkflow(workflowId: string): WorkflowState {
        this.states.delete(workflowId)
        this.saveToStorage()
        return this.startWorkflow(workflowId)
    }

    /**
     * Update workflow data without advancing steps
     */
    updateData(workflowId: string, data: Record<string, any>): void {
        const state = this.getState(workflowId)
        if (!state) return

        state.data = { ...state.data, ...data }
        state.lastUpdated = Date.now()

        this.states.set(workflowId, state)
        this.saveToStorage()
    }

    /**
     * Clear workflow state
     */
    clearWorkflow(workflowId: string): void {
        this.states.delete(workflowId)
        this.saveToStorage()
    }

    // ============================================================================
    // Private helpers
    // ============================================================================

    private getNextStepId(
        definition: WorkflowDefinition,
        currentStep: WorkflowStep,
        data: Record<string, any>
    ): string | null {
        if (currentStep.next) {
            if (typeof currentStep.next === 'function') {
                return currentStep.next(data[currentStep.id], data)
            }
            return currentStep.next
        }

        // Default: next step in array
        const currentIndex = definition.steps.findIndex(s => s.id === currentStep.id)
        const nextStep = definition.steps[currentIndex + 1]
        return nextStep?.id || null
    }

    private saveToStorage(): void {
        if (typeof window === 'undefined') return

        try {
            const data = Array.from(this.states.entries())
            localStorage.setItem(this.storageKey, JSON.stringify(data))
        } catch (error) {
            console.error('[WorkflowEngine] Failed to save to localStorage:', error)
        }
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined') return

        try {
            const data = localStorage.getItem(this.storageKey)
            if (data) {
                const entries = JSON.parse(data)
                this.states = new Map(entries)
            }
        } catch (error) {
            console.error('[WorkflowEngine] Failed to load from localStorage:', error)
        }
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const workflowEngine = new WorkflowEngine()
