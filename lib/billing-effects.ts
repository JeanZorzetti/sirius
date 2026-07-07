/**
 * Billing effects — regras de negócio de assinatura compartilhadas entre provedores.
 *
 * Extraído de app/api/webhooks/mercadopago/route.ts para que Stripe (provedor
 * atual) e Mercado Pago (assinaturas legadas) apliquem exatamente os mesmos
 * efeitos: upgrade de tier, fundadores, créditos de scraping, quotas AgaaS,
 * programa de indicação, renovação, falha de pagamento e churn.
 */

import { prisma } from '@/lib/prisma'
import { AddonType, SubscriptionTier } from '@prisma/client'
import logger from '@/lib/logger'
import { sendEmail } from '@/lib/email'
import { PaymentConfirmationEmail } from '@/emails/templates/payment-confirmation'
import { PaymentFailureEmail } from '@/emails/templates/payment-failure'

export const MAX_PAYMENT_ATTEMPTS = 3

export type BillingProvider = 'MERCADO_PAGO' | 'STRIPE'

/** Dados de pagamento normalizados (provider-neutral). */
export interface PaymentInfo {
  provider: BillingProvider
  providerPaymentId: string | null
  amount: number
  feeAmount?: number | null
  netAmount?: number | null
  currency?: string | null
  paymentMethod?: string | null
  installments?: number | null
}

/** IDs específicos do provedor persistidos na Organization junto com o upgrade. */
export type ProviderOrgData = Partial<{
  mercadoPagoSubscriptionId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
}>

/**
 * AgaaS limits per tier — mirrors lib/agaas-quota.ts TIER_LIMITS
 */
const AGAAS_TIER_LIMITS: Record<string, { enabled: boolean; agents: number; quota: number }> = {
  FREE:     { enabled: false, agents: 0,  quota: 0 },
  STARTER:  { enabled: true,  agents: 1,  quota: 200 },
  PRO:      { enabled: true,  agents: 3,  quota: 1000 },
  BUSINESS: { enabled: true,  agents: 5,  quota: 3000 },
}

export function getAgaasDataForTier(tier: string) {
  const limits = AGAAS_TIER_LIMITS[tier] || AGAAS_TIER_LIMITS.FREE
  return {
    agaasEnabled: limits.enabled,
    agaasAgentLimit: limits.agents,
    agaasMonthlyQuota: limits.quota,
  }
}

