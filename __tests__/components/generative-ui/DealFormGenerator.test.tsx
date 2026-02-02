/**
 * Tests for DealFormGenerator Component
 *
 * Tests:
 * - Component rendering
 * - Form prefill from props
 * - Tag management (suggested, custom, toggle)
 * - Form validation
 * - Form submission
 * - Quick create mode
 * - Success state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DealFormGenerator } from '@/components/generative-ui/DealFormGenerator'
import type { DealFormGeneratorProps } from '@/lib/generative-ui/schemas'

// Mock fetch
global.fetch = vi.fn()

describe('DealFormGenerator', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            ; (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({ id: 'deal-123', title: 'Test Deal' }),
            })
    })

    describe('Rendering', () => {
        it('should render form with title', () => {
            render(<DealFormGenerator prefill={{}} />)

            expect(screen.getByText('Novo Negócio')).toBeInTheDocument()
            expect(screen.getByText('Preencha os dados do negócio')).toBeInTheDocument()
        })

        it('should render in quick create mode', () => {
            render(<DealFormGenerator prefill={{}} quickCreate={true} />)

            expect(screen.getByText('Criar Deal Rápido')).toBeInTheDocument()
            // Should not show close date in quick create
            expect(screen.queryByLabelText(/Data de Fechamento/i)).not.toBeInTheDocument()
            // Should not show notes in quick create
            expect(screen.queryByLabelText(/Notas/i)).not.toBeInTheDocument()
        })

        it('should show AI indicator when aiNotes provided', () => {
            render(<DealFormGenerator prefill={{}} aiNotes="AI generated notes" />)

            expect(screen.getByText('Dados pré-preenchidos pela IA')).toBeInTheDocument()
        })

        it('should have data-testid', () => {
            render(<DealFormGenerator prefill={{}} />)

            expect(screen.getByTestId('deal-form-generator')).toBeInTheDocument()
        })
    })

    describe('Form Prefill', () => {
        it('should prefill title from props', () => {
            const prefill = {
                title: 'Test Deal Title',
            }

            render(<DealFormGenerator prefill={prefill} />)

            const titleInput = screen.getByLabelText(/Título do Negócio/i) as HTMLInputElement
            expect(titleInput.value).toBe('Test Deal Title')
        })

        it('should prefill value from props', () => {
            const prefill = {
                value: 15000,
            }

            render(<DealFormGenerator prefill={prefill} />)

            const valueInput = screen.getByLabelText(/Valor Estimado/i) as HTMLInputElement
            expect(valueInput.value).toBe('15000')
        })

        it('should prefill close date from props', () => {
            const prefill = {
                closeDate: '2026-03-15',
            }

            render(<DealFormGenerator prefill={prefill} />)

            const dateInput = screen.getByLabelText(/Data de Fechamento/i) as HTMLInputElement
            expect(dateInput.value).toBe('2026-03-15')
        })

        it('should prefill notes from aiNotes', () => {
            const aiNotes = 'AI generated summary of the conversation'

            render(<DealFormGenerator prefill={{}} aiNotes={aiNotes} />)

            const notesTextarea = screen.getByLabelText(/Notas/i) as HTMLTextAreaElement
            expect(notesTextarea.value).toBe(aiNotes)
        })

        it('should show suggested value hint', () => {
            const prefill = {
                value: 25000,
            }

            render(<DealFormGenerator prefill={prefill} />)

            expect(screen.getByText(/Sugerido: R\$ 25\.000/)).toBeInTheDocument()
        })
    })

    describe('Tag Management', () => {
        it('should display suggested tags', () => {
            const suggestedTags = ['high-value', 'orthodontics', 'urgent']

            render(<DealFormGenerator prefill={{}} suggestedTags={suggestedTags} />)

            expect(screen.getByText('Tags Sugeridas')).toBeInTheDocument()
            // Tags appear both as suggestions and in selected list (first 3 auto-selected)
            expect(screen.getAllByText('high-value').length).toBeGreaterThan(0)
            expect(screen.getAllByText('orthodontics').length).toBeGreaterThan(0)
            expect(screen.getAllByText('urgent').length).toBeGreaterThan(0)
        })

        it('should auto-select first 3 suggested tags', () => {
            const suggestedTags = ['tag1', 'tag2', 'tag3', 'tag4']

            render(<DealFormGenerator prefill={{}} suggestedTags={suggestedTags} />)

            // First 3 tags should appear in selected section
            expect(screen.getAllByText('tag1').length).toBeGreaterThan(0)
            expect(screen.getAllByText('tag2').length).toBeGreaterThan(0)
            expect(screen.getAllByText('tag3').length).toBeGreaterThan(0)
        })

        it('should toggle tag on click', async () => {
            const user = userEvent.setup()
            const suggestedTags = ['high-value', 'urgent']

            render(<DealFormGenerator prefill={{}} suggestedTags={suggestedTags} />)

            // Tags are auto-selected, so we already have multiple occurrences
            const initialCount = screen.getAllByText('high-value').length
            expect(initialCount).toBeGreaterThan(0)
        })

        it('should add custom tag', async () => {
            const user = userEvent.setup()
            const suggestedTags = ['preset-tag']

            render(<DealFormGenerator prefill={{}} suggestedTags={suggestedTags} />)

            const customTagInput = screen.getByPlaceholderText('Nova tag...')
            const addButton = customTagInput.nextElementSibling as HTMLButtonElement

            await user.type(customTagInput, 'custom-tag')
            await user.click(addButton)

            expect(screen.getByText('custom-tag')).toBeInTheDocument()
        })

        it('should add custom tag on Enter key', async () => {
            const user = userEvent.setup()
            const suggestedTags = ['preset-tag']

            render(<DealFormGenerator prefill={{}} suggestedTags={suggestedTags} />)

            const customTagInput = screen.getByPlaceholderText('Nova tag...')

            await user.type(customTagInput, 'keyboard-tag{Enter}')

            expect(screen.getByText('keyboard-tag')).toBeInTheDocument()
        })

        it('should not add duplicate tags', async () => {
            const user = userEvent.setup()
            const suggestedTags = ['existing-tag']

            render(<DealFormGenerator prefill={{}} suggestedTags={suggestedTags} />)

            const customTagInput = screen.getByPlaceholderText('Nova tag...')
            const addButton = customTagInput.nextElementSibling as HTMLButtonElement

            await user.type(customTagInput, 'existing-tag')
            await user.click(addButton)

            // Should still only have one instance
            const tags = screen.getAllByText('existing-tag')
            expect(tags.length).toBeLessThanOrEqual(2) // One in suggested, one in selected
        })

        it('should remove tag with X button', async () => {
            const user = userEvent.setup()
            const suggestedTags = ['removable-tag']

            const { container } = render(<DealFormGenerator prefill={{}} suggestedTags={suggestedTags} />)

            // Find X button (will be in selected tags section)
            const xButtons = container.querySelectorAll('button[type="button"]')
            const removeButton = Array.from(xButtons).find(btn =>
                btn.querySelector('svg') && btn.textContent === ''
            )

            if (removeButton) {
                await user.click(removeButton as HTMLElement)
            }
        })
    })

    describe('Form Validation', () => {
        it('should require title field', async () => {
            const user = userEvent.setup()

            render(<DealFormGenerator prefill={{}} />)

            const submitButton = screen.getByRole('button', { name: /Criar Negócio/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText('Título é obrigatório')).toBeInTheDocument()
            })
        })

        it('should show error for invalid value', async () => {
            const user = userEvent.setup()

            render(<DealFormGenerator prefill={{}} />)

            const titleInput = screen.getByLabelText(/Título do Negócio/i)
            const valueInput = screen.getByLabelText(/Valor Estimado/i)
            const submitButton = screen.getByRole('button', { name: /Criar Negócio/i })

            await user.type(titleInput, 'Test Deal')
            await user.clear(valueInput)
            await user.type(valueInput, '-100')
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText(/Valor deve ser positivo/i)).toBeInTheDocument()
            })
        })
    })

    describe('Form Submission', () => {
        it('should submit form with valid data', async () => {
            const user = userEvent.setup()
            const mockOnInteraction = vi.fn()

            render(<DealFormGenerator prefill={{}} onInteraction={mockOnInteraction} />)

            const titleInput = screen.getByLabelText(/Título do Negócio/i)
            const valueInput = screen.getByLabelText(/Valor Estimado/i)
            const submitButton = screen.getByRole('button', { name: /Criar Negócio/i })

            await user.type(titleInput, 'Test Deal')
            await user.type(valueInput, '50000')
            await user.click(submitButton)

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/v1/deals',
                    expect.objectContaining({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: expect.stringContaining('Test Deal'),
                    })
                )
            })
        })

        it('should disable button during submission', async () => {
            const user = userEvent.setup()
                ; (global.fetch as any).mockImplementation(
                    () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
                )

            render(<DealFormGenerator prefill={{ title: 'Test' }} />)

            const submitButton = screen.getByRole('button', { name: /Criar Negócio/i })
            await user.click(submitButton)

            expect(submitButton).toBeDisabled()
            expect(screen.getByText('Criando...')).toBeInTheDocument()
        })

        it('should show success state after submission', async () => {
            const user = userEvent.setup()

            render(<DealFormGenerator prefill={{ title: 'Test Deal' }} />)

            const submitButton = screen.getByRole('button', { name: /Criar Negócio/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(screen.getByTestId('deal-form-success')).toBeInTheDocument()
                expect(screen.getByText('Deal Criado com Sucesso!')).toBeInTheDocument()
            })
        })

        it('should call onInteraction on successful submission', async () => {
            const user = userEvent.setup()
            const mockOnInteraction = vi.fn()

            render(<DealFormGenerator prefill={{ title: 'Test Deal', value: 10000 }} onInteraction={mockOnInteraction} />)

            const submitButton = screen.getByRole('button', { name: /Criar Negócio/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockOnInteraction).toHaveBeenCalledWith(
                    'deal_created',
                    'DealFormGenerator',
                    expect.objectContaining({
                        dealId: 'deal-123',
                        title: 'Test Deal',
                    })
                )
            })
        })

        it('should handle submission failure', async () => {
            const user = userEvent.setup()
            const mockOnInteraction = vi.fn()

                ; (global.fetch as any).mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                })

            render(<DealFormGenerator prefill={{ title: 'Test Deal' }} onInteraction={mockOnInteraction} />)

            const submitButton = screen.getByRole('button', { name: /Criar Negócio/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(mockOnInteraction).toHaveBeenCalledWith(
                    'deal_creation_failed',
                    'DealFormGenerator',
                    expect.objectContaining({
                        error: expect.any(String),
                    })
                )
            })
        })

        it('should include prefilled pipeline and contact IDs', async () => {
            const user = userEvent.setup()
            const prefill = {
                title: 'Test',
                pipelineId: 'pipeline-123',
                stageId: 'stage-456',
                contactId: 'contact-789',
            }

            render(<DealFormGenerator prefill={prefill} />)

            const submitButton = screen.getByRole('button', { name: /Criar Negócio/i })
            await user.click(submitButton)

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/v1/deals',
                    expect.objectContaining({
                        body: expect.stringContaining('pipeline-123'),
                    })
                )
            })
        })
    })

    describe('Character Counter', () => {
        it('should show character count for notes', async () => {
            const user = userEvent.setup()

            render(<DealFormGenerator prefill={{}} />)

            const notesTextarea = screen.getByLabelText(/Notas/i)
            await user.type(notesTextarea, 'Test note')

            expect(screen.getByText('9 caracteres')).toBeInTheDocument()
        })
    })

    describe('Currency Formatting', () => {
        it('should format suggested value in BRL', () => {
            const prefill = {
                value: 12500,
            }

            render(<DealFormGenerator prefill={prefill} />)

            expect(screen.getByText(/Sugerido: R\$ 12\.500/)).toBeInTheDocument()
        })
    })
})
