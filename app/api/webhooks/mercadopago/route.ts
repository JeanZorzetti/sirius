/**
 * Webhook: Mercado Pago
 * 
 * Recebe notificações de pagamento e atualiza assinaturas
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { SubscriptionTier } from '@prisma/client'
import logger from '@/lib/logger'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // Verificar signature (em produção, implementar validação completa)
    const body = await req.json()
    
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

  // Parse external_reference: "orgId_tier" ou "orgId_addon_type"
  const parts = externalReference.split('_')
  
  if (parts.length < 2) {
    logger.warn({ externalReference }, 'Invalid external reference format')
    return
  }

  const organizationId = parts[0]
  const tierOrAddon = parts[1]

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

  // Atualizar organização
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      tier,
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
      // Downgrade para FREE ao cancelar
      await prisma.organization.update({
        where: { id: org.id },
        data: { tier: SubscriptionTier.FREE },
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
 * Renova o tier da organização e reseta créditos mensais
 */
async function processRecurringPayment(paymentId: string) {
  logger.info({ paymentId }, '[MP:RECURRING] Processing recurring payment')

  try {
    const payment = await new Payment(mp).get({ id: paymentId })

    if (payment.status !== 'approved') {
      logger.info({ paymentId, status: payment.status }, '[MP:RECURRING] Payment not approved, skipping')
      return
    }

    const externalReference = payment.external_reference
    if (!externalReference) {
      logger.warn({ paymentId }, '[MP:RECURRING] No external reference')
      return
    }

    const [organizationId, tier] = externalReference.split('_')
    if (!organizationId || !tier) return

    const subscriptionTier = tier as SubscriptionTier

    // Garantir que o tier continua ativo (renovação)
    await prisma.organization.update({
      where: { id: organizationId },
      data: { tier: subscriptionTier },
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

    logger.info({ organizationId, tier: subscriptionTier }, '[MP:RECURRING] Subscription renewed successfully')
  } catch (err) {
    logger.error({ err, paymentId }, '[MP:RECURRING] Error processing recurring payment')
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
