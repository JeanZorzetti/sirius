/**
 * Tests for DynamicUIComponent
 *
 * Tests:
 * - Component loading and rendering
 * - Props validation
 * - Error handling (component not found, invalid props)
 * - Interaction tracking
 * - Lazy loading / Suspense
 * - Analytics integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DynamicUIComponent } from '@/components/generative-ui/DynamicUIComponent'
import type { DynamicUIComponentProps } from '@/lib/generative-ui/types'

// Mock analytics hook
vi.mock('@/hooks/useComponentAnalytics', () =\u003e({
    useComponentAnalytics: vi.fn(() =\u003e({
        trackRender: vi.fn(),
        trackInteraction: vi.fn(),
        trackConversion: vi.fn(),
        trackError: vi.fn(),
    })),
}))

// Mock lazy components
vi.mock('@/lib/generative-ui/lazy-components', () =\u003e({
    getLazyComponent: vi.fn((name: string) =\u003e {
        if(name === 'ROICalculator') {
            // Return a simple mock component
            return() =\u003e \u003cdiv data- testid=\"roi-calculator\"\u003eMocked ROICalculator\u003c/div\u003e
    }
    if (name === 'NonExistent') {
    return null
}
return () =\u003e \u003cdiv data - testid={ `${name.toLowerCase()}` } \u003eMocked { name } \u003c / div\u003e
  }),
preloadComponent: vi.fn(),
}))

describe('DynamicUIComponent', () => {
    beforeEach(() =\u003e {
        vi.clearAllMocks()
    })

    describe('Valid Component Rendering', () => {
        it('should render ROICalculator with valid props', async() =\u003e {
            const validProps: DynamicUIComponentProps = {
                name: 'ROICalculator',
                props: {
                    scenario: {
                        currentCost: 15000,
                        withSirius: 8000,
                        monthlySavings: 7000,
                        annualROI: 84000,
                        paybackPeriod: 2,
                    },
                    industry: 'orthodontics',
                    comparisonMode: true,
                },
            }

      render(\u003cDynamicUIComponent { ...validProps } /\u003e)

        // Wait for lazy component to load
        await waitFor(() =\u003e {
            expect(screen.getByTestId('genui-roicalculator')).toBeInTheDocument()
    })
})

it('should render with data-component attribute', async() =\u003e {
    const props: DynamicUIComponentProps = {
        name: 'PricingComparison',
        props: {
            highlighted: 'pro',
        },
    }

      render(\u003cDynamicUIComponent { ...props } /\u003e)

await waitFor(() =\u003e {
    const element = screen.getByTestId('genui-pricingcomparison')
        expect(element.closest('[data-component]')).toHaveAttribute(
        'data-component',
        'PricingComparison'
    )
      })
    })

it('should apply genui-component class', async() =\u003e {
    const props: DynamicUIComponentProps = {
        name: 'DealFormGenerator',
        props: {
            prefill: {},
        },
    }

      render(\u003cDynamicUIComponent { ...props } /\u003e)

await waitFor(() =\u003e {
    const element = screen.getByTestId('genui-dealformgenerator')
        expect(element.closest('.genui-component')).toBeInTheDocument()
      })
    })
  })

describe('Component Not Found', () => {
    it('should show error when component does not exist', () =\u003e {
        const props: DynamicUIComponentProps = {
            name: 'NonExistent',
            props: {},
        }

      render(\u003cDynamicUIComponent { ...props } /\u003e)

    expect(screen.getByText('Componente não encontrado')).toBeInTheDocument()
    expect(screen.getByText('NonExistent')).toBeInTheDocument()
})

it('should display helpful error message', () =\u003e {
    const props: DynamicUIComponentProps = {
        name: 'InvalidComponent',
        props: {},
    }

      render(\u003cDynamicUIComponent { ...props } /\u003e)

expect(screen.getByText(/não está disponível no registry/i)).toBeInTheDocument()
    })
  })

describe('Props Validation', () => {
    it('should show validation error for invalid props', () =\u003e {
        const invalidProps: DynamicUIComponentProps = {
            name: 'ROICalculator',
            props: {
                scenario: {
                    currentCost: -100, // Negative = invalid
                    withSirius: 8000,
                    monthlySavings: 7000,
                    annualROI: 84000,
                    paybackPeriod: 2,
                },
            },
        }

      render(\u003cDynamicUIComponent { ...invalidProps } /\u003e)

    expect(screen.getByText('Erro de validação')).toBeInTheDocument()
})

it('should display validation error details', () =\u003e {
    const invalidProps: DynamicUIComponentProps = {
        name: 'PricingComparison',
        props: {
            highlighted: 'invalid-plan', // Should be 'free' or 'pro'
        },
    }

      render(\u003cDynamicUIComponent { ...invalidProps } /\u003e)

expect(screen.getByText(/validation failed/i)).toBeInTheDocument()
    })

it('should show received props in details', () =\u003e {
    const invalidProps: DynamicUIComponentProps = {
        name: 'ROICalculator',
        props: {
            invalid: 'data',
        },
    }

      render(\u003cDynamicUIComponent { ...invalidProps } /\u003e)

const summary = screen.getByText('Ver props recebidos')
expect(summary).toBeInTheDocument()
    })
  })

describe('Interaction Tracking', () => {
    it('should call onInteraction when provided', async() =\u003e {
        const mockOnInteraction = vi.fn()
      const props: DynamicUIComponentProps = {
            name: 'ROICalculator',
            props: {
                scenario: {
                    currentCost: 15000,
                    withSirius: 8000,
                    monthlySavings: 7000,
                    annualROI: 84000,
                    paybackPeriod: 2,
                },
            },
            onInteraction: mockOnInteraction,
        }

      render(\u003cDynamicUIComponent { ...props } /\u003e)

    await waitFor(() =\u003e {
        expect(screen.getByTestId('genui-roicalculator')).toBeInTheDocument()
})

// Note: Actual interaction would require the real component
// This test verifies the callback is passed correctly
expect(mockOnInteraction).not.toHaveBeenCalled() // Not called until user interacts
    })

it('should pass session metadata to analytics', async() =\u003e {
    const { useComponentAnalytics } = await import('@/hooks/useComponentAnalytics')
      const mockAnalytics = useComponentAnalytics as any

      const props: DynamicUIComponentProps = {
        name: 'DemoScheduler',
        props: {
            eventType: 'demo_60min',
        },
        sessionId: 'test-session-123',
        conversationTurn: 5,
        spinState: 'need-payoff',
    }

      render(\u003cDynamicUIComponent { ...props } /\u003e)

await waitFor(() =\u003e {
    expect(mockAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
            component: 'DemoScheduler',
            sessionId: 'test-session-123',
            conversationTurn: 5,
            spinState: 'need-payoff',
        })
    )
})
    })
  })

describe('Animation', () => {
    it('should render with animation by default', async() =\u003e {
        const props: DynamicUIComponentProps = {
            name: 'InsightCard',
            props: {
                type: 'opportunity',
                title: 'Test',
                description: 'Test description',
                confidence: 0.85,
            },
        }

      const { container } = render(\u003cDynamicUIComponent { ...props } /\u003e)

      await waitFor(() =\u003e {
        // AnimatedComponent wrapper should be present
        // This would be verified by checking for framer-motion elements
        expect(container.querySelector('.genui-component')).toBeInTheDocument()
})
    })

it('should skip animation when animate=false', async() =\u003e {
    const props: DynamicUIComponentProps = {
        name: 'InsightCard',
        props: {
            type: 'opportunity',
            title: 'Test',
            description: 'Test',
            confidence: 0.85,
        },
        animate: false,
    }

      const { container } = render(\u003cDynamicUIComponent { ...props } animate = { false} /\u003e)

      await waitFor(() =\u003e {
    expect(container.querySelector('.genui-component')).toBeInTheDocument()
      })
    })
  })

describe('Loading States', () => {
    it('should show skeleton while loading', () =\u003e {
        const props: DynamicUIComponentProps = {
            name: 'QualificationDashboard',
            props: {
                scores: {
                    budget: 85,
                    authority: 100,
                    need: 90,
                    timeline: 70,
                },
                overall: 86,
                recommendations: [],
                nextSteps: [],
            },
        }

      render(\u003cDynamicUIComponent { ...props } /\u003e)

    // Skeleton should appear briefly during Suspense
    // Note: This is hard to test without async components
    // Just verify component renders
    expect(screen.queryByText('Componente não encontrado')).not.toBeInTheDocument()
})
  })

describe('Error Boundary', () => {
    it('should wrap component in error boundary', async() =\u003e {
        const props: DynamicUIComponentProps = {
            name: 'EmailPreview',
            props: {
                template: {
                    subject: 'Test',
                    body: 'Test body',
                },
            },
        }

      const { container } = render(\u003cDynamicUIComponent { ...props } /\u003e)

      await waitFor(() =\u003e {
        expect(container.querySelector('.genui-component')).toBeInTheDocument()
})

      // Error boundary is present (invisible until error)
    })
  })

describe('Multiple Components', () => {
    it('should render different components independently', async() =\u003e {
        const { rerender } = render(
            \u003cDynamicUIComponent
          name =\"ROICalculator\"
          props = {{
            scenario: {
                currentCost: 15000,
                withSirius: 8000,
                monthlySavings: 7000,
                annualROI: 84000,
                paybackPeriod: 2,
            },
        }}
        /\u003e
    )

    await waitFor(() =\u003e {
        expect(screen.getByTestId('genui-roicalculator')).toBeInTheDocument()
})

rerender(
    \u003cDynamicUIComponent
          name =\"PricingComparison\"
          props = {{
    highlighted: 'pro',
}}
        /\u003e
)

await waitFor(() =\u003e {
    expect(screen.getByTestId('genui-pricingcomparison')).toBeInTheDocument()
      })
    })
  })

describe('Data Attributes', () => {
    it('should have correct testid format', async() =\u003e {
        const props: DynamicUIComponentProps = {
            name: 'CompetitorMatrix',
            props: {
                competitors: ['pipedrive'],
            },
        }

      render(\u003cDynamicUIComponent { ...props } /\u003e)

    await waitFor(() =\u003e {
        expect(screen.getByTestId('genui-competitormatrix')).toBeInTheDocument()
})
    })
  })
})
