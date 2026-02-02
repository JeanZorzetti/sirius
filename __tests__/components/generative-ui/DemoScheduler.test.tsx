/**
 * Tests for DemoScheduler Component
 *
 * Tests:
 * - Component rendering
 * - Event type selection
 * - Contact info prefill
 * - Calendly integration (with/without)
 * - Fallback form
 * - Auto CRM trigger
 * - Success state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoScheduler } from '@/components/generative-ui/DemoScheduler'
import type { DemoSchedulerProps } from '@/lib/generative-ui/schemas'

// Mock environment variables
const originalEnv = process.env
global.fetch = vi.fn()

describe('DemoScheduler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env = { ...originalEnv }
            ; (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ id: 'deal-123' }),
            })
    })

    afterEach(() => {
        process.env = originalEnv
    })

    describe('Rendering', () => {
        it('should render scheduler with title', () => {
            render(<DemoScheduler eventType="demo_30min" />)

            expect(screen.getByText('Agendar Demo')).toBeInTheDocument()
            expect(screen.getByText('Escolha o melhor horário para você')).toBeInTheDocument()
        })

        it('should have data-testid', () => {
            render(<DemoScheduler eventType="demo_30min" />)

            expect(screen.getByTestId('demo-scheduler')).toBeInTheDocument()
        })

        it('should show Auto-CRM badge when enabled', () => {
            render(<DemoScheduler eventType="demo_30min" autoTriggerCRM={true} />)

            expect(screen.getByText('Auto-CRM')).toBeInTheDocument()
        })

        it('should not show Auto-CRM badge when disabled', () => {
            render(<DemoScheduler eventType="demo_30min" autoTriggerCRM={false} />)

            expect(screen.queryByText('Auto-CRM')).not.toBeInTheDocument()
        })
    })

    describe('Event Type Selection', () => {
        it('should display all event types', () => {
            render(<DemoScheduler eventType="demo_30min" />)

            const trigger = screen.getByRole('combobox')
            expect(trigger).toBeInTheDocument()
        })

        it('should default to provided event type', () => {
            render(<DemoScheduler eventType="demo_60min" />)

            const trigger = screen.getByRole('combobox')
            expect(trigger).toHaveTextContent('Demo Completa')
        })

        it('should allow changing event type', async () => {
            const user = userEvent.setup()
            render(<DemoScheduler eventType="demo_30min" />)

            const trigger = screen.getByRole('combobox')
            await user.click(trigger)

            // Select different event type
            const option = await screen.findByText('Demo Completa')
            await user.click(option)

            expect(trigger).toHaveTextContent('Demo Completa')
        })
    })

    describe('Contact Info Prefill', () => {
        it('should prefill name from props', () => {
            const prefill = {
                name: 'John Doe',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const nameInput = screen.getByLabelText(/Nome/i) as HTMLInputElement
            expect(nameInput.value).toBe('John Doe')
        })

        it('should prefill email from props', () => {
            const prefill = {
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement
            expect(emailInput.value).toBe('john@example.com')
        })

        it('should prefill company from props', () => {
            const prefill = {
                company: 'ACME Corp',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const companyInput = screen.getByLabelText(/Empresa/i) as HTMLInputElement
            expect(companyInput.value).toBe('ACME Corp')
        })

        it('should allow editing prefilled values', async () => {
            const user = userEvent.setup()
            const prefill = {
                name: 'John Doe',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const nameInput = screen.getByLabelText(/Nome/i) as HTMLInputElement
            await user.clear(nameInput)
            await user.type(nameInput, 'Jane Smith')

            expect(nameInput.value).toBe('Jane Smith')
        })
    })

    describe('Fallback Form (No Calendly)', () => {
        beforeEach(() => {
            delete process.env.NEXT_PUBLIC_CALENDLY_URL
        })

        it('should show fallback form when Calendly not configured', () => {
            render(<DemoScheduler eventType="demo_30min" />)

            expect(screen.getByText('Solicitar Agendamento')).toBeInTheDocument()
            expect(screen.queryByText('Ver Horários Disponíveis')).not.toBeInTheDocument()
        })

        it('should show time period options', () => {
            render(<DemoScheduler eventType="demo_30min" />)

            expect(screen.getByText('Manhã')).toBeInTheDocument()
            expect(screen.getByText('Tarde')).toBeInTheDocument()
            expect(screen.getByText('Noite')).toBeInTheDocument()
        })

        it('should disable submit without name and email', () => {
            render(<DemoScheduler eventType="demo_30min" />)

            const submitButton = screen.getByRole('button', { name: /Solicitar Agendamento/i })
            expect(submitButton).toBeDisabled()
        })

        it('should enable submit with name and email', () => {
            const prefill = {
                name: 'John',
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const submitButton = screen.getByRole('button', { name: /Solicitar Agendamento/i })
            expect(submitButton).not.toBeDisabled()
        })

        it('should show loading state during submission', async () => {
            const user = userEvent.setup()
            const prefill = {
                name: 'John',
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const submitButton = screen.getByRole('button', { name: /Solicitar Agendamento/i })
            await user.click(submitButton)

            expect(screen.getByText('Agendando...')).toBeInTheDocument()
            expect(submitButton).toBeDisabled()
        })

        it('should show success state after submission', async () => {
            vi.useFakeTimers()
            const user = userEvent.setup({ delay: null })
            const prefill = {
                name: 'John',
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const submitButton = screen.getByRole('button', { name: /Solicitar Agendamento/i })
            await user.click(submitButton)

            // Fast-forward timer for simulation delay
            vi.advanceTimersByTime(1500)

            await waitFor(() => {
                expect(screen.getByTestId('demo-scheduler-success')).toBeInTheDocument()
                expect(screen.getByText('Demo Agendada!')).toBeInTheDocument()
            })

            vi.useRealTimers()
        })
    })

    describe('Calendly Integration', () => {
        beforeEach(() => {
            process.env.NEXT_PUBLIC_CALENDLY_URL = 'https://calendly.com/company'
        })

        it('should show Calendly buttons when configured', () => {
            const prefill = {
                name: 'John',
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            expect(screen.getByText('Ver Horários Disponíveis')).toBeInTheDocument()
        })

        it('should disable Calendly button without name and email', () => {
            render(<DemoScheduler eventType="demo_30min" />)

            const calendlyButton = screen.getByRole('button', { name: /Ver Horários Disponíveis/i })
            expect(calendlyButton).toBeDisabled()
        })

        it('should enable Calendly button with name and email', () => {
            const prefill = {
                name: 'John',
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const calendlyButton = screen.getByRole('button', { name: /Ver Horários Disponíveis/i })
            expect(calendlyButton).not.toBeDisabled()
        })

        it('should show iframe when Calendly button clicked', async () => {
            const user = userEvent.setup()
            const prefill = {
                name: 'John',
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const calendlyButton = screen.getByRole('button', { name: /Ver Horários Disponíveis/i })
            await user.click(calendlyButton)

            const iframe = screen.getByTitle('Agendar Demo')
            expect(iframe).toBeInTheDocument()
        })

        it('should include prefilled data in Calendly URL', async () => {
            const user = userEvent.setup()
            const prefill = {
                name: 'John Doe',
                email: 'john@example.com',
                company: 'ACME',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} />)

            const calendlyButton = screen.getByRole('button', { name: /Ver Horários Disponíveis/i })
            await user.click(calendlyButton)

            const iframe = screen.getByTitle('Agendar Demo') as HTMLIFrameElement
            expect(iframe.src).toContain('name=John+Doe')
            expect(iframe.src).toContain('email=john%40example.com')
            expect(iframe.src).toContain('a1=ACME')
        })
    })

    describe('Auto CRM Trigger', () => {
        beforeEach(() => {
            vi.useFakeTimers()
            delete process.env.NEXT_PUBLIC_CALENDLY_URL
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should create deal when autoTriggerCRM is true', async () => {
            const user = userEvent.setup({ delay: null })
            const prefill = {
                name: 'John',
                email: 'john@example.com',
                company: 'ACME',
            }

            render(<DemoScheduler eventType="demo_60min" prefill={prefill} autoTriggerCRM={true} />)

            const submitButton = screen.getByRole('button', { name: /Solicitar Agendamento/i })
            await user.click(submitButton)

            vi.advanceTimersByTime(1500)

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/v1/deals',
                    expect.objectContaining({
                        method: 'POST',
                        body: expect.stringContaining('Demo - ACME'),
                    })
                )
            })
        })

        it('should not create deal when autoTriggerCRM is false', async () => {
            const user = userEvent.setup({ delay: null })
            const prefill = {
                name: 'John',
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} autoTriggerCRM={false} />)

            const submitButton = screen.getByRole('button', { name: /Solicitar Agendamento/i })
            await user.click(submitButton)

            vi.advanceTimersByTime(1500)

            await waitFor(() => {
                expect(screen.getByTestId('demo-scheduler-success')).toBeInTheDocument()
            })

            expect(global.fetch).not.toHaveBeenCalled()
        })

        it('should show auto-CRM confirmation in success state', async () => {
            const user = userEvent.setup({ delay: null })
            const prefill = {
                name: 'John',
                email: 'john@example.com',
            }

            render(<DemoScheduler eventType="demo_30min" prefill={prefill} autoTriggerCRM={true} />)

            const submitButton = screen.getByRole('button', { name: /Solicitar Agendamento/i })
            await user.click(submitButton)

            vi.advanceTimersByTime(1500)

            await waitFor(() => {
                expect(screen.getByText('Deal criado automaticamente no CRM')).toBeInTheDocument()
            })
        })
    })

    describe('Interaction Callbacks', () => {
        beforeEach(() => {
            vi.useFakeTimers()
            delete process.env.NEXT_PUBLIC_CALENDLY_URL
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should call onInteraction when demo scheduled', async () => {
            const user = userEvent.setup({ delay: null })
            const mockOnInteraction = vi.fn()
            const prefill = {
                name: 'John',
                email: 'john@example.com',
                company: 'ACME',
            }

            render(
                <DemoScheduler
                    eventType="demo_60min"
                    prefill={prefill}
                    onInteraction={mockOnInteraction}
                />
            )

            const submitButton = screen.getByRole('button', { name: /Solicitar Agendamento/i })
            await user.click(submitButton)

            vi.advanceTimersByTime(1500)

            await waitFor(() => {
                expect(mockOnInteraction).toHaveBeenCalledWith(
                    'demo_scheduled',
                    'DemoScheduler',
                    expect.objectContaining({
                        eventType: 'demo_60min',
                        name: 'John',
                        email: 'john@example.com',
                        company: 'ACME',
                    })
                )
            })
        })
    })

    describe('Auto CRM Notice', () => {
        it('should show notice when autoTriggerCRM is true', () => {
            render(<DemoScheduler eventType="demo_30min" autoTriggerCRM={true} />)

            expect(
                screen.getByText('Um deal será criado automaticamente ao confirmar o agendamento.')
            ).toBeInTheDocument()
        })

        it('should not show notice when autoTriggerCRM is false', () => {
            render(<DemoScheduler eventType="demo_30min" autoTriggerCRM={false} />)

            expect(
                screen.queryByText('Um deal será criado automaticamente ao confirmar o agendamento.')
            ).not.toBeInTheDocument()
        })
    })
})
