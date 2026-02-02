/**
 * Tests for ROICalculator Component
 *
 * Tests:
 * - Component rendering
 * - Calculations (savings, ROI, payback)
 * - User interactions (editing values)
 * - Save and share actions
 * - Industry insights
 * - Comparison mode
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ROICalculator } from '@/components/generative-ui/ROICalculator'
import type { ROICalculatorProps } from '@/lib/generative-ui/schemas'

describe('ROICalculator', () => {
    const mockScenario = {
        currentCost: 15000,
        withSirius: 8000,
        monthlySavings: 7000,
        annualROI: 84000,
        paybackPeriod: 2,
    }

    const defaultProps: ROICalculatorProps = {
        scenario: mockScenario,
        industry: 'orthodontics',
        comparisonMode: false,
    }

    it('should render calculator with title', () => {
        render(<ROICalculator {...defaultProps} />)

        expect(screen.getByText('Calculadora de ROI')).toBeInTheDocument()
        expect(screen.getByText(/Veja quanto você pode economizar/i)).toBeInTheDocument()
    })

    it('should display industry badge when provided', () => {
        render(<ROICalculator {...defaultProps} />)

        expect(screen.getByText('orthodontics')).toBeInTheDocument()
    })

    it('should calculate monthly savings correctly', () => {
        render(<ROICalculator {...defaultProps} />)

        const monthlySavingsElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="monthly-savings"]')

        // Check for value 7000 formatted as currency (flexible for R$ 7.000 or R$7.000)
        expect(monthlySavingsElement?.textContent).toMatch(/R\$\s*7\.000/)
    })

    it('should calculate annual savings correctly', () => {
        render(<ROICalculator {...defaultProps} />)

        const annualSavingsElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="annual-savings"]')

        // Annual = Monthly * 12 = 7000 * 12 = 84000
        expect(annualSavingsElement?.textContent).toMatch(/R\$\s*84\.000/)
    })

    it('should calculate payback period correctly', () => {
        render(<ROICalculator {...defaultProps} />)

        const paybackElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="payback"]')

        // Payback = withSirius / monthlySavings = 8000 / 7000 ≈ 1.1 months
        expect(paybackElement?.textContent).toMatch(/1\.\d\smeses/)
    })

    it('should calculate ROI percentage correctly', () => {
        render(<ROICalculator {...defaultProps} />)

        const roiElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="roi-percentage"]')

        // ROI% = (monthlySavings / currentCost) * 100 = (7000 / 15000) * 100 ≈ 47%
        expect(roiElement?.textContent).toMatch(/4[67]%/) // Allow for rounding
    })

    it('should allow editing current cost and recalculate', async () => {
        const user = userEvent.setup()
        render(<ROICalculator {...defaultProps} />)

        const currentCostInput = screen.getByLabelText(/Custo Atual/i) as HTMLInputElement

        // Change current cost to 20000
        await user.clear(currentCostInput)
        await user.type(currentCostInput, '20000')

        // New monthly savings = 20000 - 8000 = 12000
        const monthlySavingsElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="monthly-savings"]')

        expect(monthlySavingsElement?.textContent).toMatch(/R\$\s*12\.000/)
    })

    it('should allow editing Sirius cost and recalculate', async () => {
        const user = userEvent.setup()
        render(<ROICalculator {...defaultProps} />)

        const siriusCostInput = screen.getByLabelText(/Com Sirius CRM/i) as HTMLInputElement

        // Change Sirius cost to 5000
        await user.clear(siriusCostInput)
        await user.type(siriusCostInput, '5000')

        // New monthly savings = 15000 - 5000 = 10000
        const monthlySavingsElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="monthly-savings"]')

        expect(monthlySavingsElement?.textContent).toMatch(/R\$\s*10\.000/)
    })

    it('should display comparison mode when enabled', () => {
        const propsWithComparison = {
            ...defaultProps,
            comparisonMode: true,
        }

        render(<ROICalculator {...propsWithComparison} />)

        expect(screen.getByText('Antes')).toBeInTheDocument()
        expect(screen.getByText('Depois')).toBeInTheDocument()
        // Values should be in the document (may have different formatting)
        expect(screen.getByTestId('roi-calculator').textContent).toContain('15.000')
        expect(screen.getByTestId('roi-calculator').textContent).toContain('8.000')
    })

    it('should not display comparison mode by default', () => {
        render(<ROICalculator {...defaultProps} />)

        expect(screen.queryByText('Antes')).not.toBeInTheDocument()
        expect(screen.queryByText('Depois')).not.toBeInTheDocument()
    })

    it('should display industry insight', () => {
        render(<ROICalculator {...defaultProps} />)

        expect(screen.getByText(/💡 Insight:/i)).toBeInTheDocument()
        expect(screen.getByText(/Clínicas de ortodontia/i)).toBeInTheDocument()
    })

    it('should display correct insight for different industries', () => {
        const { rerender } = render(<ROICalculator {...defaultProps} industry="retail" />)
        expect(screen.getByText(/Varejistas veem/i)).toBeInTheDocument()

        rerender(<ROICalculator {...defaultProps} industry="services" />)
        expect(screen.getByText(/Empresas de serviços/i)).toBeInTheDocument()

        rerender(<ROICalculator {...defaultProps} industry="manufacturing" />)
        expect(screen.getByText(/Indústrias ganham/i)).toBeInTheDocument()
    })

    it('should call onInteraction when saving calculation', async () => {
        const mockOnInteraction = vi.fn()
        const user = userEvent.setup()

        render(<ROICalculator {...defaultProps} onInteraction={mockOnInteraction} />)

        const saveButton = screen.getByRole('button', { name: /Salvar Cálculo/i })
        await user.click(saveButton)

        expect(mockOnInteraction).toHaveBeenCalledWith(
            'save_calculation',
            'ROICalculator',
            expect.objectContaining({
                currentCost: 15000,
                withSirius: 8000,
                monthlySavings: 7000,
                industry: 'orthodontics',
            })
        )
    })

    it('should show success state after saving', async () => {
        const user = userEvent.setup()
        render(<ROICalculator {...defaultProps} />)

        const saveButton = screen.getByRole('button', { name: /Salvar Cálculo/i })
        await user.click(saveButton)

        expect(screen.getByText('Salvo!')).toBeInTheDocument()
        expect(saveButton).toBeDisabled()
    })

    it('should call onInteraction when sharing calculation', async () => {
        const mockOnInteraction = vi.fn()
        const user = userEvent.setup()

        render(<ROICalculator {...defaultProps} onInteraction={mockOnInteraction} />)

        const shareButton = screen.getByRole('button', { name: /Compartilhar/i })
        await user.click(shareButton)

        expect(mockOnInteraction).toHaveBeenCalledWith(
            'share_calculation',
            'ROICalculator',
            expect.objectContaining({
                currentCost: 15000,
                withSirius: 8000,
                monthlySavings: 7000,
            })
        )
    })

    it('should have data-testid for testing', () => {
        render(<ROICalculator {...defaultProps} />)

        expect(screen.getByTestId('roi-calculator')).toBeInTheDocument()
    })

    it('should format currency in Brazilian Real', () => {
        render(<ROICalculator {...defaultProps} />)

        // Check for R$ currency symbol
        const calculator = screen.getByTestId('roi-calculator')
        expect(calculator.textContent).toContain('R$')
    })

    it('should handle negative savings gracefully', async () => {
        const user = userEvent.setup()
        render(<ROICalculator {...defaultProps} />)

        const siriusCostInput = screen.getByLabelText(/Com Sirius CRM/i) as HTMLInputElement

        // Set Sirius cost higher than current cost (negative savings)
        await user.clear(siriusCostInput)
        await user.type(siriusCostInput, '20000')

        const monthlySavingsElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="monthly-savings"]')

        // Should show negative value (may be formatted differently)
        expect(monthlySavingsElement?.textContent).toContain('5.000')
    })

    it('should handle zero cost gracefully', async () => {
        const user = userEvent.setup()
        render(<ROICalculator {...defaultProps} />)

        const currentCostInput = screen.getByLabelText(/Custo Atual/i) as HTMLInputElement

        await user.clear(currentCostInput)
        await user.type(currentCostInput, '0')

        // Should not crash
        const roiElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="roi-percentage"]')

        expect(roiElement).toBeInTheDocument()
    })

    it('should display special value for payback when savings is zero', async () => {
        const user = userEvent.setup()
        render(<ROICalculator {...defaultProps} />)

        const siriusCostInput = screen.getByLabelText(/Com Sirius CRM/i) as HTMLInputElement

        // Set same cost (no savings)
        await user.clear(siriusCostInput)
        await user.type(siriusCostInput, '15000')

        const paybackElement = screen.getByTestId('roi-calculator')
            .querySelector('[data-field="payback"]')

        // When savings is 0, paybackPeriod calculation results in Infinity
        expect(paybackElement?.textContent).toMatch(/Infinity meses|N\/A/)
    })

    it('should accept numeric input only', () => {
        render(<ROICalculator {...defaultProps} />)

        const currentCostInput = screen.getByLabelText(/Custo Atual/i) as HTMLInputElement
        const siriusCostInput = screen.getByLabelText(/Com Sirius CRM/i) as HTMLInputElement

        expect(currentCostInput).toHaveAttribute('type', 'number')
        expect(siriusCostInput).toHaveAttribute('type', 'number')
    })

    it('should have minimum value of 0', () => {
        render(<ROICalculator {...defaultProps} />)

        const currentCostInput = screen.getByLabelText(/Custo Atual/i) as HTMLInputElement
        const siriusCostInput = screen.getByLabelText(/Com Sirius CRM/i) as HTMLInputElement

        expect(currentCostInput).toHaveAttribute('min', '0')
        expect(siriusCostInput).toHaveAttribute('min', '0')
    })
})