function nextMonthDate(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function monthlyScrapingCredits(tier: SubscriptionTier): number {
  return tier === SubscriptionTier.STARTER ? 75 : tier === SubscriptionTier.PRO ? 300 : 1500
}

async function getOrgOwner(organizationId: string) {
  return prisma.user.findFirst({
    where: { organizationId },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Quando uma org paga pela primeira vez, verificar se veio via indicação.
 * - Indicado: ganha 20% de desconto nos próximos 3 meses (customPricing + customPricingExpiresAt)
 * - Indicador: acumula +15% de desconto recorrente (referralDiscount, cap 100)
 */
async function processReferralReward(referredOrgId: string) {
  try {
    const referral = await prisma.referral.findFirst({
      where: { referredOrgId, status: { in: ['PENDING', 'ACTIVE'] }, rewardGiven: false },
      include: {
        referrer: { include: { organization: true } },
        referredOrg: true,
      },
    })

    if (!referral || !referral.referredOrg) return

    // Aplicar 20% de desconto ao indicado (3 meses via customPricing)
    const basePrice = referral.referredOrg.customPricing ?? null
    if (!basePrice) {
      // Buscar o tier atual para calcular base price
      const org = await prisma.organization.findUnique({
        where: { id: referredOrgId },
        select: { tier: true },
      })
      if (org && org.tier !== 'FREE') {
        const prices: Record<string, number> = { STARTER: 67, PRO: 147, BUSINESS: 397 }
        const discountedPrice = (prices[org.tier] || 67) * 0.80
        await prisma.organization.update({
          where: { id: referredOrgId },
          data: {
            customPricing: discountedPrice,
            customPricingExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        })
      }
    }

    // Aplicar +15% ao indicador (acumulável, cap 100)
    const referrerOrg = referral.referrer.organization
    const newDiscount = Math.min(100, (referrerOrg.referralDiscount || 0) + 15)
    await prisma.organization.update({
      where: { id: referrerOrg.id },
      data: { referralDiscount: newDiscount },
    })

    // Marcar referral como recompensado
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'REWARDED',
        rewardGiven: true,
        rewardedAt: new Date(),
        discountAppliedAt: new Date(),
      },
    })

    logger.info(
      { referredOrgId, referrerOrgId: referrerOrg.id, newDiscount },
      '[REFERRAL] Reward applied'
    )
  } catch (err) {
    logger.error({ err, referredOrgId }, '[REFERRAL] Failed to process reward')
  }
}

export async function upgradePlan(
  organizationId: string,
  tier: SubscriptionTier,
  pay: PaymentInfo,
  isAnnual: boolean = false,
  providerData: ProviderOrgData = {}
) {
  logger.info({ organizationId, tier, isAnnual, provider: pay.provider }, 'Upgrading plan')

  // Atualizar organização (sync tier + plan + agaas + billing period)
  const agaasData = getAgaasDataForTier(tier)

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      tier,
      plan: tier,
      ...agaasData,
      agaasActionsUsed: 0,
      agaasQuotaResetAt: nextMonthDate(),
      billingPeriod: isAnnual ? 'ANNUAL' : 'MONTHLY',
      billingStartDate: new Date(),
      updatedAt: new Date(),
      ...providerData,
    },
  })

  // Criar registro de transação
  await prisma.transaction.create({
    data: {
      organizationId,
      type: 'PLAN_UPGRADE',
      amount: pay.amount,
      feeAmount: pay.feeAmount ?? null,
      netAmount: pay.netAmount ?? null,
      currency: pay.currency ?? 'BRL',
      status: 'COMPLETED',
      provider: pay.provider,
      providerPaymentId: pay.providerPaymentId,
      metadata: {
        tier,
        paymentMethod: pay.paymentMethod ?? null,
        installments: pay.installments ?? null,
      },
    },
  })

  // Se for plano pago, criar/resetar créditos de scraping
  if (tier !== SubscriptionTier.FREE) {
    const monthlyCredits = monthlyScrapingCredits(tier)

    await prisma.scrapingCredit.upsert({
      where: { organizationId },
      create: {
        organizationId,
        balance: monthlyCredits,
        monthlyQuota: monthlyCredits,
        usedThisMonth: 0,
        lastRefill: new Date(),
      },
      update: {
        balance: monthlyCredits,
        monthlyQuota: monthlyCredits,
        usedThisMonth: 0,
        lastRefill: new Date(),
      },
    })
  }

  // Marcar trial como CONVERTED (se estava em trial)
  await prisma.organization.update({
    where: { id: organizationId },
    data: { trialStatus: 'CONVERTED' },
  }).catch(() => {})

  // Programa de indicação: recompensar o indicador com +15% de desconto acumulável
  await processReferralReward(organizationId)

  logger.info({ organizationId, tier }, 'Plan upgraded successfully')
}

export const FOUNDER_TIER_MAP: Record<string, { tier: SubscriptionTier; price: number; scrapingQuota: number }> = {
  FOUNDER_STARTER: { tier: SubscriptionTier.STARTER, price: 39.00, scrapingQuota: 75 },
  FOUNDER_PRO:     { tier: SubscriptionTier.PRO,     price: 87.00, scrapingQuota: 300 },
  FOUNDER_BUSINESS:{ tier: SubscriptionTier.BUSINESS, price: 234.00, scrapingQuota: 1500 },
}

