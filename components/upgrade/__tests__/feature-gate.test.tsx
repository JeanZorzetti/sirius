/**
 * Testes para componentes de Feature Gate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureGate, RequireFeature } from '../feature-gate'
import * as hooks from '@/lib/hooks/use-entitlements'

// Mock dos hooks
vi.mock('@/lib/hooks/use-entitlements', () => ({
  useFeatureAccess: vi.fn(),
  useEntitlements: vi.fn(),
}))

describe('FeatureGate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('should render null when hideWhenLocked is true and feature not available', () => {
    vi.mocked(hooks.useFeatureAccess).mockReturnValue(false)

    const { container } = render(
      <FeatureGate feature="can_use_automation" requiredTier="PRO" hideWhenLocked>
        <div>Protected Content</div>
      </FeatureGate>
    )

    expect(container.firstChild).toBeNull()
  })
})

describe('RequireFeature Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when user has required tier', () => {
    vi.mocked(hooks.useEntitlements).mockReturnValue({
      tier: 'PRO',
      canUseAutomation: true,
      canUseAgi: true,
      canUseChatInterface: true,
      canUseRoundRobin: false,
      canUseTeamReports: false,
      dealLimit: -1,
      userLimit: -1,
      pipelineLimit: -1,
      agiQuota: null,
      scrapingCredits: null,
    } as any)

    render(
      <RequireFeature tier="PRO">
        <div>PRO Feature</div>
      </RequireFeature>
    )

    expect(screen.getByText('PRO Feature')).toBeInTheDocument()
  })

  it('should render upgrade prompt when user tier is lower', () => {
    vi.mocked(hooks.useEntitlements).mockReturnValue({
      tier: 'FREE',
      canUseAutomation: false,
      canUseAgi: true,
      canUseChatInterface: false,
      canUseRoundRobin: false,
      canUseTeamReports: false,
      dealLimit: 50,
      userLimit: 1,
      pipelineLimit: 1,
      agiQuota: null,
      scrapingCredits: null,
    } as any)

    render(
      <RequireFeature tier="PRO">
        <div>PRO Feature</div>
      </RequireFeature>
    )

    expect(screen.queryByText('PRO Feature')).not.toBeInTheDocument()
    expect(screen.getByText(/upgrade/i)).toBeInTheDocument()
  })

  it('should allow BUSINESS tier to access PRO features', () => {
    vi.mocked(hooks.useEntitlements).mockReturnValue({
      tier: 'BUSINESS',
      canUseAutomation: true,
      canUseAgi: true,
      canUseChatInterface: true,
      canUseRoundRobin: true,
      canUseTeamReports: true,
      dealLimit: -1,
      userLimit: -1,
      pipelineLimit: -1,
      agiQuota: null,
      scrapingCredits: null,
    } as any)

    render(
      <RequireFeature tier="PRO">
        <div>PRO Feature</div>
      </RequireFeature>
    )

    expect(screen.getByText('PRO Feature')).toBeInTheDocument()
  })

  it('should block FREE tier from accessing BUSINESS features', () => {
    vi.mocked(hooks.useEntitlements).mockReturnValue({
      tier: 'FREE',
      canUseAutomation: false,
      canUseAgi: true,
      canUseChatInterface: false,
      canUseRoundRobin: false,
      canUseTeamReports: false,
      dealLimit: 50,
      userLimit: 1,
      pipelineLimit: 1,
      agiQuota: null,
      scrapingCredits: null,
    } as any)

    render(
      <RequireFeature tier="BUSINESS">
        <div>Round-robin Lead Distribution</div>
      </RequireFeature>
    )

    expect(screen.queryByText('Round-robin Lead Distribution')).not.toBeInTheDocument()
  })
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
