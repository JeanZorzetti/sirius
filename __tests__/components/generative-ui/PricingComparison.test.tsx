/**
 * PricingComparison Component Tests
 * 
 * Tests for pricing table comparison between FREE and PRO plans
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PricingComparison } from '@/components/generative-ui/PricingComparison'
import type { PricingComparisonProps } from '@/lib/generative-ui/schemas'

describe('PricingComparison', () => {
    const defaultProps: PricingComparisonProps = {
        highlighted: 'pro',
        emphasize_features: [],
        show_roi_badge: false,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render pricing comparison component', () => {
            render(<PricingComparison {...defaultProps} />)

            expect(screen.getByTestId('pricing-comparison')).toBeInTheDocument()
            expect(screen.getByText('Comparativo de Planos')).toBeInTheDocument()
        })

        it('should display FREE and PRO plan headers', () => {
            render(<PricingComparison {...defaultProps} />)

            expect(screen.getByText('FREE')).toBeInTheDocument()
            expect(screen.getByText('PRO')).toBeInTheDocument()
            expect(screen.getByText('R$ 0')).toBeInTheDocument()
            expect(screen.getByText('R$ 147')).toBeInTheDocument()
        })

        it('should render all 10 features', () => {
            render(<PricingComparison {...defaultProps} />)

            expect(screen.getByText('Contatos')).toBeInTheDocument()
            expect(screen.getByText('Pipelines')).toBeInTheDocument()
            expect(screen.getByText('Negócios')).toBeInTheDocument()
            expect(screen.getByText('Acesso à API')).toBeInTheDocument()
            expect(screen.getByText('AGI Sirius')).toBeInTheDocument()
            expect(screen.getByText('Automações')).toBeInTheDocument()
            expect(screen.getByText('Integrações')).toBeInTheDocument()
            expect(screen.getByText('Suporte')).toBeInTheDocument()
            expect(screen.getByText('Analytics')).toBeInTheDocument()
            expect(screen.getByText('Exportação')).toBeInTheDocument()
        })

        it('should render CTA buttons', () => {
            render(<PricingComparison {...defaultProps} />)

            expect(screen.getByRole('button', { name: /Começar Grátis/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Assinar PRO/i })).toBeInTheDocument()
        })
    })

    describe('Plan Highlighting', () => {
        it('should highlight FREE plan when specified', () => {
            render(<PricingComparison {...defaultProps} highlighted="free" />)

            const freeSection = screen.getByText('FREE').closest('div')
            expect(freeSection).toHaveClass('bg-primary/5')
        })

        it('should highlight PRO plan when specified', () => {
            render(<PricingComparison {...defaultProps} highlighted="pro" />)

            const proSection = screen.getByText('PRO').closest('div')
            expect(proSection).toHaveClass('bg-primary/10')
        })

        it('should show "Recomendado" badge when PRO is highlighted', () => {
            render(<PricingComparison {...defaultProps} highlighted="pro" />)

            expect(screen.getByText('Recomendado')).toBeInTheDocument()
        })

        it('should not show "Recomendado" badge when FREE is highlighted', () => {
            render(<PricingComparison {...defaultProps} highlighted="free" />)

            expect(screen.queryByText('Recomendado')).not.toBeInTheDocument()
        })
    })

    describe('Feature Emphasis', () => {
        it('should emphasize specified features', () => {
            render(
                <PricingComparison
                    {...defaultProps}
                    emphasize_features={['contacts', 'agi_assistant']}
                />
            )

            const contactsRow = screen.getByText('Contatos').closest('div')
            const agiRow = screen.getByText('AGI Sirius').closest('div')

            expect(contactsRow).toHaveClass('bg-yellow-50')
            expect(agiRow).toHaveClass('bg-yellow-50')
        })

        it('should not emphasize non-specified features', () => {
            render(
                <PricingComparison
                    {...defaultProps}
                    emphasize_features={['contacts']}
                />
            )

            const pipelinesRow = screen.getByText('Pipelines').closest('div')
            expect(pipelinesRow).not.toHaveClass('bg-yellow-50')
        })
    })

    describe('ROI Badge', () => {
        it('should show ROI badge when enabled', () => {
            render(<PricingComparison {...defaultProps} show_roi_badge={true} />)

            expect(screen.getByText('Melhor ROI')).toBeInTheDocument()
        })

        it('should not show ROI badge when disabled', () => {
            render(<PricingComparison {...defaultProps} show_roi_badge={false} />)

            expect(screen.queryByText('Melhor ROI')).not.toBeInTheDocument()
        })
    })

    describe('Annual Savings', () => {
        it('should display annual savings when provided', () => {
            render(
                <PricingComparison {...defaultProps} annual_savings={12000} />
            )

            expect(screen.getByText('Economia Anual Estimada')).toBeInTheDocument()
            expect(screen.getByText(/R\$\s*12\.000/)).toBeInTheDocument()
        })

        it('should not display annual savings when not provided', () => {
            render(<PricingComparison {...defaultProps} />)

            expect(screen.queryByText('Economia Anual Estimada')).not.toBeInTheDocument()
        })

        it('should not display annual savings when zero', () => {
            render(<PricingComparison {...defaultProps} annual_savings={0} />)

            expect(screen.queryByText('Economia Anual Estimada')).not.toBeInTheDocument()
        })

        it('should format large savings numbers correctly', () => {
            render(
                <PricingComparison {...defaultProps} annual_savings={150000} />
            )

            expect(screen.getByText(/R\$\s*150\.000/)).toBeInTheDocument()
        })
    })

    describe('Feature Values', () => {
        it('should display text values correctly', () => {
            render(<PricingComparison {...defaultProps} />)

            // Check text values
            expect(screen.getByText('100')).toBeInTheDocument() // FREE contacts
            expect(screen.getByText('Ilimitados')).toBeInTheDocument() // PRO contacts
            expect(screen.getByText('Email')).toBeInTheDocument() // FREE support
            expect(screen.getByText('Prioritário')).toBeInTheDocument() // PRO support
        })

        it('should render boolean values as icons', () => {
            const { container } = render(<PricingComparison {...defaultProps} />)

            // API Access: FREE = false (X icon), PRO = true (Check icon)
            const apiRow = screen.getByText('Acesso à API').closest('div')?.parentElement

            if (apiRow) {
                const cells = within(apiRow).getAllByRole('cell', { hidden: true })
                // Should have X icon for FREE and Check icon for PRO
                expect(apiRow.querySelector('.lucide-x')).toBeInTheDocument()
                expect(apiRow.querySelector('.lucide-check')).toBeInTheDocument()
            }
        })
    })

    describe('User Interactions', () => {
        it('should call onInteraction when FREE plan is selected', async () => {
            const user = userEvent.setup()
            const mockOnInteraction = vi.fn()

            render(
                <PricingComparison {...defaultProps} onInteraction={mockOnInteraction} />
            )

            const freeButton = screen.getByRole('button', { name: /Começar Grátis/i })
            await user.click(freeButton)

            expect(mockOnInteraction).toHaveBeenCalledWith(
                'select_plan',
                'PricingComparison',
                { plan: 'free' }
            )
        })

        it('should call onInteraction when PRO plan is selected', async () => {
            const user = userEvent.setup()
            const mockOnInteraction = vi.fn()

            render(
                <PricingComparison {...defaultProps} onInteraction={mockOnInteraction} />
            )

            const proButton = screen.getByRole('button', { name: /Assinar PRO/i })
            await user.click(proButton)

            expect(mockOnInteraction).toHaveBeenCalledWith(
                'select_plan',
                'PricingComparison',
                { plan: 'pro' }
            )
        })

        it('should work without onInteraction callback', async () => {
            const user = userEvent.setup()

            render(<PricingComparison {...defaultProps} />)

            const freeButton = screen.getByRole('button', { name: /Começar Grátis/i })

            // Should not throw error
            await expect(user.click(freeButton)).resolves.not.toThrow()
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty emphasize_features array', () => {
            render(
                <PricingComparison {...defaultProps} emphasize_features={[]} />
            )

            const contactsRow = screen.getByText('Contatos').closest('div')
            expect(contactsRow).not.toHaveClass('bg-yellow-50')
        })

        it('should handle invalid feature IDs in emphasize_features', () => {
            render(
                <PricingComparison
                    {...defaultProps}
                    emphasize_features={['invalid_feature', 'contacts']}
                />
            )

            // Should still work, just won't emphasize invalid features
            expect(screen.getByText('Contatos')).toBeInTheDocument()
        })

        it('should handle negative annual savings gracefully', () => {
            render(
                <PricingComparison {...defaultProps} annual_savings={-5000} />
            )

            // Should not display negative savings
            expect(screen.queryByText('Economia Anual Estimada')).not.toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('should have proper button roles', () => {
            render(<PricingComparison {...defaultProps} />)

            const buttons = screen.getAllByRole('button')
            expect(buttons).toHaveLength(2)
        })

        it('should have descriptive button text', () => {
            render(<PricingComparison {...defaultProps} />)

            expect(screen.getByRole('button', { name: /Começar Grátis/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Assinar PRO/i })).toBeInTheDocument()
        })
    })
})