export async function upgradeToFounder(
  organizationId: string,
  founderPlan: string,
  pay: PaymentInfo,
  providerData: ProviderOrgData = {}
) {
  logger.info({ organizationId, founderPlan, provider: pay.provider }, '[FOUNDER] Processing founder upgrade')

  const config = FOUNDER_TIER_MAP[founderPlan]
  if (!config) {
    logger.error({ founderPlan }, '[FOUNDER] Unknown founder plan')
    return
  }

  // Contar fundadores globais para número sequencial
  const foundersCount = await prisma.organization.count({ where: { isFounder: true } })
  const founderNumber = foundersCount + 1

  const founderAgaasData = getAgaasDataForTier(config.tier)
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      tier: config.tier,
      plan: config.tier,
      isFounder: true,
      founderNumber,
      founderSince: new Date(),
      customPricing: config.price,
      failedPaymentAttempts: 0,
      ...founderAgaasData,
      agaasActionsUsed: 0,
      agaasQuotaResetAt: nextMonthDate(),
      ...providerData,
    },
  })

  // Criar registro de transação
  await prisma.transaction.create({
    data: {
      organizationId,
      type: 'PLAN_UPGRADE',
      amount: pay.amount || config.price,
      feeAmount: pay.feeAmount ?? null,
      netAmount: pay.netAmount ?? null,
      currency: pay.currency ?? 'BRL',
      status: 'COMPLETED',
      provider: pay.provider,
      providerPaymentId: pay.providerPaymentId,
      metadata: {
        tier: 'FOUNDER',
        founderNumber,
        paymentMethod: pay.paymentMethod ?? null,
      },
    },
  })

  // Inicializar créditos de scraping conforme o tier do fundador
  const sq = config.scrapingQuota
  await prisma.scrapingCredit.upsert({
    where: { organizationId },
    create: { organizationId, balance: sq, monthlyQuota: sq, usedThisMonth: 0, lastRefill: new Date() },
    update: { balance: sq, monthlyQuota: sq, usedThisMonth: 0, lastRefill: new Date() },
  })

  // Enviar email de boas-vindas ao fundador
  const owner = await getOrgOwner(organizationId)

  if (owner?.email) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    })

    const tierLabel = config.tier === SubscriptionTier.STARTER ? 'Starter'
      : config.tier === SubscriptionTier.PRO ? 'Pro' : 'Business'

    await sendEmail({
      to: owner.email,
      subject: `🌟 Bem-vindo ao Programa de Fundadores! Você é o Fundador #${founderNumber} (${tierLabel})`,
      react: PaymentConfirmationEmail({
        userName: owner.name || 'Fundador',
        organizationName: org?.name || '',
        paymentId: String(pay.providerPaymentId ?? ''),
        paymentType: pay.paymentMethod || 'credit_card',
        amount: config.price,
        nextBillingDate: (() => {
          const d = new Date()
          d.setMonth(d.getMonth() + 1)
          return d.toLocaleDateString('pt-BR')
        })(),
      }),
    }).catch(err => logger.error({ err }, '[FOUNDER] Failed to send welcome email'))
  }

  logger.info({ organizationId, founderNumber, founderPlan, tier: config.tier }, '[FOUNDER] Organization upgraded to founder successfully')
}

export async function processAddonPurchase(
  organizationId: string,
  addonType: string,
  pay: PaymentInfo
) {
  logger.info({ organizationId, addonType, provider: pay.provider }, 'Processing addon purchase')

  let quantity = 0
  let addonEnum: AddonType | null = null

  // Determinar quantidade e tipo
  if (addonType === 'SCRAPING_100') {
    quantity = 100
    addonEnum = AddonType.SCRAPING_100
  } else if (addonType === 'SCRAPING_500') {
    quantity = 500
    addonEnum = AddonType.SCRAPING_500
  } else if (addonType === 'WHATSAPP_EXTRA') {
    quantity = 1
    addonEnum = AddonType.WHATSAPP_EXTRA_INSTANCE
  }

  if (!quantity || !addonEnum) {
    logger.warn({ addonType }, 'Unknown addon type')
    return
  }

  // Criar add-on
  await prisma.addon.create({
    data: {
      organizationId,
      type: addonEnum,
      name: getAddonName(addonEnum),
      quantity,
      price: pay.amount,
      status: 'ACTIVE',
    },
  })

  // Se for scraping, adicionar créditos
  if (addonEnum.includes('SCRAPING')) {
    await prisma.scrapingCredit.update({
      where: { organizationId },
      data: {
        balance: { increment: quantity },
      },
    })
  }

  // Se for WhatsApp, incrementar instâncias
  if (addonEnum.includes('WHATSAPP')) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        whatsappInstances: { increment: 1 },
      },
    })
  }

  // Criar transação
  await prisma.transaction.create({
    data: {
      organizationId,
      type: 'ADDON_PURCHASE',
      amount: pay.amount,
      feeAmount: pay.feeAmount ?? null,
      netAmount: pay.netAmount ?? null,
      currency: pay.currency ?? 'BRL',
      status: 'COMPLETED',
      provider: pay.provider,
      providerPaymentId: pay.providerPaymentId,
      metadata: {
        addonType: addonEnum,
        quantity,
      },
    },
  })

  logger.info({ organizationId, addonEnum, quantity }, 'Addon purchased successfully')
}

