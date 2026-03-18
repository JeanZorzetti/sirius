/**
 * Webhook: Mercado Pago
 * 
 * Recebe notificações de pagamento e atualiza assinaturas
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { SubscriptionTier } from '@prisma/client'
import logger from '@/lib/logger'
import { sendEmail } from '@/lib/email'
import { PaymentConfirmationEmail } from '@/emails/templates/payment-confirmation'
import { PaymentFailureEmail } from '@/emails/templates/payment-failure'
import { webhookRateLimit } from '@/lib/ratelimit'
import { createHmac } from 'crypto'

const MAX_PAYMENT_ATTEMPTS = 3

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

export const dynamic = 'force-dynamic'

/**
 * Valida a assinatura do webhook do Mercado Pago.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#bookmark_validar_assinatura_da_notificação
 */
function validateWebhookSignature(req: Request, rawBody: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) {
    // Em dev/staging sem secret configurado, permitir
    logger.warn('[MP:WEBHOOK] MERCADO_PAGO_WEBHOOK_SECRET not set — skipping signature validation')
    return true
  }

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  const url = new URL(req.url)
  const dataId = url.searchParams.get('data.id')

  if (!xSignature) {
    logger.warn('[MP:WEBHOOK] Missing x-signature header')
    return false
  }

  // Extrair ts e v1 do header x-signature
  const parts = Object.fromEntries(xSignature.split(',').map(p => p.split('=')))
  const ts = parts['ts']
  const v1 = parts['v1']

  if (!ts || !v1) {
    logger.warn('[MP:WEBHOOK] Invalid x-signature format')
    return false
  }

  // Construir manifest: "id:{data.id};request-id:{x-request-id};ts:{ts};"
  const manifest = [
    dataId ? `id:${dataId}` : null,
    xRequestId ? `request-id:${xRequestId}` : null,
    `ts:${ts}`,
  ].filter(Boolean).join(';') + ';'

  const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex')

  if (expectedHash !== v1) {
    logger.error({ expected: expectedHash, received: v1 }, '[MP:WEBHOOK] Invalid signature')
    return false
  }

  return true
}

export async function POST(req: NextRequest) {
  const blocked = await webhookRateLimit(req)
  if (blocked) return blocked

  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)

    // Validar assinatura do webhook
    if (!validateWebhookSignature(req, rawBody)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    logger.info({ type: body.type, data: body.data }, 'MercadoPago webhook received')

    // Processar apenas pagamentos aprovados
    if (body.type === 'payment') {
      const paymentId = body.data.id
      
      // Buscar detalhes do pagamento
      const payment = await new Payment(mp).get({ id: paymentId })
      
      logger.info({ 
        paymentId, 
        status: payment.status,
        externalReference: payment.external_reference,
      }, 'Payment details')

      // Apenas processar pagamentos aprovados
      if (payment.status === 'approved') {
        await processApprovedPayment(payment)
      }
    }

    // ✅ FASE 16: Processar assinaturas (recorrência)
    if (body.type === 'subscription_preapproval' || body.type === 'preapproval') {
      const preapprovalId = body.data?.id
      if (preapprovalId) {
        await processSubscriptionEvent(preapprovalId, body.action)
      }
    }

    // Pagamento recorrente (renovação mensal)
    if (body.type === 'subscription_authorized_payment') {
      const paymentId = body.data?.id
      if (paymentId) {
        await processRecurringPayment(paymentId)
      }
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    logger.error({ error: error.message }, 'MercadoPago webhook error')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function processApprovedPayment(payment: any) {
  const externalReference = payment.external_reference
  
  if (!externalReference) {
    logger.warn({ paymentId: payment.id }, 'No external reference')
    return
  }

  // Parse external_reference: "orgId_PLAN" ou "orgId_ADDON_TYPE" ou "orgId_FOUNDER_TIER"
  // Usar split no primeiro '_' apenas para preservar compostos como FOUNDER_STARTER, SCRAPING_100
  const underscoreIdx = externalReference.indexOf('_')

  if (underscoreIdx === -1) {
    logger.warn({ externalReference }, 'Invalid external reference format')
    return
  }

  const organizationId = externalReference.substring(0, underscoreIdx)
  const tierOrAddon = externalReference.substring(underscoreIdx + 1)

  // Programa de Fundadores (FOUNDER_STARTER | FOUNDER_PRO | FOUNDER_BUSINESS)
  if (tierOrAddon.startsWith('FOUNDER_')) {
    await upgradeToFounder(organizationId, tierOrAddon, payment)
    return
  }

  // Verificar se é upgrade de plano
  if (Object.values(SubscriptionTier).includes(tierOrAddon as SubscriptionTier)) {
    await upgradePlan(organizationId, tierOrAddon as SubscriptionTier, payment)
  } else {
    // É um add-on
    await processAddonPurchase(organizationId, tierOrAddon, payment)
  }
}

async function upgradePlan(
  organizationId: string, 
  tier: SubscriptionTier,
  payment: any
) {
  logger.info({ organizationId, tier }, 'Upgrading plan')

  // Atualizar organização (sync tier + plan para compatibilidade)
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      tier,
      plan: tier,
      updatedAt: new Date(),
    },
  })

  // Criar registro de transação
  await prisma.transaction.create({
    data: {
      organizationId,
      type: 'PLAN_UPGRADE',
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: 'COMPLETED',
      provider: 'MERCADO_PAGO',
      providerPaymentId: payment.id,
      metadata: {
        tier,
        paymentMethod: payment.payment_method_id,
        installments: payment.installments,
      },
    },
  })

  // Se for plano pago, criar/resetar créditos de scraping
  if (tier !== SubscriptionTier.FREE) {
    const monthlyCredits = tier === SubscriptionTier.STARTER ? 50 : 
                          tier === SubscriptionTier.PRO ? 200 : 1000

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

  logger.info({ organizationId, tier }, 'Plan upgraded successfully')
}

