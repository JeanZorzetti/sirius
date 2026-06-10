/**
 * Testes para componentes de exibição de quotas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  AgiQuotaDisplay,
  ScrapingCreditsDisplay,
  QuotaDashboard,
} from '../quota-display'
import * as hooks from '@/lib/hooks/use-entitlements'

// Mock dos hooks
vi.mock('@/lib/hooks/use-entitlements', () => ({
  useAgiQuotaStatus: vi.fn(),
  useScrapingCreditsStatus: vi.fn(),
}))

// Mock do Link do Next.js
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

describe('AgiQuotaDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show "no access" message for STARTER tier', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: false,
      isUnlimited: false,
      limit: 0,
      used: 0,
      remaining: 0,
      percentage: 0,
      isExceeded: false,
    })

    render(<AgiQuotaDisplay />)

    expect(screen.getByText('Sem acesso')).toBeInTheDocument()
    expect(screen.getByText(/A IA está disponível no plano PRO/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /fazer upgrade/i })).toBeInTheDocument()
  })

  it('should show unlimited badge for PRO tier', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: true,
      isUnlimited: true,
      limit: -1,
      used: 150,
      remaining: -1,
      percentage: 0,
      isExceeded: false,
    })

    render(<AgiQuotaDisplay />)

    expect(screen.getByText('Ilimitado')).toBeInTheDocument()
    expect(screen.getByText(/150 gerações este mês/i)).toBeInTheDocument()
  })

  it('should show quota usage for FREE tier', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: true,
      isUnlimited: false,
      limit: 3,
      used: 1,
      remaining: 2,
      percentage: 33.33,
      isExceeded: false,
    })

    render(<AgiQuotaDisplay />)

    expect(screen.getByText('1/3')).toBeInTheDocument()
    expect(screen.getByText(/2 de 3 gerações disponíveis/i)).toBeInTheDocument()
  })

  it('should show warning when near limit', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: true,
      isUnlimited: false,
      limit: 3,
      used: 2,
      remaining: 1,
      percentage: 66.67,
      isExceeded: false,
    })

    render(<AgiQuotaDisplay />)

    expect(screen.getByText(/1 gerações restantes este mês/i)).toBeInTheDocument()
  })

  it('should show exceeded state', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: true,
      isUnlimited: false,
      limit: 3,
      used: 3,
      remaining: 0,
      percentage: 100,
      isExceeded: true,
    })

    render(<AgiQuotaDisplay />)

    expect(screen.getByText('Quota excedida')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upgrade para ilimitado/i })).toBeInTheDocument()
  })
})

describe('ScrapingCreditsDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show "no access" message for STARTER tier', () => {
    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: false,
      balance: 0,
      monthlyQuota: 0,
      used: 0,
      canUse: false,
    })

    render(<ScrapingCreditsDisplay />)

    expect(screen.getByText('Sem acesso')).toBeInTheDocument()
    expect(screen.getByText(/Prospecção automática disponível no plano PRO/i)).toBeInTheDocument()
  })

  it('should show credits for PRO tier', () => {
    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 35,
      monthlyQuota: 50,
      used: 15,
      canUse: true,
    })

    render(<ScrapingCreditsDisplay />)

    expect(screen.getByText('35')).toBeInTheDocument()
    expect(screen.getByText(/50 créditos\/mês/i)).toBeInTheDocument()
    expect(screen.getByText(/Usados este mês/i)).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('should show initial credits for FREE tier', () => {
    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 5,
      monthlyQuota: 0,
      used: 0,
      canUse: true,
    })

    render(<ScrapingCreditsDisplay />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/0 créditos\/mês/i)).toBeInTheDocument()
  })

  it('should show low credits warning', () => {
    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 5,
      monthlyQuota: 50,
      used: 45,
      canUse: true,
    })

    render(<ScrapingCreditsDisplay />)

    expect(screen.getByText(/Poucos créditos restantes/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /comprar mais/i })).toBeInTheDocument()
  })

  it('should show exhausted state', () => {
    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 0,
      monthlyQuota: 50,
      used: 50,
      canUse: false,
    })

    render(<ScrapingCreditsDisplay />)

    expect(screen.getByText('Créditos esgotados')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /comprar créditos extras/i })).toBeInTheDocument()
  })

  it('should have link to addons page', () => {
    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 0,
      monthlyQuota: 50,
      used: 50,
      canUse: false,
    })

    render(<ScrapingCreditsDisplay />)

    const link = screen.getByRole('link', { name: /comprar créditos extras/i })
    expect(link).toHaveAttribute('href', '/settings/addons')
  })
})

describe('QuotaDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render both quota displays', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: true,
      isUnlimited: true,
      limit: -1,
      used: 50,
      remaining: -1,
      percentage: 0,
      isExceeded: false,
    })

    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 25,
      monthlyQuota: 50,
      used: 25,
      canUse: true,
    })

    render(<QuotaDashboard />)

    // AGI component
    expect(screen.getByText('IA (AGI Sirius)')).toBeInTheDocument()
    expect(screen.getByText('Ilimitado')).toBeInTheDocument()

    // Scraping component
    expect(screen.getByText('Créditos de Prospecção')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('should show complete dashboard for FREE tier', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: true,
      isUnlimited: false,
      limit: 3,
      used: 1,
      remaining: 2,
      percentage: 33.33,
      isExceeded: false,
    })

    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 5,
      monthlyQuota: 0,
      used: 0,
      canUse: true,
    })

    render(<QuotaDashboard />)

    expect(screen.getByText('1/3')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should show complete dashboard for PRO tier', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: true,
      isUnlimited: true,
      limit: -1,
      used: 250,
      remaining: -1,
      percentage: 0,
      isExceeded: false,
    })

    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 40,
      monthlyQuota: 50,
      used: 10,
      canUse: true,
    })

    render(<QuotaDashboard />)

    expect(screen.getByText('Ilimitado')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
  })

  it('should show no access for both on STARTER tier', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: false,
      isUnlimited: false,
      limit: 0,
      used: 0,
      remaining: 0,
      percentage: 0,
      isExceeded: false,
    })

    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: false,
      balance: 0,
      monthlyQuota: 0,
      used: 0,
      canUse: false,
    })

    render(<QuotaDashboard />)

    const noAccessBadges = screen.getAllByText('Sem acesso')
    expect(noAccessBadges).toHaveLength(2) // AGI + Scraping
  })
})

describe('Quota Display Accessibility', () => {
  it('should have proper aria labels for AGI quota', () => {
    vi.mocked(hooks.useAgiQuotaStatus).mockReturnValue({
      hasAccess: true,
      isUnlimited: false,
      limit: 3,
      used: 2,
      remaining: 1,
      percentage: 66.67,
      isExceeded: false,
    })

    render(<AgiQuotaDisplay />)

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
  })

  it('should have proper aria labels for scraping credits', () => {
    vi.mocked(hooks.useScrapingCreditsStatus).mockReturnValue({
      hasAccess: true,
      balance: 25,
      monthlyQuota: 50,
      used: 25,
      canUse: true,
    })

    render(<ScrapingCreditsDisplay />)

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
  })
})
