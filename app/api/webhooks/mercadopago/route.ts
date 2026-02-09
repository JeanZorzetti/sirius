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

    // Processar assinaturas (recorrência)
    if (body.type === 'subscription' || body.type === 'preapproval') {
      // TODO: Implementar lógica de recorrência
      logger.info({ body }, 'Subscription webhook received')
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

function getAddonName(type: string): string {
  const names: Record<string, string> = {
    'SCRAPING_100': 'Pacote 100 Leads',
    'SCRAPING_500': 'Pacote 500 Leads',
    'WHATSAPP_EXTRA_INSTANCE': 'WhatsApp Extra',
  }
  return names[type] || 'Add-on'
}