const FOUNDER_TIER_MAP: Record<string, { tier: SubscriptionTier; price: number; scrapingQuota: number }> = {
  FOUNDER_STARTER: { tier: SubscriptionTier.STARTER, price: 29.00, scrapingQuota: 50 },
  FOUNDER_PRO:     { tier: SubscriptionTier.PRO,     price: 57.00, scrapingQuota: 200 },
  FOUNDER_BUSINESS:{ tier: SubscriptionTier.BUSINESS, price: 88.00, scrapingQuota: 1000 },
}

async function upgradeToFounder(organizationId: string, founderPlan: string, payment: any) {
  logger.info({ organizationId, founderPlan }, '[MP:FOUNDER] Processing founder upgrade')

  const config = FOUNDER_TIER_MAP[founderPlan]
  if (!config) {
    logger.error({ founderPlan }, '[MP:FOUNDER] Unknown founder plan')
    return
  }

  // Contar fundadores globais para número sequencial
  const foundersCount = await prisma.organization.count({ where: { isFounder: true } })
  const founderNumber = foundersCount + 1

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
    },
  })

  // Criar registro de transação
  await prisma.transaction.create({
    data: {
      organizationId,
      type: 'PLAN_UPGRADE',
      amount: payment.transaction_amount ?? 29,
      currency: payment.currency_id ?? 'BRL',
      status: 'COMPLETED',
      provider: 'MERCADO_PAGO',
      providerPaymentId: String(payment.id),
      metadata: {
        tier: 'FOUNDER',
        founderNumber,
        paymentMethod: payment.payment_method_id,
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
  const owner = await prisma.user.findFirst({
    where: { organizationId },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

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
        paymentId: String(payment.id),
        paymentType: payment.payment_method_id || 'credit_card',
        amount: config.price,
        nextBillingDate: (() => {
          const d = new Date()
          d.setMonth(d.getMonth() + 1)
          return d.toLocaleDateString('pt-BR')
        })(),
      }),
    }).catch(err => logger.error({ err }, '[MP:FOUNDER] Failed to send welcome email'))
  }

  logger.info({ organizationId, founderNumber, founderPlan, tier: config.tier }, '[MP:FOUNDER] Organization upgraded to founder successfully')
}

