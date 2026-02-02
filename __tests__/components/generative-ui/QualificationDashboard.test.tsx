/**
 * QualificationDashboard Component Tests
 * 
 * Tests for BANT qualification score visualization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QualificationDashboard } from '@/components/generative-ui/QualificationDashboard'
import type { QualificationDashboardProps } from '@/lib/generative-ui/schemas'

describe('QualificationDashboard', () => {
    const defaultProps: QualificationDashboardProps = {
        scores: {
            budget: 85,
            authority: 70,
            need: 90,
            timeline: 60,
        },
        overall: 76,
        recommendations: [],
        nextSteps: [],
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render qualification dashboard', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByTestId('qualification-dashboard')).toBeInTheDocument()
            expect(screen.getByText('Qualificação BANT')).toBeInTheDocument()
            expect(screen.getByText('Análise de fit do lead baseada na conversa')).toBeInTheDocument()
        })

        it('should display overall score', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByText('Score Geral')).toBeInTheDocument()

            // Overall score appears twice (header badge + center display)
            const scoreElements = screen.getAllByText('76%')
            expect(scoreElements.length).toBeGreaterThanOrEqual(1)
        })

        it('should render all BANT scores', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByText('Budget')).toBeInTheDocument()
            expect(screen.getByText('Authority')).toBeInTheDocument()
            expect(screen.getByText('Need')).toBeInTheDocument()
            expect(screen.getByText('Timeline')).toBeInTheDocument()
        })

        it('should display BANT score values', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByText('85%')).toBeInTheDocument() // Budget
            expect(screen.getByText('70%')).toBeInTheDocument() // Authority
            expect(screen.getByText('90%')).toBeInTheDocument() // Need
            expect(screen.getByText('60%')).toBeInTheDocument() // Timeline
        })
    })

    describe('Overall Score Labels', () => {
        it('should show "Alta Qualificação" for score >= 80', () => {
            render(<QualificationDashboard {...defaultProps} overall={85} />)

            expect(screen.getByText('Alta Qualificação')).toBeInTheDocument()
        })

        it('should show "Boa Qualificação" for score >= 60', () => {
            render(<QualificationDashboard {...defaultProps} overall={70} />)

            expect(screen.getByText('Boa Qualificação')).toBeInTheDocument()
        })

        it('should show "Qualificação Média" for score >= 40', () => {
            render(<QualificationDashboard {...defaultProps} overall={50} />)

            expect(screen.getByText('Qualificação Média')).toBeInTheDocument()
        })

        it('should show "Baixa Qualificação" for score < 40', () => {
            render(<QualificationDashboard {...defaultProps} overall={30} />)

            expect(screen.getByText('Baixa Qualificação')).toBeInTheDocument()
        })
    })

    describe('BANT Descriptions', () => {
        it('should show Budget description', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByText(/Tem orçamento disponível\?/i)).toBeInTheDocument()
        })

        it('should show Authority description', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByText(/Pode tomar a decisão\?/i)).toBeInTheDocument()
        })

        it('should show Need description', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByText(/Tem necessidade real\?/i)).toBeInTheDocument()
        })

        it('should show Timeline description', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByText(/Tem prazo definido\?/i)).toBeInTheDocument()
        })
    })

    describe('Recommendations', () => {
        it('should display recommendations when provided', () => {
            const recommendations = [
                'Explore o budget em mais detalhes',
                'Confirme quem é o decision maker',
            ]

            render(
                <QualificationDashboard
                    {...defaultProps}
                    recommendations={recommendations}
                />
            )

            expect(screen.getByText('Recomendações da IA')).toBeInTheDocument()
            expect(screen.getByText(recommendations[0])).toBeInTheDocument()
            expect(screen.getByText(recommendations[1])).toBeInTheDocument()
        })

        it('should not display recommendations section when empty', () => {
            render(<QualificationDashboard {...defaultProps} recommendations={[]} />)

            expect(screen.queryByText('Recomendações da IA')).not.toBeInTheDocument()
        })

        it('should render multiple recommendations with check icons', () => {
            const recommendations = [
                'Item 1',
                'Item 2',
                'Item 3',
            ]

            const { container } = render(
                <QualificationDashboard
                    {...defaultProps}
                    recommendations={recommendations}
                />
            )

            const checkIcons = container.querySelectorAll('.lucide-check-circle')
            expect(checkIcons.length).toBe(3)
        })
    })

    describe('Next Steps', () => {
        it('should display next steps when provided', () => {
            const nextSteps = [
                'Agendar reunião de discovery',
                'Enviar proposta personalizada',
            ]

            render(
                <QualificationDashboard
                    {...defaultProps}
                    nextSteps={nextSteps}
                />
            )

            expect(screen.getByText('Próximos Passos')).toBeInTheDocument()
            expect(screen.getByText(nextSteps[0])).toBeInTheDocument()
            expect(screen.getByText(nextSteps[1])).toBeInTheDocument()
        })

        it('should not display next steps section when empty', () => {
            render(<QualificationDashboard {...defaultProps} nextSteps={[]} />)

            expect(screen.queryByText('Próximos Passos')).not.toBeInTheDocument()
        })

        it('should number next steps sequentially', () => {
            const nextSteps = ['Step 1', 'Step 2', 'Step 3']

            render(
                <QualificationDashboard
                    {...defaultProps}
                    nextSteps={nextSteps}
                />
            )

            expect(screen.getByText('1')).toBeInTheDocument()
            expect(screen.getByText('2')).toBeInTheDocument()
            expect(screen.getByText('3')).toBeInTheDocument()
        })

        it('should call onInteraction when next step is clicked', async () => {
            const user = userEvent.setup()
            const mockOnInteraction = vi.fn()
            const nextSteps = ['Schedule meeting', 'Send proposal']

            render(
                <QualificationDashboard
                    {...defaultProps}
                    nextSteps={nextSteps}
                    onInteraction={mockOnInteraction}
                />
            )

            const firstStep = screen.getByText(nextSteps[0])
            await user.click(firstStep)

            expect(mockOnInteraction).toHaveBeenCalledWith(
                'next_step_clicked',
                'QualificationDashboard',
                { step: nextSteps[0] }
            )
        })

        it('should work without onInteraction callback', async () => {
            const user = userEvent.setup()
            const nextSteps = ['Test step']

            render(
                <QualificationDashboard
                    {...defaultProps}
                    nextSteps={nextSteps}
                />
            )

            const step = screen.getByText(nextSteps[0])

            // Should not throw error
            await expect(user.click(step)).resolves.not.toThrow()
        })
    })

    describe('Score Edge Cases', () => {
        it('should handle perfect scores (100%)', () => {
            render(
                <QualificationDashboard
                    {...defaultProps}
                    scores={{
                        budget: 100,
                        authority: 100,
                        need: 100,
                        timeline: 100,
                    }}
                    overall={100}
                />
            )

            expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
            expect(screen.getByText('Alta Qualificação')).toBeInTheDocument()
        })

        it('should handle zero scores', () => {
            render(
                <QualificationDashboard
                    {...defaultProps}
                    scores={{
                        budget: 0,
                        authority: 0,
                        need: 0,
                        timeline: 0,
                    }}
                    overall={0}
                />
            )

            expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
            expect(screen.getByText('Baixa Qualificação')).toBeInTheDocument()
        })

        it('should handle mixed score ranges', () => {
            render(
                <QualificationDashboard
                    {...defaultProps}
                    scores={{
                        budget: 10,   // Low
                        authority: 45, // Medium
                        need: 65,     // Good
                        timeline: 95, // High
                    }}
                    overall={54}
                />
            )

            expect(screen.getByText('10%')).toBeInTheDocument()
            expect(screen.getByText('45%')).toBeInTheDocument()
            expect(screen.getByText('65%')).toBeInTheDocument()
            expect(screen.getByText('95%')).toBeInTheDocument()
        })
    })

    describe('Full Dashboard', () => {
        it('should render complete dashboard with all sections', () => {
            const fullProps: QualificationDashboardProps = {
                scores: {
                    budget: 80,
                    authority: 70,
                    need: 90,
                    timeline: 60,
                },
                overall: 75,
                recommendations: [
                    'Confirme o budget exato disponível',
                    'Identifique todos os stakeholders',
                ],
                nextSteps: [
                    'Agendar call de discovery',
                    'Preparar proposta técnica',
                    'Apresentar ROI estimado',
                ],
            }

            render(<QualificationDashboard {...fullProps} onInteraction={vi.fn()} />)

            expect(screen.getByText('Qualificação BANT')).toBeInTheDocument()
            expect(screen.getByText('Budget')).toBeInTheDocument()
            expect(screen.getByText('Recomendações da IA')).toBeInTheDocument()
            expect(screen.getByText('Próximos Passos')).toBeInTheDocument()
            expect(screen.getAllByText(/75%/).length).toBeGreaterThan(0)
        })
    })

    describe('Accessibility', () => {
        it('should have proper button roles for next steps', () => {
            render(
                <QualificationDashboard
                    {...defaultProps}
                    nextSteps={['Step 1', 'Step 2']}
                />
            )

            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBe(2)
        })

        it('should have descriptive labels', () => {
            render(<QualificationDashboard {...defaultProps} />)

            expect(screen.getByText('Score Geral')).toBeInTheDocument()
            expect(screen.getByText('Qualificação BANT')).toBeInTheDocument()
        })
    })
})
