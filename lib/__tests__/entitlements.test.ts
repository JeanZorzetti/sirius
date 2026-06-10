/**
 * Testes para o sistema de entitlements
 *
 * Asserções alinhadas à matriz vigente de PLAN_FEATURES (lib/entitlements.ts).
 * Se os planos mudarem, atualizar aqui junto — este teste protege contra
 * mudanças acidentais de pricing/limites.
 */

import { describe, it, expect } from 'vitest'
import {
  PLAN_FEATURES,
  getQuota,
  getLimit,
  canUseFeature,
} from '../entitlements'

describe('Entitlements System', () => {
  describe('PLAN_FEATURES', () => {
    it('should have all tiers defined', () => {
      expect(PLAN_FEATURES.FREE).toBeDefined()
      expect(PLAN_FEATURES.STARTER).toBeDefined()
      expect(PLAN_FEATURES.PRO).toBeDefined()
      expect(PLAN_FEATURES.BUSINESS).toBeDefined()
    })

    it('should have correct FREE tier limits', () => {
      expect(PLAN_FEATURES.FREE.max_deals).toBe(100)
      expect(PLAN_FEATURES.FREE.max_users).toBe(2)
      expect(PLAN_FEATURES.FREE.max_pipelines).toBe(1)
      expect(PLAN_FEATURES.FREE.max_contacts).toBe(250)
      expect(PLAN_FEATURES.FREE.can_use_agi).toBe(false)
      expect(PLAN_FEATURES.FREE.agi_monthly_quota).toBe(0)
      expect(PLAN_FEATURES.FREE.scraping_initial_credits).toBe(0)
    })

    it('should have correct STARTER tier limits', () => {
      expect(PLAN_FEATURES.STARTER.max_deals).toBe(500)
      expect(PLAN_FEATURES.STARTER.max_users).toBe(5)
      expect(PLAN_FEATURES.STARTER.max_pipelines).toBe(5)
      expect(PLAN_FEATURES.STARTER.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.STARTER.agi_monthly_quota).toBe(200)
      expect(PLAN_FEATURES.STARTER.scraping_monthly_credits).toBe(75)
    })

    it('should have correct PRO tier limits', () => {
      expect(PLAN_FEATURES.PRO.max_deals).toBe(2500)
      expect(PLAN_FEATURES.PRO.max_users).toBe(15)
      expect(PLAN_FEATURES.PRO.max_pipelines).toBe(15)
      expect(PLAN_FEATURES.PRO.can_use_automation).toBe(true)
      expect(PLAN_FEATURES.PRO.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.PRO.agi_monthly_quota).toBe(1000)
      expect(PLAN_FEATURES.PRO.scraping_monthly_credits).toBe(300)
      // Chat WhatsApp (WABA) é exclusivo do BUSINESS
      expect(PLAN_FEATURES.PRO.can_use_chat_interface).toBe(false)
    })

    it('should have correct BUSINESS tier limits', () => {
      expect(PLAN_FEATURES.BUSINESS.max_deals).toBe(-1) // ilimitado
      expect(PLAN_FEATURES.BUSINESS.max_users).toBe(50)
      expect(PLAN_FEATURES.BUSINESS.max_contacts).toBe(-1) // ilimitado
      expect(PLAN_FEATURES.BUSINESS.can_use_round_robin).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.can_use_team_reports).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.can_use_chat_interface).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.scraping_monthly_credits).toBe(1500)
    })
  })

  describe('getQuota', () => {
    it('should return correct quota for FREE tier', () => {
      expect(getQuota('FREE', 'agi_monthly_quota')).toBe(0)
      expect(getQuota('FREE', 'scraping_initial_credits')).toBe(0)
      expect(getQuota('FREE', 'scraping_monthly_credits')).toBe(0)
    })

    it('should return correct quota for STARTER tier', () => {
      expect(getQuota('STARTER', 'agi_monthly_quota')).toBe(200)
      expect(getQuota('STARTER', 'scraping_monthly_credits')).toBe(75)
    })

    it('should return correct quota for PRO tier', () => {
      expect(getQuota('PRO', 'agi_monthly_quota')).toBe(1000)
      expect(getQuota('PRO', 'scraping_monthly_credits')).toBe(300)
    })

    it('should return correct quota for BUSINESS tier', () => {
      expect(getQuota('BUSINESS', 'agi_monthly_quota')).toBe(3000)
      expect(getQuota('BUSINESS', 'scraping_monthly_credits')).toBe(1500)
    })

    it('should return 0 for non-existent quota keys', () => {
      expect(getQuota('FREE', 'non_existent_key' as any)).toBe(0)
    })
  })

  describe('getLimit', () => {
    it('should return correct limits for FREE tier', () => {
      expect(getLimit('FREE', 'max_deals')).toBe(100)
      expect(getLimit('FREE', 'max_users')).toBe(2)
      expect(getLimit('FREE', 'max_pipelines')).toBe(1)
    })

    it('should return finite limits for STARTER and PRO', () => {
      expect(getLimit('STARTER', 'max_deals')).toBe(500)
      expect(getLimit('PRO', 'max_deals')).toBe(2500)
    })

    it('should return -1 (unlimited) for BUSINESS deals and contacts', () => {
      expect(getLimit('BUSINESS', 'max_deals')).toBe(-1)
      expect(getLimit('BUSINESS', 'max_contacts')).toBe(-1)
      expect(getLimit('BUSINESS', 'max_tasks')).toBe(-1)
    })

    it('should return 0 for non-existent limit keys', () => {
      expect(getLimit('FREE', 'non_existent_key' as any)).toBe(0)
    })
  })

  describe('canUseFeature', () => {
    it('should not allow FREE tier to use AGI', () => {
      expect(canUseFeature('FREE', 'can_use_agi')).toBe(false)
    })

    it('should not allow FREE tier to use automation', () => {
      expect(canUseFeature('FREE', 'can_use_automation')).toBe(false)
    })

    it('should not allow FREE tier to use chat interface', () => {
      expect(canUseFeature('FREE', 'can_use_chat_interface')).toBe(false)
    })

    it('should allow STARTER tier to use AGI', () => {
      expect(canUseFeature('STARTER', 'can_use_agi')).toBe(true)
    })

    it('should allow PRO tier to use automation', () => {
      expect(canUseFeature('PRO', 'can_use_automation')).toBe(true)
    })

    it('should not allow PRO tier to use chat interface (BUSINESS-only)', () => {
      expect(canUseFeature('PRO', 'can_use_chat_interface')).toBe(false)
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

  describe('Tier hierarchy', () => {
    it('should have FREE as most restrictive', () => {
      expect(PLAN_FEATURES.FREE.max_deals).toBe(100)
      expect(PLAN_FEATURES.FREE.max_users).toBe(2)
      expect(PLAN_FEATURES.FREE.can_use_automation).toBeFalsy()
    })

    it('should scale limits monotonically across tiers', () => {
      expect(PLAN_FEATURES.STARTER.max_deals).toBeGreaterThan(PLAN_FEATURES.FREE.max_deals)
      expect(PLAN_FEATURES.PRO.max_deals).toBeGreaterThan(PLAN_FEATURES.STARTER.max_deals)
      expect(PLAN_FEATURES.BUSINESS.max_deals).toBe(-1)
      expect(PLAN_FEATURES.PRO.agi_monthly_quota).toBeGreaterThan(PLAN_FEATURES.STARTER.agi_monthly_quota)
      expect(PLAN_FEATURES.BUSINESS.agi_monthly_quota).toBeGreaterThan(PLAN_FEATURES.PRO.agi_monthly_quota)
    })

    it('should have PRO with advanced features', () => {
      expect(PLAN_FEATURES.PRO.can_use_automation).toBe(true)
      expect(PLAN_FEATURES.PRO.can_use_agi).toBe(true)
      expect(PLAN_FEATURES.PRO.can_use_task_analytics).toBe(true)
    })

    it('should have BUSINESS with all features', () => {
      expect(PLAN_FEATURES.BUSINESS.can_use_round_robin).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.can_use_team_reports).toBe(true)
      expect(PLAN_FEATURES.BUSINESS.can_use_chat_interface).toBe(true)
    })
  })

  describe('WhatsApp feature progression', () => {
    // whatsapp_type/whatsapp_instances saíram de PLAN_FEATURES na migração WABA.
    it('should restrict chat_interface to BUSINESS', () => {
      expect(PLAN_FEATURES.FREE.can_use_chat_interface).toBe(false)
      expect(PLAN_FEATURES.STARTER.can_use_chat_interface).toBe(false)
      expect(PLAN_FEATURES.PRO.can_use_chat_interface).toBe(false)
      expect(PLAN_FEATURES.BUSINESS.can_use_chat_interface).toBe(true)
    })
  })

  describe('Scraping credits', () => {
    it('should give FREE tier no credits', () => {
      expect(PLAN_FEATURES.FREE.scraping_initial_credits).toBe(0)
      expect(PLAN_FEATURES.FREE.scraping_monthly_credits).toBe(0)
    })

    it('should scale credits across paid tiers', () => {
      expect(PLAN_FEATURES.STARTER.scraping_monthly_credits).toBe(75)
      expect(PLAN_FEATURES.PRO.scraping_monthly_credits).toBe(300)
      expect(PLAN_FEATURES.BUSINESS.scraping_monthly_credits).toBe(1500)
    })
  })

  describe('AGI quota', () => {
    it('should not give FREE tier AGI access', () => {
      expect(PLAN_FEATURES.FREE.can_use_agi).toBe(false)
      expect(PLAN_FEATURES.FREE.agi_monthly_quota).toBe(0)
    })

    it('should give paid tiers increasing AGI quotas', () => {
      expect(PLAN_FEATURES.STARTER.agi_monthly_quota).toBe(200)
      expect(PLAN_FEATURES.PRO.agi_monthly_quota).toBe(1000)
      expect(PLAN_FEATURES.BUSINESS.agi_monthly_quota).toBe(3000)
    })
  })
})