async function processAddonPurchase(
  organizationId: string,
  addonType: string,
  payment: any
) {
  logger.info({ organizationId, addonType }, 'Processing addon purchase')

  let quantity = 0
  let addonEnum = ''

  // Determinar quantidade e tipo
  if (addonType === 'SCRAPING_100') {
    quantity = 100
    addonEnum = 'SCRAPING_100'
  } else if (addonType === 'SCRAPING_500') {
    quantity = 500
    addonEnum = 'SCRAPING_500'
  } else if (addonType === 'WHATSAPP_EXTRA') {
    quantity = 1
    addonEnum = 'WHATSAPP_EXTRA_INSTANCE'
  }

  if (!quantity) {
    logger.warn({ addonType }, 'Unknown addon type')
    return
  }

  // Criar add-on
  await prisma.addon.create({
    data: {
      organizationId,
      type: addonEnum as any,
      name: getAddonName(addonEnum),
      quantity,
      price: payment.transaction_amount,
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
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: 'COMPLETED',
      provider: 'MERCADO_PAGO',
      providerPaymentId: payment.id,
      metadata: {
        addonType: addonEnum,
        quantity,
      },
    },
  })

  logger.info({ organizationId, addonEnum, quantity }, 'Addon purchased successfully')
}

/**
 * ✅ FASE 16: Processa eventos de assinatura (aprovação, cancelamento, pausa)
 */
async function processSubscriptionEvent(preapprovalId: string, action: string) {
  logger.info({ preapprovalId, action }, '[MP:SUBSCRIPTION] Processing subscription event')

  try {
    // Buscar organização pelo subscription ID
    const org = await prisma.organization.findFirst({
      where: { mercadoPagoSubscriptionId: preapprovalId },
      select: { id: true, tier: true },
    })

    if (!org) {
      logger.warn({ preapprovalId }, '[MP:SUBSCRIPTION] Organization not found for subscription')
      return
    }

    if (action === 'subscription_preapproval.cancelled' || action === 'cancelled') {
      // Downgrade para FREE ao cancelar (sync tier + plan)
      await prisma.organization.update({
        where: { id: org.id },
        data: { tier: SubscriptionTier.FREE, plan: 'FREE' },
      })

      // Registrar downgrade como churn
      await prisma.transaction.create({
        data: {
          organizationId: org.id,
          type: 'PLAN_DOWNGRADE',
          amount: 0,
          currency: 'BRL',
          status: 'COMPLETED',
          provider: 'MERCADO_PAGO',
          metadata: {
            reason: 'subscription_cancelled',
            previousTier: org.tier,
            newTier: 'FREE',
          },
        },
      })

      logger.info({ organizationId: org.id }, '[MP:SUBSCRIPTION] Plan downgraded to FREE (cancelled)')
    }

    if (action === 'subscription_preapproval.paused' || action === 'paused') {
      // Manter plano mas registrar pausa
      logger.info({ organizationId: org.id }, '[MP:SUBSCRIPTION] Subscription paused')
    }
  } catch (err) {
    logger.error({ err, preapprovalId }, '[MP:SUBSCRIPTION] Error processing subscription event')
  }
}

/**
 * ✅ FASE 16: Processa pagamento recorrente (renovação mensal)
 * - Aprovado: renova tier + reseta créditos + envia email de confirmação
 * - Rejeitado: incrementa tentativas (máx 3) → cancela e faz downgrade
 */
