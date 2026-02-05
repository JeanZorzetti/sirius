/**
 * Testes para configuração de produtos do Mercado Pago
 */

import { describe, it, expect } from 'vitest'
import {
  PLANS,
  ADDONS,
  getPlanConfig,
  getAddonConfig,
  isValidPlan,
  isValidAddon,
  calculateProrationAmount,
  formatPrice,
} from '../products'

describe('Mercado Pago Products', () => {
  describe('PLANS', () => {
    it('should have all 4 tiers', () => {
      expect(PLANS.FREE).toBeDefined()
      expect(PLANS.STARTER).toBeDefined()
      expect(PLANS.PRO).toBeDefined()
      expect(PLANS.BUSINESS).toBeDefined()
    })

    it('should have correct pricing', () => {
      expect(PLANS.FREE.price).toBe(0)
      expect(PLANS.STARTER.price).toBe(49)
      expect(PLANS.PRO.price).toBe(97)
      expect(PLANS.BUSINESS.price).toBe(149)
    })

    it('should have BRL currency for all plans', () => {
      expect(PLANS.FREE.currency).toBe('BRL')
      expect(PLANS.STARTER.currency).toBe('BRL')
      expect(PLANS.PRO.currency).toBe('BRL')
      expect(PLANS.BUSINESS.currency).toBe('BRL')
    })

    it('should have monthly frequency for all plans', () => {
      expect(PLANS.FREE.frequency).toBe('monthly')
      expect(PLANS.STARTER.frequency).toBe('monthly')
      expect(PLANS.PRO.frequency).toBe('monthly')
      expect(PLANS.BUSINESS.frequency).toBe('monthly')
    })

    it('should have NULL id for FREE (no payment)', () => {
      expect(PLANS.FREE.id).toBeNull()
    })

    it('should have Mercado Pago IDs for paid plans', () => {
      expect(PLANS.STARTER.id).toBeTruthy()
      expect(PLANS.PRO.id).toBeTruthy()
      expect(PLANS.BUSINESS.id).toBeTruthy()
    })

    it('should have feature lists', () => {
      expect(PLANS.FREE.features).toBeInstanceOf(Array)
      expect(PLANS.FREE.features.length).toBeGreaterThan(0)
      expect(PLANS.STARTER.features.length).toBeGreaterThan(0)
      expect(PLANS.PRO.features.length).toBeGreaterThan(0)
      expect(PLANS.BUSINESS.features.length).toBeGreaterThan(0)
    })
  })

  describe('ADDONS', () => {
    it('should have all 3 addon types', () => {
      expect(ADDONS.SCRAPING_100).toBeDefined()
      expect(ADDONS.SCRAPING_500).toBeDefined()
      expect(ADDONS.WHATSAPP_EXTRA_INSTANCE).toBeDefined()
    })

    it('should have correct pricing', () => {
      expect(ADDONS.SCRAPING_100.price).toBe(29.9)
      expect(ADDONS.SCRAPING_500.price).toBe(99.9)
      expect(ADDONS.WHATSAPP_EXTRA_INSTANCE.price).toBe(29.9)
    })

    it('should have correct quantities', () => {
      expect(ADDONS.SCRAPING_100.quantity).toBe(100)
      expect(ADDONS.SCRAPING_500.quantity).toBe(500)
      expect(ADDONS.WHATSAPP_EXTRA_INSTANCE.quantity).toBe(1)
    })

    it('should have correct recurring flags', () => {
      expect(ADDONS.SCRAPING_100.recurring).toBe(false) // Compra única
      expect(ADDONS.SCRAPING_500.recurring).toBe(false) // Compra única
      expect(ADDONS.WHATSAPP_EXTRA_INSTANCE.recurring).toBe(true) // Assinatura
    })

    it('should have names and descriptions', () => {
      expect(ADDONS.SCRAPING_100.name).toBeTruthy()
      expect(ADDONS.SCRAPING_100.description).toBeTruthy()
      expect(ADDONS.SCRAPING_500.name).toBeTruthy()
      expect(ADDONS.SCRAPING_500.description).toBeTruthy()
      expect(ADDONS.WHATSAPP_EXTRA_INSTANCE.name).toBeTruthy()
      expect(ADDONS.WHATSAPP_EXTRA_INSTANCE.description).toBeTruthy()
    })
  })

  describe('getPlanConfig', () => {
    it('should return correct plan config for FREE', () => {
      const config = getPlanConfig('FREE')
      expect(config.price).toBe(0)
      expect(config.name).toBe('Grátis')
    })

    it('should return correct plan config for STARTER', () => {
      const config = getPlanConfig('STARTER')
      expect(config.price).toBe(49)
      expect(config.name).toBe('Starter')
    })

    it('should return correct plan config for PRO', () => {
      const config = getPlanConfig('PRO')
      expect(config.price).toBe(97)
      expect(config.name).toBe('PRO')
    })

    it('should return correct plan config for BUSINESS', () => {
      const config = getPlanConfig('BUSINESS')
      expect(config.price).toBe(149)
      expect(config.name).toBe('Business')
    })
  })

  describe('getAddonConfig', () => {
    it('should return correct addon config for SCRAPING_100', () => {
      const config = getAddonConfig('SCRAPING_100')
      expect(config.price).toBe(29.9)
      expect(config.quantity).toBe(100)
    })

    it('should return correct addon config for SCRAPING_500', () => {
      const config = getAddonConfig('SCRAPING_500')
      expect(config.price).toBe(99.9)
      expect(config.quantity).toBe(500)
    })

    it('should return correct addon config for WHATSAPP_EXTRA_INSTANCE', () => {
      const config = getAddonConfig('WHATSAPP_EXTRA_INSTANCE')
      expect(config.price).toBe(29.9)
      expect(config.recurring).toBe(true)
    })
  })

  describe('isValidPlan', () => {
    it('should return true for valid tiers', () => {
      expect(isValidPlan('FREE')).toBe(true)
      expect(isValidPlan('STARTER')).toBe(true)
      expect(isValidPlan('PRO')).toBe(true)
      expect(isValidPlan('BUSINESS')).toBe(true)
    })

    it('should return false for invalid tiers', () => {
      expect(isValidPlan('INVALID')).toBe(false)
      expect(isValidPlan('ENTERPRISE')).toBe(false)
      expect(isValidPlan('')).toBe(false)
    })
  })

  describe('isValidAddon', () => {
    it('should return true for valid addons', () => {
      expect(isValidAddon('SCRAPING_100')).toBe(true)
      expect(isValidAddon('SCRAPING_500')).toBe(true)
      expect(isValidAddon('WHATSAPP_EXTRA_INSTANCE')).toBe(true)
    })

    it('should return false for invalid addons', () => {
      expect(isValidAddon('INVALID')).toBe(false)
      expect(isValidAddon('SCRAPING_1000')).toBe(false)
      expect(isValidAddon('')).toBe(false)
    })
  })

  describe('calculateProrationAmount', () => {
    it('should calculate proration for upgrade', () => {
      // STARTER (49) → PRO (97)
      // Diferença: R$ 48
      // 15 dias restantes: (48 / 30) * 15 = R$ 24
      const amount = calculateProrationAmount('STARTER', 'PRO', 15)
      expect(amount).toBe(24)
    })

    it('should calculate proration for full month', () => {
      // STARTER (49) → PRO (97)
      // Diferença: R$ 48
      // 30 dias: R$ 48
      const amount = calculateProrationAmount('STARTER', 'PRO', 30)
      expect(amount).toBe(48)
    })

    it('should calculate proration for PRO → BUSINESS', () => {
      // PRO (97) → BUSINESS (149)
      // Diferença: R$ 52
      // 15 dias: (52 / 30) * 15 = R$ 26
      const amount = calculateProrationAmount('PRO', 'BUSINESS', 15)
      expect(amount).toBe(26)
    })

    it('should return 0 for same tier', () => {
      const amount = calculateProrationAmount('PRO', 'PRO', 15)
      expect(amount).toBe(0)
    })

    it('should return 0 for downgrade', () => {
      // Não permitimos downgrade, então retorna 0
      const amount = calculateProrationAmount('PRO', 'STARTER', 15)
      expect(amount).toBe(0)
    })

    it('should handle 1 day remaining', () => {
      // STARTER → PRO: (48 / 30) * 1 = R$ 1.60
      const amount = calculateProrationAmount('STARTER', 'PRO', 1)
      expect(amount).toBe(1.6)
    })

    it('should round to 2 decimal places', () => {
      // FREE (0) → STARTER (49): (49 / 30) * 7 = 11.43333...
      const amount = calculateProrationAmount('FREE', 'STARTER', 7)
      expect(amount).toBe(11.43)
    })
  })

  describe('formatPrice', () => {
    it('should format price in BRL', () => {
      expect(formatPrice(49)).toBe('R$ 49,00')
      expect(formatPrice(97)).toBe('R$ 97,00')
      expect(formatPrice(149)).toBe('R$ 149,00')
    })

    it('should format decimals correctly', () => {
      expect(formatPrice(29.9)).toBe('R$ 29,90')
      expect(formatPrice(99.9)).toBe('R$ 99,90')
    })

    it('should format zero', () => {
      expect(formatPrice(0)).toBe('R$ 0,00')
    })

    it('should format large numbers', () => {
      expect(formatPrice(1000)).toBe('R$ 1.000,00')
      expect(formatPrice(12345.67)).toBe('R$ 12.345,67')
    })
  })

  describe('Price hierarchy', () => {
    it('should have increasing prices', () => {
      expect(PLANS.FREE.price).toBeLessThan(PLANS.STARTER.price)
      expect(PLANS.STARTER.price).toBeLessThan(PLANS.PRO.price)
      expect(PLANS.PRO.price).toBeLessThan(PLANS.BUSINESS.price)
    })

    it('should have addon pack 500 cheaper per credit than pack 100', () => {
      const pricePerCredit100 = ADDONS.SCRAPING_100.price / ADDONS.SCRAPING_100.quantity
      const pricePerCredit500 = ADDONS.SCRAPING_500.price / ADDONS.SCRAPING_500.quantity

      expect(pricePerCredit500).toBeLessThan(pricePerCredit100)
    })
  })
})
