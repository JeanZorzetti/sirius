import { describe, it, expect, beforeEach } from 'vitest'
import { WorkflowEngine, type WorkflowDefinition } from '../workflow-engine'

describe('WorkflowEngine', () => {
    let engine: WorkflowEngine
    let mockWorkflow: WorkflowDefinition

    beforeEach(() => {
        // Clear localStorage to prevent test contamination
        if (typeof window !== 'undefined') {
            localStorage.clear()
        }

        engine = new WorkflowEngine()

        mockWorkflow = {
            id: 'test-workflow',
            name: 'Test Workflow',
            steps: [
                { id: 'step1', title: 'Step 1', componentName: 'TestComponent1' },
                { id: 'step2', title: 'Step 2', componentName: 'TestComponent2', canSkip: true },
                { id: 'step3', title: 'Step 3', componentName: 'TestComponent3' },
            ],
        }
    })

    describe('Workflow Registration', () => {
        it('should register a workflow definition', () => {
            expect(() => engine.registerWorkflow(mockWorkflow)).not.toThrow()
        })

        it('should throw error for workflow without steps', () => {
            const invalid = { id: 'invalid', name: 'Invalid', steps: [] }
            expect(() => engine.registerWorkflow(invalid)).toThrow()
        })
    })

    describe('Workflow Initialization', () => {
        it('should start a new workflow', () => {
            engine.registerWorkflow(mockWorkflow)
            const state = engine.startWorkflow('test-workflow')

            expect(state.workflowId).toBe('test-workflow')
            expect(state.currentStepId).toBe('step1')
            expect(state.completedSteps).toEqual([])
            expect(state.completed).toBe(false)
        })

        it('should initialize with initial data', () => {
            engine.registerWorkflow(mockWorkflow)
            const state = engine.startWorkflow('test-workflow', { foo: 'bar' })

            expect(state.data.foo).toBe('bar')
        })

        it('should return existing state if already started', () => {
            engine.registerWorkflow(mockWorkflow)
            const state1 = engine.startWorkflow('test-workflow')
            const state2 = engine.startWorkflow('test-workflow')

            expect(state1).toEqual(state2)
        })
    })

    describe('Step Navigation', () => {
        it('should advance to next step', async () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')

            const result = await engine.nextStep('test-workflow', { field: 'value' })

            expect(result.success).toBe(true)
            expect(result.state.currentStepId).toBe('step2')
            expect(result.state.completedSteps).toContain('step1')
            expect(result.state.data.step1).toEqual({ field: 'value' })
        })

        it('should complete workflow on last step', async () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')

            await engine.nextStep('test-workflow', {})
            await engine.nextStep('test-workflow', {})
            const result = await engine.nextStep('test-workflow', {})

            expect(result.state.completed).toBe(true)
        })

        it('should go back to previous step', () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')
            engine.nextStep('test-workflow', {})

            const result = engine.previousStep('test-workflow')

            expect(result.success).toBe(true)
            expect(result.state.currentStepId).toBe('step1')
            expect(result.state.completedSteps).not.toContain('step1')
        })

        it('should not go back from first step', () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')

            const result = engine.previousStep('test-workflow')

            expect(result.success).toBe(false)
            expect(result.error).toContain('first step')
        })
    })

    describe('Step Validation', () => {
        it('should validate step data before advancing', async () => {
            const workflowWithValidation = {
                ...mockWorkflow,
                steps: [
                    {
                        id: 'step1',
                        title: 'Step 1',
                        componentName: 'Test',
                        validation: (data: any) => data.required !== undefined,
                    },
                    ...mockWorkflow.steps.slice(1),
                ],
            }

            engine.registerWorkflow(workflowWithValidation)
            engine.startWorkflow('test-workflow')

            // Should fail without required field
            const result1 = await engine.nextStep('test-workflow', {})
            expect(result1.success).toBe(false)

            // Should succeed with required field
            const result2 = await engine.nextStep('test-workflow', { required: 'value' })
            expect(result2.success).toBe(true)
        })

        it('should handle async validation', async () => {
            const workflowWithAsyncValidation = {
                ...mockWorkflow,
                steps: [
                    {
                        id: 'step1',
                        title: 'Step 1',
                        componentName: 'Test',
                        validation: async (data: any) => {
                            await new Promise(resolve => setTimeout(resolve, 10))
                            return data.valid === true
                        },
                    },
                    ...mockWorkflow.steps.slice(1),
                ],
            }

            engine.registerWorkflow(workflowWithAsyncValidation)
            engine.startWorkflow('test-workflow')

            const result = await engine.nextStep('test-workflow', { valid: true })
            expect(result.success).toBe(true)
        })

        it('should return error message from validation', async () => {
            const workflowWithCustomError = {
                ...mockWorkflow,
                steps: [
                    {
                        id: 'step1',
                        title: 'Step 1',
                        componentName: 'Test',
                        validation: () => 'Custom error message',
                    },
                    ...mockWorkflow.steps.slice(1),
                ],
            }

            engine.registerWorkflow(workflowWithCustomError)
            engine.startWorkflow('test-workflow')

            const result = await engine.nextStep('test-workflow', {})
            expect(result.success).toBe(false)
            expect(result.error).toBe('Custom error message')
        })
    })

    describe('Skip Functionality', () => {
        it('should skip skippable step', () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')
            engine.nextStep('test-workflow', {}) // Go to step2

            const result = engine.skipStep('test-workflow')

            expect(result.success).toBe(true)
            expect(result.state.currentStepId).toBe('step3')
            expect(result.state.skippedSteps).toContain('step2')
        })

        it('should not skip non-skippable step', () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')

            const result = engine.skipStep('test-workflow')

            expect(result.success).toBe(false)
            expect(result.error).toContain('cannot be skipped')
        })
    })

    describe('Progress Calculation', () => {
        it('should calculate progress correctly', async () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')

            expect(engine.getProgress('test-workflow')).toBe(0)

            await engine.nextStep('test-workflow', {})
            expect(engine.getProgress('test-workflow')).toBe(33)

            await engine.nextStep('test-workflow', {})
            expect(engine.getProgress('test-workflow')).toBe(67)

            await engine.nextStep('test-workflow', {})
            expect(engine.getProgress('test-workflow')).toBe(100)
        })
    })

    describe('Conditional Branching', () => {
        it('should support conditional next step', async () => {
            const branchingWorkflow: WorkflowDefinition = {
                id: 'branching',
                name: 'Branching',
                steps: [
                    {
                        id: 'step1',
                        title: 'Step 1',
                        componentName: 'Test',
                        next: (data: any) => (data.goToStep3 ? 'step3' : 'step2'),
                    },
                    { id: 'step2', title: 'Step 2', componentName: 'Test' },
                    { id: 'step3', title: 'Step 3', componentName: 'Test' },
                ],
            }

            engine.registerWorkflow(branchingWorkflow)

            // Branch to step3
            engine.startWorkflow('branching')
            const result = await engine.nextStep('branching', { goToStep3: true })
            expect(result.state.currentStepId).toBe('step3')

            // Reset and branch to step2
            engine.resetWorkflow('branching')
            const result2 = await engine.nextStep('branching', { goToStep3: false })
            expect(result2.state.currentStepId).toBe('step2')
        })
    })

    describe('Reset Workflow', () => {
        it('should reset workflow to beginning', async () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')
            await engine.nextStep('test-workflow', { data: 'value' })

            const resetState = engine.resetWorkflow('test-workflow')

            expect(resetState.currentStepId).toBe('step1')
            expect(resetState.completedSteps).toEqual([])
            expect(resetState.data).not.toHaveProperty('step1')
        })
    })

    describe('Data Management', () => {
        it('should update workflow data', () => {
            engine.registerWorkflow(mockWorkflow)
            engine.startWorkflow('test-workflow')

            engine.updateData('test-workflow', { custom: 'data' })
            const state = engine.getState('test-workflow')

            expect(state?.data.custom).toBe('data')
        })
    })
})
