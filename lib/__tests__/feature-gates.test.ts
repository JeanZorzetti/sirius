/**
 * Testes para feature gates (server-side enforcement)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'
import {
  checkDealLimit,
  checkUserLimit,
  checkPipelineLimit,
  consumeAgiQuota,
  consumeScrapingCredit,
  LimitReachedError,
  QuotaExceededError,
  InsufficientCreditsError,
} from '../feature-gates'

// Mock do Prisma
vi.mock('../prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}))

import { prisma } from '../prisma'
const mockPrisma = prisma as any

describe('Feature Gates', () => {
  beforeEach(() => {
    mockReset(mockPrisma)
  })

  describe('checkDealLimit', () => {
    it('should allow creating deal when under FREE limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'FREE',
        grandfatheredDealLimit: null,
      })

      mockPrisma.deal.count.mockResolvedValue(30) // Abaixo de 50

      await expect(checkDealLimit('org_1')).resolves.not.toThrow()
    })

    it('should throw when FREE tier exceeds 50 deals', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'FREE',
        grandfatheredDealLimit: null,
      })

      mockPrisma.deal.count.mockResolvedValue(50) // No limite

      await expect(checkDealLimit('org_1')).rejects.toThrow(LimitReachedError)
      await expect(checkDealLimit('org_1')).rejects.toThrow(
        'Deal limit reached: 50/50 active deals'
      )
    })

    it('should respect grandfathered deal limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'FREE',
        grandfatheredDealLimit: 127, // Cliente antigo
      })

      mockPrisma.deal.count.mockResolvedValue(100) // Abaixo do grandfathered limit

      await expect(checkDealLimit('org_1')).resolves.not.toThrow()
    })

    it('should throw when exceeding grandfathered limit', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'FREE',
        grandfatheredDealLimit: 100,
      })

      mockPrisma.deal.count.mockResolvedValue(100) // No limite

      await expect(checkDealLimit('org_1')).rejects.toThrow(LimitReachedError)
    })

    it('should allow unlimited deals for STARTER tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'STARTER',
        grandfatheredDealLimit: null,
      })

      mockPrisma.deal.count.mockResolvedValue(10000) // Muito acima

      await expect(checkDealLimit('org_1')).resolves.not.toThrow()
    })

    it('should allow unlimited deals for PRO tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'PRO',
        grandfatheredDealLimit: null,
      })

      mockPrisma.deal.count.mockResolvedValue(5000)

      await expect(checkDealLimit('org_1')).resolves.not.toThrow()
    })

    it('should allow unlimited deals for BUSINESS tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'BUSINESS',
        grandfatheredDealLimit: null,
      })

      mockPrisma.deal.count.mockResolvedValue(20000)

      await expect(checkDealLimit('org_1')).resolves.not.toThrow()
    })

    it('should throw if organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null)

      await expect(checkDealLimit('invalid_org')).rejects.toThrow(
        'Organization not found'
      )
    })
  })

  describe('checkUserLimit', () => {
    it('should allow 1 user for FREE tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'FREE',
      })

      mockPrisma.user.count.mockResolvedValue(1) // Exatamente 1

      await expect(checkUserLimit('org_1')).rejects.toThrow(LimitReachedError)
      await expect(checkUserLimit('org_1')).rejects.toThrow('User limit reached')
    })

    it('should allow adding first user to FREE tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'FREE',
      })

      mockPrisma.user.count.mockResolvedValue(0)

      await expect(checkUserLimit('org_1')).resolves.not.toThrow()
    })

    it('should allow 1 user for STARTER tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'STARTER',
      })

      mockPrisma.user.count.mockResolvedValue(1)

      await expect(checkUserLimit('org_1')).rejects.toThrow(LimitReachedError)
    })

    it('should allow unlimited users for PRO tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'PRO',
      })

      mockPrisma.user.count.mockResolvedValue(100)

      await expect(checkUserLimit('org_1')).resolves.not.toThrow()
    })

    it('should allow unlimited users for BUSINESS tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'BUSINESS',
      })

      mockPrisma.user.count.mockResolvedValue(500)

      await expect(checkUserLimit('org_1')).resolves.not.toThrow()
    })
  })

  describe('checkPipelineLimit', () => {
    it('should allow 1 pipeline for FREE tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'FREE',
      })

      mockPrisma.pipeline.count.mockResolvedValue(1)

      await expect(checkPipelineLimit('org_1')).rejects.toThrow(LimitReachedError)
    })

    it('should allow creating first pipeline for FREE', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'FREE',
      })

      mockPrisma.pipeline.count.mockResolvedValue(0)

      await expect(checkPipelineLimit('org_1')).resolves.not.toThrow()
    })

    it('should allow unlimited pipelines for PRO tier', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org_1',
        tier: 'PRO',
      })

      mockPrisma.pipeline.count.mockResolvedValue(50)

      await expect(checkPipelineLimit('org_1')).resolves.not.toThrow()
    })
  })

  describe('consumeAgiQuota', () => {
    it('should consume quota for FREE tier', async () => {
      mockPrisma.agiQuota.findUnique.mockResolvedValue({
        id: 'quota_1',
        organizationId: 'org_1',
        monthlyLimit: 3,
        usedThisMonth: 2,
        lastReset: new Date(),
      })

      mockPrisma.agiQuota.update.mockResolvedValue({
        id: 'quota_1',
        organizationId: 'org_1',
        monthlyLimit: 3,
        usedThisMonth: 3,
        lastReset: new Date(),
      })

      await expect(consumeAgiQuota('org_1')).resolves.not.toThrow()
    })

    it('should throw when FREE tier exceeds quota', async () => {
      mockPrisma.agiQuota.findUnique.mockResolvedValue({
        id: 'quota_1',
        organizationId: 'org_1',
        monthlyLimit: 3,
        usedThisMonth: 3, // Já usou tudo
        lastReset: new Date(),
      })

      await expect(consumeAgiQuota('org_1')).rejects.toThrow(QuotaExceededError)
      await expect(consumeAgiQuota('org_1')).rejects.toThrow(
        'AGI quota exceeded: 3/3 used this month'
      )
    })

    it('should allow unlimited consumption for PRO tier', async () => {
      mockPrisma.agiQuota.findUnique.mockResolvedValue({
        id: 'quota_1',
        organizationId: 'org_1',
        monthlyLimit: -1, // Ilimitado
        usedThisMonth: 1000,
        lastReset: new Date(),
      })

      mockPrisma.agiQuota.update.mockResolvedValue({
        id: 'quota_1',
        organizationId: 'org_1',
        monthlyLimit: -1,
        usedThisMonth: 1001,
        lastReset: new Date(),
      })

      await expect(consumeAgiQuota('org_1')).resolves.not.toThrow()
    })

    it('should throw if quota record not found', async () => {
      mockPrisma.agiQuota.findUnique.mockResolvedValue(null)

      await expect(consumeAgiQuota('org_1')).rejects.toThrow(
        'AGI quota not initialized'
      )
    })
  })

  describe('consumeScrapingCredit', () => {
    it('should consume 1 credit when available', async () => {
      mockPrisma.scrapingCredit.findUnique.mockResolvedValue({
        id: 'credit_1',
        organizationId: 'org_1',
        balance: 10,
        monthlyQuota: 50,
        usedThisMonth: 40,
        lastRefill: new Date(),
      })

      mockPrisma.scrapingCredit.update.mockResolvedValue({
        id: 'credit_1',
        organizationId: 'org_1',
        balance: 9,
        monthlyQuota: 50,
        usedThisMonth: 41,
        lastRefill: new Date(),
      })

      await expect(consumeScrapingCredit('org_1', 1)).resolves.not.toThrow()
    })

    it('should consume multiple credits', async () => {
      mockPrisma.scrapingCredit.findUnique.mockResolvedValue({
        id: 'credit_1',
        organizationId: 'org_1',
        balance: 100,
        monthlyQuota: 50,
        usedThisMonth: 0,
        lastRefill: new Date(),
      })

      mockPrisma.scrapingCredit.update.mockResolvedValue({
        id: 'credit_1',
        organizationId: 'org_1',
        balance: 90,
        monthlyQuota: 50,
        usedThisMonth: 10,
        lastRefill: new Date(),
      })

      await expect(consumeScrapingCredit('org_1', 10)).resolves.not.toThrow()
    })

    it('should throw when insufficient credits', async () => {
      mockPrisma.scrapingCredit.findUnique.mockResolvedValue({
        id: 'credit_1',
        organizationId: 'org_1',
        balance: 5,
        monthlyQuota: 50,
        usedThisMonth: 45,
        lastRefill: new Date(),
      })

      await expect(consumeScrapingCredit('org_1', 10)).rejects.toThrow(
        InsufficientCreditsError
      )
      await expect(consumeScrapingCredit('org_1', 10)).rejects.toThrow(
        'Insufficient scraping credits: need 10, have 5'
      )
    })

    it('should throw when balance is zero', async () => {
      mockPrisma.scrapingCredit.findUnique.mockResolvedValue({
        id: 'credit_1',
        organizationId: 'org_1',
        balance: 0,
        monthlyQuota: 50,
        usedThisMonth: 50,
        lastRefill: new Date(),
      })

      await expect(consumeScrapingCredit('org_1', 1)).rejects.toThrow(
        InsufficientCreditsError
      )
    })

    it('should throw if credit record not found', async () => {
      mockPrisma.scrapingCredit.findUnique.mockResolvedValue(null)

      await expect(consumeScrapingCredit('org_1', 1)).rejects.toThrow(
        'Scraping credits not initialized'
      )
    })
  })

  describe('Custom Error Types', () => {
    it('should create LimitReachedError correctly', () => {
      const error = new LimitReachedError('deals', 50, 50)
      expect(error.name).toBe('LimitReachedError')
      expect(error.message).toBe('Deal limit reached: 50/50 active deals')
      expect(error.resource).toBe('deals')
      expect(error.limit).toBe(50)
      expect(error.current).toBe(50)
    })

    it('should create QuotaExceededError correctly', () => {
      const error = new QuotaExceededError('agi', 3, 3)
      expect(error.name).toBe('QuotaExceededError')
      expect(error.message).toBe('AGI quota exceeded: 3/3 used this month')
      expect(error.quota).toBe('agi')
      expect(error.limit).toBe(3)
      expect(error.used).toBe(3)
    })

    it('should create InsufficientCreditsError correctly', () => {
      const error = new InsufficientCreditsError(10, 5)
      expect(error.name).toBe('InsufficientCreditsError')
      expect(error.message).toBe('Insufficient scraping credits: need 10, have 5')
      expect(error.needed).toBe(10)
      expect(error.available).toBe(5)
    })
  })
})