/**
 * Renovação de assinatura (ciclo mensal/anual aprovado).
 * Reseta contador de falhas, quotas AgaaS e créditos de scraping; registra transação; envia email.
 */
export async function renewSubscription(
  organizationId: string,
  tier: SubscriptionTier,
  pay: PaymentInfo,
  providerData: ProviderOrgData = {}
) {
  const renewalAgaasData = getAgaasDataForTier(tier)

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      tier,
      plan: tier,
      failedPaymentAttempts: 0,
      ...renewalAgaasData,
      agaasActionsUsed: 0,
      agaasQuotaResetAt: nextMonthDate(),
      ...providerData,
    },
    select: { id: true, name: true },
  })

  // Resetar créditos mensais de scraping
  const monthlyCredits = monthlyScrapingCredits(tier)

  await prisma.scrapingCredit.upsert({
    where: { organizationId },
    create: {
      organizationId,
      balance: monthlyCredits,
      monthlyQuota: monthlyCredits,
      usedThisMonth: 0,
      lastRefill: new Date(),
    },
    update: {
      balance: { increment: monthlyCredits },
      monthlyQuota: monthlyCredits,
      usedThisMonth: 0,
      lastRefill: new Date(),
    },
  })

  // Registrar renovação
  await prisma.transaction.create({
    data: {
      organizationId,
      type: 'PLAN_UPGRADE',
      amount: pay.amount,
      feeAmount: pay.feeAmount ?? null,
      netAmount: pay.netAmount ?? null,
      currency: pay.currency ?? 'BRL',
      status: 'COMPLETED',
      provider: pay.provider,
      providerPaymentId: pay.providerPaymentId,
      metadata: {
        tier,
        type: 'renewal',
        paymentMethod: pay.paymentMethod ?? null,
      },
    },
  })

  // Enviar email de confirmação de renovação
  const owner = await getOrgOwner(organizationId)

  if (owner?.email) {
    const nextBilling = new Date()
    nextBilling.setMonth(nextBilling.getMonth() + 1)

    await sendEmail({
      to: owner.email,
      subject: '✅ Renovação confirmada – Sirius CRM',
      react: PaymentConfirmationEmail({
        userName: owner.name || 'Cliente',
        organizationName: org.name,
        paymentId: String(pay.providerPaymentId ?? ''),
        paymentType: pay.paymentMethod || 'credit_card',
        amount: pay.amount,
        nextBillingDate: nextBilling.toLocaleDateString('pt-BR'),
      }),
    }).catch(err => logger.error({ err }, '[BILLING] Failed to send renewal email'))
  }

  logger.info({ organizationId, tier, provider: pay.provider }, '[BILLING] Subscription renewed successfully')
}

/**
 * Downgrade para FREE (cancelamento ou churn por falha de pagamento).
 * Registra transação de PLAN_DOWNGRADE com o motivo.
 */
export async function downgradeToFree(
  organizationId: string,
  opts: {
    previousTier: SubscriptionTier | string
    reason: string
    provider: BillingProvider
    clearProviderIds?: boolean
    extraMetadata?: Record<string, unknown>
  }
) {
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      tier: SubscriptionTier.FREE,
      plan: 'FREE',
      billingPeriod: 'MONTHLY',
      failedPaymentAttempts: 0,
      ...getAgaasDataForTier('FREE'),
      ...(opts.clearProviderIds
        ? { mercadoPagoSubscriptionId: null, stripeSubscriptionId: null }
        : {}),
    },
  })

  await prisma.transaction.create({
    data: {
      organizationId,
      type: 'PLAN_DOWNGRADE',
      amount: 0,
      feeAmount: 0,
      netAmount: 0,
      currency: 'BRL',
      status: 'COMPLETED',
      provider: opts.provider,
      metadata: {
        reason: opts.reason,
        previousTier: opts.previousTier,
        newTier: 'FREE',
        ...(opts.extraMetadata ?? {}),
      },
    },
  })

  logger.info({ organizationId, reason: opts.reason }, '[BILLING] Plan downgraded to FREE')
}

