/** Spec 014, FR-003: the stage type sets the status; leaving a won/lost stage reopens the deal. */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/automations/engine', () => ({ executeDealAutomations: vi.fn() }))
vi.mock('@/lib/email-automations', () => ({ sendEmailAsync: vi.fn(), sendDealStageChangedEmail: vi.fn() }))
vi.mock('@/lib/push-notifications', () => ({ sendDealWonNotification: vi.fn() }))

import { statusDepoisDoMovimento } from '@/lib/pipeline/mover-negocio'

describe('statusDepoisDoMovimento', () => {
  const base = { atual: 'ACTIVE' as const, etapaAnterior: 'OPEN' as const, etapaNova: 'OPEN' as const, mudouEtapa: true }

  it('etapa de ganho marca ganho; de perda marca perdido', () => {
    expect(statusDepoisDoMovimento({ ...base, etapaNova: 'WON' })).toBe('WON')
    expect(statusDepoisDoMovimento({ ...base, etapaNova: 'LOST' })).toBe('LOST')
  })

  it('sair de ganho ou perda para etapa aberta reabre', () => {
    expect(statusDepoisDoMovimento({ ...base, atual: 'WON', etapaAnterior: 'WON' })).toBe('ACTIVE')
    expect(statusDepoisDoMovimento({ ...base, atual: 'LOST', etapaAnterior: 'LOST' })).toBe('ACTIVE')
  })

  it('entre etapas abertas o status fica; sem mudar de etapa também', () => {
    expect(statusDepoisDoMovimento(base)).toBe('ACTIVE')
    expect(statusDepoisDoMovimento({ ...base, atual: 'WON', mudouEtapa: false, etapaNova: 'LOST' })).toBe('WON')
  })

  it('status explícito (botão ganho/perdido/reabrir) vence o tipo da etapa', () => {
    expect(statusDepoisDoMovimento({ ...base, explicito: 'LOST', etapaNova: 'WON' })).toBe('LOST')
    expect(statusDepoisDoMovimento({ ...base, atual: 'WON', explicito: 'ACTIVE', mudouEtapa: false })).toBe('ACTIVE')
  })
})