async function processRecurringPayment(paymentId: string) {
  logger.info({ paymentId }, '[MP:RECURRING] Processing recurring payment')

  try {
    const payment = await new Payment(mp).get({ id: paymentId })

    const externalReference = payment.external_reference
    if (!externalReference) {
      logger.warn({ paymentId }, '[MP:RECURRING] No external reference')
      return
    }

    const [organizationId, tier] = externalReference.split('_')
    if (!organizationId) return

    // Pagamento rejeitado → retry logic
    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await handleFailedRecurringPayment(organizationId, payment)
      return
    }

    if (payment.status !== 'approved') {
      logger.info({ paymentId, status: payment.status }, '[MP:RECURRING] Payment pending, skipping')
      return
    }

    const subscriptionTier = (tier || 'PRO') as SubscriptionTier

    // Renovação aprovada: resetar contador de falhas (sync tier + plan)
    const org = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        tier: subscriptionTier,
        plan: subscriptionTier,
        failedPaymentAttempts: 0,
      },
      select: { id: true, name: true },
    })

    // Resetar créditos mensais de scraping
    const monthlyCredits = subscriptionTier === SubscriptionTier.STARTER ? 50
      : subscriptionTier === SubscriptionTier.PRO ? 200 : 1000

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
        amount: payment.transaction_amount ?? 0,
        currency: payment.currency_id ?? 'BRL',
        status: 'COMPLETED',
        provider: 'MERCADO_PAGO',
        providerPaymentId: String(payment.id),
        metadata: {
          tier: subscriptionTier,
          type: 'renewal',
          paymentMethod: payment.payment_method_id,
        },
      },
    })

    // Enviar email de confirmação de renovação
    const owner = await prisma.user.findFirst({
      where: { organizationId },
      select: { email: true, name: true },
      orderBy: { createdAt: 'asc' },
    })

    if (owner?.email) {
      const nextBilling = new Date()
      nextBilling.setMonth(nextBilling.getMonth() + 1)

      await sendEmail({
        to: owner.email,
        subject: '✅ Renovação confirmada – Sirius CRM',
        react: PaymentConfirmationEmail({
          userName: owner.name || 'Cliente',
          organizationName: org.name,
          paymentId: String(payment.id),
          paymentType: payment.payment_method_id || 'credit_card',
          amount: parseFloat(String(payment.transaction_amount ?? 0)),
          nextBillingDate: nextBilling.toLocaleDateString('pt-BR'),
        }),
      }).catch(err => logger.error({ err }, '[MP:RECURRING] Failed to send renewal email'))
    }

    logger.info({ organizationId, tier: subscriptionTier }, '[MP:RECURRING] Subscription renewed successfully')
  } catch (err) {
    logger.error({ err, paymentId }, '[MP:RECURRING] Error processing recurring payment')
  }
}

/**
 * Trata falha de pagamento recorrente com retry logic.
 * Após MAX_PAYMENT_ATTEMPTS falhas consecutivas, faz downgrade para FREE.
 */
async function handleFailedRecurringPayment(organizationId: string, payment: any) {
  logger.info({ organizationId, paymentStatus: payment.status }, '[MP:RECURRING] Handling failed payment')

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, tier: true, failedPaymentAttempts: true },
  })

  if (!org) return

  const tierNames: Record<string, string> = {
    STARTER: 'Starter',
    PRO: 'Pro',
    BUSINESS: 'Business',
  }
  const planName = tierNames[org.tier] || org.tier
  const newAttempts = (org.failedPaymentAttempts || 0) + 1
  const isFinal = newAttempts >= MAX_PAYMENT_ATTEMPTS

  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`

  if (isFinal) {
    // Downgrade para FREE após atingir o limite (sync tier + plan)
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        tier: SubscriptionTier.FREE,
        plan: 'FREE',
        failedPaymentAttempts: 0,
      },
    })

    await prisma.transaction.create({
      data: {
        organizationId: org.id,
        type: 'PLAN_DOWNGRADE',
        amount: 0,
        currency: 'BRL',
        status: 'COMPLETED',
        provider: 'MERCADO_PAGO',
        metadata: {
          reason: 'max_payment_failures',
          previousTier: org.tier,
          newTier: 'FREE',
          attempts: newAttempts,
        },
      },
    })

    logger.warn({ organizationId: org.id, attempts: newAttempts }, '[MP:RECURRING] Downgraded to FREE after max failures')
  } else {
    await prisma.organization.update({
      where: { id: org.id },
      data: { failedPaymentAttempts: newAttempts },
    })
  }

  // Enviar email de falha
  const owner = await prisma.user.findFirst({
    where: { organizationId: org.id },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  if (owner?.email) {
    await sendEmail({
      to: owner.email,
      subject: isFinal
        ? `⚠️ Assinatura Sirius cancelada por falta de pagamento`
        : `❌ Falha no pagamento (${newAttempts}/${MAX_PAYMENT_ATTEMPTS}) – Sirius CRM`,
      react: PaymentFailureEmail({
        userName: owner.name || 'Cliente',
        organizationName: org.name,
        planName,
        attemptNumber: newAttempts,
        maxAttempts: MAX_PAYMENT_ATTEMPTS,
        updateCardUrl: billingUrl,
        isFinal,
      }),
    }).catch(err => logger.error({ err }, '[MP:RECURRING] Failed to send failure email'))
  }
}

function getAddonName(type: string): string {
  const names: Record<string, string> = {
    'SCRAPING_100': 'Pacote 100 Leads',
    'SCRAPING_500': 'Pacote 500 Leads',
    'WHATSAPP_EXTRA_INSTANCE': 'WhatsApp Extra',
  }
  return names[type] || 'Add-on'
}
