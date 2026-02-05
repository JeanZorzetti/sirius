/**
 * Testes para o sistema de entitlements
 */

import { describe, it, expect } from 'vitest'
import {
  PLAN_FEATURES,
  getQuota,
  getLimit,
  canUseFeature,
  getPlanFeatures,
} from '../entitlements'
import { SubscriptionTier } from '@prisma/client'

describe('Entitlements System', () => {
  describe('PLAN_FEATURES', () => {
    it('should have all tiers defined', () => {
      expect(PLAN_FEATURES.FREE).toBeDefined()
      expect(PLAN_FEATURES.STARTER).toBeDefined()
      expect(PLAN_FEATURES.PRO).toBeDefined()
      expect(PLAN_FEATURES.BUSINESS).toBeDefined()
    })

    it('should have correct FREE tier limits', () => {
      expect(PLAN_FEATURES.FREE.max_deals).toBe(50)
      expect(PLAN_FEATURES.FREE.max_users).toBe(1)
      expect(PLAN_FEATURES.FREE.max_pipelines).toBe(1)
      expect(PLAN_FEATURES.FREE.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.FREE.agi_monthly_quota).toBe(3)
      expect(PLAN_FEATURES.FREE.scraping_initial_credits).toBe(5)
      expect(PLAN_FEATURES.FREE.whatsapp_type).toBe('click_to_chat')
    })

    it('should have correct STARTER tier limits', () => {
      expect(PLAN_FEATURES.STARTER.max_deals).toBe(-1) // ilimitado
      expect(PLAN_FEATURES.STARTER.max_users).toBe(1)
      expect(PLAN_FEATURES.STARTER.max_pipelines).toBe(1)
      expect(PLAN_FEATURES.STARTER.can_use_agi).toBe(false)
      expect(PLAN_FEATURES.STARTER.scraping_monthly_credits).toBe(0)
    })

    it('should have correct PRO tier limits', () => {
      expect(PLAN_FEATURES.PRO.max_deals).toBe(-1) // ilimitado
      expect(PLAN_FEATURES.PRO.max_users).toBe(-1) // ilimitado
      expect(PLAN_FEATURES.PRO.max_pipelines).toBe(-1) // ilimitado
      expect(PLAN_FEATURES.PRO.can_use_automation).toBe(true)
      expect(PLAN_FEATURES.PRO.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.PRO.agi_monthly_quota).toBe(-1) // ilimitado
      expect(PLAN_FEATURES.PRO.scraping_monthly_credits).toBe(50)
      expect(PLAN_FEATURES.PRO.can_use_chat_interface).toBe(true)
      expect(PLAN_FEATURES.PRO.whatsapp_instances).toBe(1)
    })

    it('should have correct BUSINESS tier limits', () => {
      expect(PLAN_FEATURES.BUSINESS.max_deals).toBe(-1)
      expect(PLAN_FEATURES.BUSINESS.max_users).toBe(-1)
      expect(PLAN_FEATURES.BUSINESS.can_use_round_robin).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.can_use_team_reports).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.scraping_monthly_credits).toBe(50)
    })
  })

  describe('getQuota', () => {
    it('should return correct quota for FREE tier', () => {
      expect(getQuota('FREE', 'agi_monthly_quota')).toBe(3)
      expect(getQuota('FREE', 'scraping_initial_credits')).toBe(5)
      expect(getQuota('FREE', 'scraping_monthly_credits')).toBe(0)
    })

    it('should return correct quota for STARTER tier', () => {
      expect(getQuota('STARTER', 'agi_monthly_quota')).toBe(0)
      expect(getQuota('STARTER', 'scraping_monthly_credits')).toBe(0)
    })

    it('should return correct quota for PRO tier', () => {
      expect(getQuota('PRO', 'agi_monthly_quota')).toBe(-1) // ilimitado
      expect(getQuota('PRO', 'scraping_monthly_credits')).toBe(50)
    })

    it('should return correct quota for BUSINESS tier', () => {
      expect(getQuota('BUSINESS', 'agi_monthly_quota')).toBe(-1) // ilimitado
      expect(getQuota('BUSINESS', 'scraping_monthly_credits')).toBe(50)
    })

    it('should return 0 for non-existent quota keys', () => {
      expect(getQuota('FREE', 'non_existent_key' as any)).toBe(0)
    })
  })

  describe('getLimit', () => {
    it('should return correct limits for FREE tier', () => {
      expect(getLimit('FREE', 'max_deals')).toBe(50)
      expect(getLimit('FREE', 'max_users')).toBe(1)
      expect(getLimit('FREE', 'max_pipelines')).toBe(1)
    })

    it('should return -1 (unlimited) for STARTER deals', () => {
      expect(getLimit('STARTER', 'max_deals')).toBe(-1)
    })

    it('should return -1 (unlimited) for PRO limits', () => {
      expect(getLimit('PRO', 'max_deals')).toBe(-1)
      expect(getLimit('PRO', 'max_users')).toBe(-1)
      expect(getLimit('PRO', 'max_pipelines')).toBe(-1)
    })

    it('should return 0 for non-existent limit keys', () => {
      expect(getLimit('FREE', 'non_existent_key' as any)).toBe(0)
    })
  })

  describe('canUseFeature', () => {
    it('should allow FREE tier to use AGI with quota', () => {
      expect(canUseFeature('FREE', 'can_use_agi')).toBe(true)
    })

    it('should not allow FREE tier to use automation', () => {
      expect(canUseFeature('FREE', 'can_use_automation')).toBe(false)
    })

    it('should not allow FREE tier to use chat interface', () => {
      expect(canUseFeature('FREE', 'can_use_chat_interface')).toBe(false)
    })

    it('should not allow STARTER tier to use AGI', () => {
      expect(canUseFeature('STARTER', 'can_use_agi')).toBe(false)
    })

    it('should allow PRO tier to use automation', () => {
      expect(canUseFeature('PRO', 'can_use_automation')).toBe(true)
    })

    it('should allow PRO tier to use chat interface', () => {
      expect(canUseFeature('PRO', 'can_use_chat_interface')).toBe(true)
    })

    it('should not allow PRO tier to use round robin', () => {
      expect(canUseFeature('PRO', 'can_use_round_robin')).toBe(false)
    })

    it('should allow BUSINESS tier to use round robin', () => {
      expect(canUseFeature('BUSINESS', 'can_use_round_robin')).toBe(true)
    })

    it('should allow BUSINESS tier to use team reports', () => {
      expect(canUseFeature('BUSINESS', 'can_use_team_reports')).toBe(true)
    })

    it('should return false for non-existent features', () => {
      expect(canUseFeature('FREE', 'non_existent_feature' as any)).toBe(false)
    })
  })

  describe('getPlanFeatures', () => {
    it('should return all features for FREE tier', () => {
      const features = getPlanFeatures('FREE')
      expect(features).toEqual(PLAN_FEATURES.FREE)
    })

    it('should return all features for PRO tier', () => {
      const features = getPlanFeatures('PRO')
      expect(features).toEqual(PLAN_FEATURES.PRO)
    })
  })

  describe('Tier hierarchy', () => {
    it('should have FREE as most restrictive', () => {
      expect(PLAN_FEATURES.FREE.max_deals).toBe(50)
      expect(PLAN_FEATURES.FREE.max_users).toBe(1)
      expect(PLAN_FEATURES.FREE.can_use_automation).toBeFalsy()
    })

    it('should have STARTER with unlimited deals but limited features', () => {
      expect(PLAN_FEATURES.STARTER.max_deals).toBe(-1)
      expect(PLAN_FEATURES.STARTER.can_use_agi).toBe(false)
      expect(PLAN_FEATURES.STARTER.can_use_automation).toBeFalsy()
    })

    it('should have PRO with advanced features', () => {
      expect(PLAN_FEATURES.PRO.can_use_automation).toBe(true)
      expect(PLAN_FEATURES.PRO.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.PRO.agi_monthly_quota).toBe(-1)
    })

    it('should have BUSINESS with all features', () => {
      expect(PLAN_FEATURES.BUSINESS.can_use_round_robin).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.can_use_team_reports).toBe(true)
    })
  })

  describe('WhatsApp feature progression', () => {
    it('should have click-to-chat for FREE/STARTER', () => {
      expect(PLAN_FEATURES.FREE.whatsapp_type).toBe('click_to_chat')
      expect(PLAN_FEATURES.STARTER.whatsapp_type).toBe('click_to_chat')
    })

    it('should have chat_interface for PRO/BUSINESS', () => {
      expect(PLAN_FEATURES.PRO.can_use_chat_interface).toBe(true)
      expect(PLAN_FEATURES.PRO.whatsapp_instances).toBe(1)
      expect(PLAN_FEATURES.BUSINESS.can_use_chat_interface).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.whatsapp_instances).toBe(1)
    })
  })

  describe('Scraping credits', () => {
    it('should give FREE tier 5 initial credits', () => {
      expect(PLAN_FEATURES.FREE.scraping_initial_credits).toBe(5)
      expect(PLAN_FEATURES.FREE.scraping_monthly_credits).toBe(0)
    })

    it('should not give STARTER any scraping credits', () => {
      expect(PLAN_FEATURES.STARTER.scraping_monthly_credits).toBe(0)
      expect(PLAN_FEATURES.STARTER.scraping_initial_credits).toBeUndefined()
    })

    it('should give PRO/BUSINESS 50 monthly credits', () => {
      expect(PLAN_FEATURES.PRO.scraping_monthly_credits).toBe(50)
      expect(PLAN_FEATURES.BUSINESS.scraping_monthly_credits).toBe(50)
    })
  })

  describe('AGI quota', () => {
    it('should give FREE tier 3 generations per month', () => {
      expect(PLAN_FEATURES.FREE.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.FREE.agi_monthly_quota).toBe(3)
    })

    it('should not allow STARTER to use AGI', () => {
      expect(PLAN_FEATURES.STARTER.can_use_agi).toBe(false)
    })

    it('should give PRO/BUSINESS unlimited AGI', () => {
      expect(PLAN_FEATURES.PRO.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.PRO.agi_monthly_quota).toBe(-1)
      expect(PLAN_FEATURES.BUSINESS.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.agi_monthly_quota).toBe(-1)
    })
  })
})