/**
 * Falha de pagamento recorrente com retry logic manual (usado pelo Mercado Pago,
 * que não tem dunning automático). Após MAX_PAYMENT_ATTEMPTS falhas consecutivas,
 * faz downgrade para FREE. A Stripe usa o dunning nativo + sendPaymentFailureEmail.
 */
export async function handleFailedRecurringPayment(organizationId: string, provider: BillingProvider) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, tier: true, failedPaymentAttempts: true },
  })

  if (!org) return

  const newAttempts = (org.failedPaymentAttempts || 0) + 1
  const isFinal = newAttempts >= MAX_PAYMENT_ATTEMPTS

  if (isFinal) {
    await downgradeToFree(org.id, {
      previousTier: org.tier,
      reason: 'max_payment_failures',
      provider,
      extraMetadata: { attempts: newAttempts },
    })
    logger.warn({ organizationId: org.id, attempts: newAttempts }, '[BILLING] Downgraded to FREE after max failures')
  } else {
    await prisma.organization.update({
      where: { id: org.id },
      data: { failedPaymentAttempts: newAttempts },
    })
  }

  await sendPaymentFailureEmail(organizationId, newAttempts, isFinal)
}

/**
 * Email de falha de pagamento. `attemptNumber`/`isFinal` vêm do contador local
 * (Mercado Pago) ou do invoice da Stripe (attempt_count / next_payment_attempt).
 */
export async function sendPaymentFailureEmail(organizationId: string, attemptNumber: number, isFinal: boolean) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, tier: true },
  })
  if (!org) return

  const tierNames: Record<string, string> = {
    STARTER: 'Starter',
    PRO: 'Pro',
    BUSINESS: 'Business',
  }
  const planName = tierNames[org.tier] || org.tier
  const billingUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`

  const owner = await getOrgOwner(org.id)
  if (!owner?.email) return

  await sendEmail({
    to: owner.email,
    subject: isFinal
      ? `⚠️ Assinatura Sirius cancelada por falta de pagamento`
      : `❌ Falha no pagamento (${attemptNumber}/${MAX_PAYMENT_ATTEMPTS}) – Sirius CRM`,
    react: PaymentFailureEmail({
      userName: owner.name || 'Cliente',
      organizationName: org.name,
      planName,
      attemptNumber,
      maxAttempts: MAX_PAYMENT_ATTEMPTS,
      updateCardUrl: billingUrl,
      isFinal,
    }),
  }).catch(err => logger.error({ err }, '[BILLING] Failed to send failure email'))
}

export async function recordWhatsAppSetupPurchase(organizationId: string, pay: PaymentInfo) {
  logger.info({ organizationId, provider: pay.provider }, '[WHATSAPP_SETUP] Processing WhatsApp setup purchase')

  await prisma.transaction.create({
    data: {
      organizationId,
      type: 'ADDON_PURCHASE',
      amount: pay.amount || 297,
      feeAmount: pay.feeAmount ?? null,
      netAmount: pay.netAmount ?? null,
      currency: pay.currency ?? 'BRL',
      status: 'COMPLETED',
      provider: pay.provider,
      providerPaymentId: pay.providerPaymentId,
      metadata: { service: 'WHATSAPP_SETUP' },
    },
  })

  logger.info({ organizationId }, '[WHATSAPP_SETUP] Transaction recorded')
}

function getAddonName(type: string): string {
  const names: Record<string, string> = {
    'SCRAPING_100': 'Pacote 100 Leads',
    'SCRAPING_500': 'Pacote 500 Leads',
    'WHATSAPP_EXTRA_INSTANCE': 'WhatsApp Extra',
  }
  return names[type] || 'Add-on'
}
