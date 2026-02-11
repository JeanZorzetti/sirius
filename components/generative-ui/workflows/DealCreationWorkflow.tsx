'use client'

import React from 'react'
import { type WorkflowDefinition } from '@/lib/generative-ui/workflow-engine'
import { useWorkflow } from '@/hooks/useWorkflow'
import { WorkflowProgress } from './WorkflowProgress'
import { WorkflowNav } from './WorkflowNav'
import { DynamicUIComponent } from '@/components/generative-ui/DynamicUIComponent'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'

// Deal Creation Workflow Definition
export const dealCreationWorkflowDefinition: WorkflowDefinition = {
    id: 'deal-creation',
    name: 'Create New Deal',
    description: 'Guide users through creating a new deal step-by-step',
    steps: [
        {
            id: 'deal-info',
            title: 'Deal Information',
            description: 'Enter basic deal details',
            componentName: 'DealFormGenerator',
            componentProps: {
                fields: ['name', 'value', 'expectedCloseDate'],
                compact: false,
            },
            validation: (data: any) => {
                if (!data.name || data.name.trim() === '') {
                    return 'Deal name is required'
                }
                if (!data.value || data.value <= 0) {
                    return 'Deal value must be greater than zero'
                }
                if (!data.expectedCloseDate) {
                    return 'Expected close date is required'
                }
                return true
            },
        },
        {
            id: 'contact',
            title: 'Select Contact',
            description: 'Choose the primary contact for this deal',
            componentName: 'ContactSelector',
            canSkip: true,
        },
        {
            id: 'pipeline',
            title: 'Pipeline & Stage',
            description: 'Assign deal to pipeline and stage',
            componentName: 'PipelineStageSelector',
            validation: (data: any) => {
                if (!data.pipelineId) return 'Please select a pipeline'
                if (!data.stageId) return 'Please select a stage'
                return true
            },
        },
        {
            id: 'custom-fields',
            title: 'Additional Details',
            description: 'Fill in custom fields (optional)',
            componentName: 'CustomFieldsForm',
            canSkip: true,
        },
        {
            id: 'review',
            title: 'Review & Create',
            description: 'Review your deal before creating',
            componentName: 'DealReviewCard',
        },
    ],
}

export interface DealCreationWorkflowProps {
    onComplete?: (dealData: any) => void | Promise<void>
    onCancel?: () => void
}

/**
 * Deal Creation Workflow Component
 * 
 * 5-step guided workflow for creating deals:
 * 1. Deal Info (name, value, close date)
 * 2. Contact Selection (optional)
 * 3. Pipeline & Stage
 * 4. Custom Fields (optional)
 * 5. Review & Create
 */
export function DealCreationWorkflow({ onComplete, onCancel }: DealCreationWorkflowProps) {
    const workflow = useWorkflow('deal-creation', dealCreationWorkflowDefinition, {
        onComplete: async (data) => {
            await onComplete?.(data)
        },
        onStepChange: (step) => {
        },
    })

    if (!workflow.currentStep) {
        return <div>Loading workflow...</div>
    }

    if (workflow.isCompleted) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                        <CardTitle>Deal Created Successfully!</CardTitle>
                    </div>
                    <CardDescription>
                        Your new deal has been created and saved.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Create New Deal</h1>
                <p className="text-muted-foreground mt-1">
                    Follow these steps to create a new deal in your CRM
                </p>
            </div>

            {/* Progress Indicator */}
            <WorkflowProgress
                steps={dealCreationWorkflowDefinition.steps}
                currentStepId={workflow.state?.currentStepId}
                completedSteps={workflow.state?.completedSteps}
                variant="steps"
            />

            {/* Current Step */}
            <Card>
                <CardHeader>
                    <CardTitle>{workflow.currentStep.title}</CardTitle>
                    {workflow.currentStep.description && (
                        <CardDescription>{workflow.currentStep.description}</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Error Alert */}
                    {workflow.error && (
                        <Alert variant="destructive">
                            <AlertDescription>{workflow.error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Step Component */}
                    <DynamicUIComponent
                        name={workflow.currentStep.componentName}
                        props={workflow.currentStep.componentProps || {}}
                    />

                    {/* Navigation */}
                    <WorkflowNav
                        canGoBack={workflow.canGoBack}
                        canGoNext={workflow.canGoNext}
                        canSkip={workflow.canSkip}
                        isLoading={workflow.isLoading}
                        isCompleted={workflow.isCompleted}
                        onBack={workflow.goBack}
                        onNext={(data) => workflow.goNext(data || {})}
                        onSkip={workflow.skip}
                    />
                </CardContent>
            </Card>

            {/* Cancel Button */}
            {onCancel && (
                <div className="text-center">
                    <button
                        onClick={onCancel}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Cancel and go back
                    </button>
                </div>
            )}
        </div>
    )
}
