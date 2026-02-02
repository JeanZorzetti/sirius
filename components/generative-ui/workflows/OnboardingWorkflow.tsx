'use client'

import React from 'react'
import { type WorkflowDefinition } from '@/lib/generative-ui/workflow-engine'
import { useWorkflow } from '@/hooks/useWorkflow'
import { WorkflowProgress } from './WorkflowProgress'
import { WorkflowNav } from './WorkflowNav'
import { DynamicUIComponent } from '@/components/generative-ui/DynamicUIComponent'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PartyPopper } from 'lucide-react'

// Onboarding Workflow Definition
export const onboardingWorkflowDefinition: WorkflowDefinition = {
    id: 'user-onboarding',
    name: 'Welcome to CRM',
    description: 'Quick setup to get you started',
    steps: [
        {
            id: 'welcome',
            title: 'Welcome!',
            description: 'Learn about your new CRM',
            componentName: 'WelcomeCard',
            componentProps: {
                title: 'Welcome to Sirius CRM!',
                subtitle: 'Let\'s get you set up in 4 quick steps',
            },
        },
        {
            id: 'profile',
            title: 'Your Profile',
            description: 'Tell us about yourself',
            componentName: 'ProfileSetupForm',
            validation: (data: any) => {
                if (!data.displayName || data.displayName.trim() === '') {
                    return 'Please enter your name'
                }
                if (!data.role) {
                    return 'Please select your role'
                }
                return true
            },
        },
        {
            id: 'integrations',
            title: 'Connect Tools',
            description: 'Optional integrations',
            componentName: 'IntegrationSetup',
            canSkip: true,
        },
        {
            id: 'first-deal',
            title: 'Create Your First Deal',
            description: 'Let\'s create your first deal together',
            componentName: 'DealFormGenerator',
            componentProps: {
                simplified: true,
                fields: ['name', 'value'],
            },
            canSkip: true,
        },
    ],
    onComplete: async (data) => {
        console.log('[OnboardingWorkflow] User onboarded:', data)
        // Mark onboarding as complete in backend
    },
}

export interface OnboardingWorkflowProps {
    onComplete?: () => void | Promise<void>
}

/**
 * User Onboarding Workflow
 * 
 * 4-step guided onboarding experience:
 * 1. Welcome (intro)
 * 2. Profile Setup (name, role)
 * 3. Integrations (optional)
 * 4. First Deal (optional)
 */
export function OnboardingWorkflow({ onComplete }: OnboardingWorkflowProps) {
    const workflow = useWorkflow('user-onboarding', onboardingWorkflowDefinition, {
        onComplete: async () => {
            await onComplete?.()
        },
    })

    if (!workflow.currentStep) {
        return <div>Loading...</div>
    }

    if (workflow.isCompleted) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                        <PartyPopper className="w-10 h-10 text-primary" />
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold">You're all set!</h2>
                    <p className="text-muted-foreground mt-2">
                        Welcome to Sirius CRM. Start exploring your dashboard.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 py-8">
            {/* Progress */}
            <WorkflowProgress
                steps={onboardingWorkflowDefinition.steps}
                currentStepId={workflow.state?.currentStepId}
                completedSteps={workflow.state?.completedSteps}
                variant="bar"
                progress={workflow.progress}
            />

            {/* Current Step */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{workflow.currentStep.title}</CardTitle>
                            {workflow.currentStep.description && (
                                <CardDescription className="mt-1">
                                    {workflow.currentStep.description}
                                </CardDescription>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Step {(workflow.state?.completedSteps.length ?? 0) + 1} of {onboardingWorkflowDefinition.steps.length}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {workflow.error && (
                        <Alert variant="destructive">
                            <AlertDescription>{workflow.error}</AlertDescription>
                        </Alert>
                    )}

                    <DynamicUIComponent
                        name={workflow.currentStep.componentName}
                        props={workflow.currentStep.componentProps || {}}
                    />

                    <WorkflowNav
                        canGoBack={workflow.canGoBack}
                        canGoNext={workflow.canGoNext}
                        canSkip={workflow.canSkip}
                        isLoading={workflow.isLoading}
                        isCompleted={workflow.isCompleted}
                        onBack={workflow.goBack}
                        onNext={(data) => workflow.goNext(data || {})}
                        onSkip={workflow.skip}
                        nextLabel={workflow.canGoNext ? 'Continue' : 'Finish'}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
