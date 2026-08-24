/**
 * Testes para componentes de Feature Gate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureGate } from '../feature-gate'
import * as hooks from '@/hooks/use-entitlements'

// Mock dos hooks
vi.mock('@/hooks/use-entitlements', () => ({
  useFeatureAccess: vi.fn(),
  useEntitlements: vi.fn(),
}))

describe('FeatureGate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // UpgradePrompt (renderizado quando bloqueado) destructura tier de useEntitlements()
    vi.mocked(hooks.useEntitlements).mockReturnValue({ tier: 'FREE', loading: false } as any)
  })

  it('should render children when feature is available', () => {
    vi.mocked(hooks.useFeatureAccess).mockReturnValue(true)

    render(
      <FeatureGate feature="can_use_automation" requiredTier="PRO">
        <div>Protected Content</div>
      </FeatureGate>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should render upgrade prompt when feature is not available', () => {
    vi.mocked(hooks.useFeatureAccess).mockReturnValue(false)

    render(
      <FeatureGate feature="can_use_automation" requiredTier="PRO">
        <div>Protected Content</div>
      </FeatureGate>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText(/upgrade/i)).toBeInTheDocument()
  })

  it('should show custom fallback when provided', () => {
    vi.mocked(hooks.useFeatureAccess).mockReturnValue(false)

    render(
      <FeatureGate
        feature="can_use_agi"
        requiredTier="PRO"
        fallback={<div>Custom Fallback Message</div>}
      >
        <div>Protected Content</div>
      </FeatureGate>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Custom Fallback Message')).toBeInTheDocument()
  })

  it('should render children for users with access to automation', () => {
    vi.mocked(hooks.useFeatureAccess).mockImplementation((feature) => {
      return feature === 'can_use_automation'
    })

    render(
      <FeatureGate feature="can_use_automation" requiredTier="PRO">
        <button>Create Automation</button>
      </FeatureGate>
    )

    expect(screen.getByRole('button', { name: /create automation/i })).toBeInTheDocument()
  })

  it('should block access to chat interface for FREE tier', () => {
    vi.mocked(hooks.useFeatureAccess).mockReturnValue(false)

    render(
      <FeatureGate feature="can_use_chat_interface" requiredTier="PRO">
        <div>WhatsApp Chat Center</div>
      </FeatureGate>
    )

    expect(screen.queryByText('WhatsApp Chat Center')).not.toBeInTheDocument()
  })

  // NOTE: testes de `hideWhenLocked` e `RequireFeature` removidos — essa API
  // nunca existiu em feature-gate.tsx (testes gerados contra interface imaginada).
})

describe('Feature Gate Integration', () => {
  it('should protect automation features for FREE users', () => {
    vi.mocked(hooks.useFeatureAccess).mockImplementation((feature) => {
      return feature !== 'can_use_automation' // FREE não tem automation
    })

    const { rerender } = render(
      <FeatureGate feature="can_use_automation" requiredTier="PRO">
        <button>Create Email Automation</button>
      </FeatureGate>
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    // Simular upgrade para PRO
    vi.mocked(hooks.useFeatureAccess).mockReturnValue(true)
    rerender(
      <FeatureGate feature="can_use_automation" requiredTier="PRO">
        <button>Create Email Automation</button>
      </FeatureGate>
    )

    expect(screen.getByRole('button', { name: /create email automation/i })).toBeInTheDocument()
  })

  it('should protect round-robin for PRO users', () => {
    vi.mocked(hooks.useFeatureAccess).mockImplementation((feature) => {
      // PRO tem tudo exceto round-robin e team reports
      return feature !== 'can_use_round_robin' && feature !== 'can_use_team_reports'
    })

    render(
      <FeatureGate feature="can_use_round_robin" requiredTier="BUSINESS">
        <div>Lead Distribution Settings</div>
      </FeatureGate>
    )

    expect(screen.queryByText('Lead Distribution Settings')).not.toBeInTheDocument()
  })

  it('should allow BUSINESS tier to access all features', () => {
    vi.mocked(hooks.useFeatureAccess).mockReturnValue(true) // BUSINESS tem tudo

    render(
      <>
        <FeatureGate feature="can_use_automation" requiredTier="PRO">
          <div>Automation</div>
        </FeatureGate>
        <FeatureGate feature="can_use_agi" requiredTier="PRO">
          <div>AGI</div>
        </FeatureGate>
        <FeatureGate feature="can_use_round_robin" requiredTier="BUSINESS">
          <div>Round Robin</div>
        </FeatureGate>
      </>
    )

    expect(screen.getByText('Automation')).toBeInTheDocument()
    expect(screen.getByText('AGI')).toBeInTheDocument()
    expect(screen.getByText('Round Robin')).toBeInTheDocument()
  })
})
