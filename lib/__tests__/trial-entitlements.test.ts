/**
 * The 7-day Pro trial (owner's decision, 27/09/2026): Pro features and limits while the trial is active, Starter's
 * metered AI quota, and back to the real plan when it ends.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'
import {
  checkDealLimit,
  checkPipelineLimit,
  requireFeature,
  getOrganizationEntitlements,
  getAgiQuotaStatus,
  getQuotaTier,
  LimitReachedError,
  FeatureBlockedError,
} from '../entitlements'

vi.mock('../prisma', () => ({ prisma: mockDeep<PrismaClient>() }))

import { prisma } from '../prisma'
const mockPrisma = prisma as any

const dia = 24 * 60 * 60 * 1000
const emTeste = { tier: 'FREE', trialEndsAt: new Date(Date.now() + 5 * dia), trialStatus: 'ACTIVE', grandfatheredDealLimit: null }
const testeVencido = { tier: 'FREE', trialEndsAt: new Date(Date.now() - dia), trialStatus: 'ACTIVE', grandfatheredDealLimit: null }

describe('7-day Pro trial', () => {
  beforeEach(() => {
    mockReset(mockPrisma)
  })

  it('uses the Pro deal limit while the trial is active', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(emTeste)
    mockPrisma.deal.count.mockResolvedValue(100) // the Free limit, far below Pro's

    await expect(checkDealLimit('org_1')).resolves.not.toThrow()
  })

  it('goes back to the Free limits when the trial ends', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(testeVencido)
    mockPrisma.deal.count.mockResolvedValue(100)

    await expect(checkDealLimit('org_1')).rejects.toThrow(LimitReachedError)
  })

  it('opens the Pro pipeline limit during the trial', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(emTeste)
    mockPrisma.pipeline.count.mockResolvedValue(3) // Free allows 1

    await expect(checkPipelineLimit('org_1')).resolves.not.toThrow()
  })

  it('opens Pro features during the trial and blocks them after', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue(emTeste)
    await expect(requireFeature('org_1', 'can_use_automation')).resolves.not.toThrow()

    mockPrisma.organization.findUnique.mockResolvedValue(testeVencido)
    await expect(requireFeature('org_1', 'can_use_automation')).rejects.toThrow(FeatureBlockedError)
  })

  it('gives the task views during the trial, and keeps reporting the real plan', async () => {
    mockPrisma.organization.findUnique.mockResolvedValue({ ...emTeste, agiQuota: null, scrapingCredit: { balance: 0, monthlyQuota: 0, usedThisMonth: 0 } })

    const ent = await getOrganizationEntitlements('org_1')

    expect(ent.features.taskKanban).toBe(true)
    expect(ent.features.taskCalendar).toBe(true)
    expect(ent.features.taskTable).toBe(true)
    expect(ent.tier).toBe('FREE') // billing and "your plan" screens show what the customer pays for
  })

  it("meters the AI with Starter's quota during the trial", async () => {
    expect(getQuotaTier(emTeste as any)).toBe('STARTER')
    expect(getQuotaTier(testeVencido as any)).toBe('FREE')
    expect(getQuotaTier({ tier: 'PRO', trialEndsAt: null, trialStatus: 'CONVERTED' } as any)).toBe('PRO')

    mockPrisma.organization.findUnique.mockResolvedValue({ ...emTeste, agiQuota: null })
    const emTesteStatus = await getAgiQuotaStatus('org_1')
    mockPrisma.organization.findUnique.mockResolvedValue({ tier: 'STARTER', trialEndsAt: null, trialStatus: null, agiQuota: null })
    const starterStatus = await getAgiQuotaStatus('org_1')

    expect(emTesteStatus.limit).toBe(starterStatus.limit)
    expect(emTesteStatus.hasAccess).toBe(true)
  })
})
