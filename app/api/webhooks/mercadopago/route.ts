import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPayment } from '@/lib/mercadopago'
import logger from '@/lib/logger'
import { dispatchWebhookAsync, WEBHOOK_EVENTS } from '@/lib/webhooks'
import { sendEmail } from '@/lib/email'
import { PaymentConfirmationEmail } from '@/emails/templates/payment-confirmation'
import { getQuota } from '@/lib/entitlements'
import { SubscriptionTier, AddonType } from '@prisma/client'
import crypto from 'crypto'

/**
 * Valida assinatura do webhook do Mercado Pago
 */
function validateWebhookSignature(request: NextRequest, body: string): boolean {
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  if (!xSignature || !xRequestId) {
    return false
  }

  // Extrair ts e hash da assinatura
  const parts = xSignature.split(',')
  let ts = ''
  let hash = ''

  parts.forEach(part => {
    const [key, value] = part.split('=')
    if (key === 'ts') ts = value
    if (key === 'v1') hash = value
  })

  if (!ts || !hash) {
    return false
  }

  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) {
    logger.warn('MERCADO_PAGO_WEBHOOK_SECRET not configured')
    return true // Permitir se não configurado (dev)
  }

  // Criar string para validação: id + request-id + ts
  const manifest = `id:${body};request-id:${xRequestId};ts:${ts};`

  // Calcular HMAC SHA256
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(manifest)
  const expectedHash = hmac.digest('hex')

  return hash === expectedHash
}

/**
 * Processa uma assinatura de plano (upgrade/nova assinatura)
 */
async function processSubscription(params: {
  organizationId: string
  paymentId: string
  payment: any
  metadata: any
}) {
  const { organizationId, paymentId, payment, metadata } = params

  const tier = metadata.tier as SubscriptionTier
  const isUpgrade = metadata.type === 'upgrade'
  const previousTier = metadata.previous_tier as SubscriptionTier | undefined

  // Buscar organização
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: {
        where: { orgRole: 'OWNER' },
        take: 1,
      },
    },
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  // Atualizar tier da organização
  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      tier,
      mercadoPagoCustomerId: payment.payer?.id?.toString(),
      mercadoPagoSubscriptionId: paymentId.toString(),
    },
  })

  logger.info({
    organizationId,
    previousTier: previousTier || organization.tier,
    newTier: tier,
    isUpgrade,
  }, `Organization ${isUpgrade ? 'upgraded' : 'subscribed'} to ${tier}`)

  // Inicializar créditos de scraping se aplicável
  const scrapingMonthlyQuota = getQuota(tier, 'scraping_monthly_credits')

  if (scrapingMonthlyQuota > 0) {
    await prisma.scrapingCredit.upsert({
      where: { organizationId },
      create: {
        organizationId,
        balance: scrapingMonthlyQuota,
        monthlyQuota: scrapingMonthlyQuota,
        usedThisMonth: 0,
        lastRefill: new Date(),
      },
      update: {
        monthlyQuota: scrapingMonthlyQuota,
        // Só atualiza balance se aumentou o quota
        balance: {
          increment: Math.max(0, scrapingMonthlyQuota - (organization.scrapingCredit?.monthlyQuota || 0)),
        },
      },
    })
  }

  // Inicializar quota de IA se aplicável
  const agiMonthlyLimit = getQuota(tier, 'agi_monthly_quota')

  await prisma.agiQuota.upsert({
    where: { organizationId },
    create: {
      organizationId,
      monthlyLimit: agiMonthlyLimit,
      usedThisMonth: 0,
      lastReset: new Date(),
    },
    update: {
      monthlyLimit: agiMonthlyLimit,
    },
  })

  // Enviar email de confirmação
  const owner = organization.users[0]
  if (owner) {
    const nextBillingDate = new Date()
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    await sendEmail({
      to: owner.email,
      subject: `🎉 Pagamento Confirmado - Bem-vindo ao Sirius ${tier}!`,
      react: PaymentConfirmationEmail({
        userName: owner.name || 'Usuário',
        organizationName: organization.name,
        paymentId: paymentId.toString(),
        paymentType: payment.payment_type_id || 'Não informado',
        amount: payment.transaction_amount || 0,
        nextBillingDate: nextBillingDate.toLocaleDateString('pt-BR'),
      }),
    })
  }

  // Disparar webhook
  dispatchWebhookAsync(organizationId, WEBHOOK_EVENTS.ORGANIZATION_UPGRADED, {
    organization: {
      id: updatedOrg.id,
      name: updatedOrg.name,
      tier,
    },
    payment: {
      id: paymentId.toString(),
      status: payment.status,
      type: payment.payment_type_id,
      amount: payment.transaction_amount,
    },
  })

  return { action: `${isUpgrade ? 'upgraded' : 'subscribed'}_to_${tier.toLowerCase()}` }
}

/**
 * Processa uma compra de add-on
 */
async function processAddon(params: {
  organizationId: string
  paymentId: string
  payment: any
  metadata: any
}) {
  const { organizationId, paymentId, payment, metadata } = params

  const addonType = metadata.addon_type as AddonType
  const isRecurring = metadata.recurring === true

  // Buscar organização
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  // Criar registro do add-on
  const addon = await prisma.addon.create({
    data: {
      organizationId,
      type: addonType,
      name: addonType.replace(/_/g, ' '),
      quantity: addonType === 'SCRAPING_100' ? 100 : addonType === 'SCRAPING_500' ? 500 : 1,
      price: payment.transaction_amount || 0,
      status: 'ACTIVE',
      expiresAt: isRecurring
        ? null // Não expira (assinatura)
        : undefined, // Não expira (compra única)
    },
  })

  logger.info({
    organizationId,
    addonType,
    addonId: addon.id,
    quantity: addon.quantity,
  }, 'Add-on purchased')

  // Processar créditos de scraping
  if (addonType.startsWith('SCRAPING_')) {
    await prisma.scrapingCredit.update({
      where: { organizationId },
      data: {
        balance: { increment: addon.quantity },
      },
    })

    logger.info({
      organizationId,
      creditsAdded: addon.quantity,
    }, 'Scraping credits added from add-on')
  }

  // Processar instância extra de WhatsApp
  if (addonType === 'WHATSAPP_EXTRA_INSTANCE') {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        whatsappInstances: { increment: 1 },
      },
    })

    logger.info({
      organizationId,
    }, 'WhatsApp instance added from add-on')
  }

  return { action: 'addon_purchased', addonType }
}

/**
 * POST /api/webhooks/mercadopago
 * Webhook para receber notificações do Mercado Pago
 *
 * Tipos de notificação:
 * - payment: Atualização de pagamento
 * - merchant_order: Atualização de pedido
 */
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text()
    const body = JSON.parse(bodyText)

    // Validar assinatura do webhook
    if (!validateWebhookSignature(request, bodyText)) {
      logger.warn({
        signature: request.headers.get('x-signature'),
        requestId: request.headers.get('x-request-id')
      }, 'Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    logger.info({
      type: body.type,
      action: body.action,
      data: body.data
    }, 'Mercado Pago webhook received')

    // Processar apenas notificações de payment
    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        logger.warn({ body }, 'Payment ID not found in webhook')
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // Buscar informações completas do pagamento
      const payment = await getPayment(paymentId.toString())

      logger.info({
        paymentId,
        status: payment.status,
        statusDetail: payment.status_detail,
        externalReference: payment.external_reference
      }, 'Payment details retrieved')

      // External reference contém o organization ID
      const organizationId = payment.external_reference

      if (!organizationId) {
        logger.warn({
          paymentId,
          payment
        }, 'Organization ID not found in payment')
        return NextResponse.json({ received: true }, { status: 200 })
      }

      // Buscar organização e owner
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          users: {
            where: {
              orgRole: 'OWNER'
            },
            take: 1
          }
        }
      })

      if (!organization) {
        logger.error({
          organizationId,
          paymentId
        }, 'Organization not found')
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        )
      }

      // Processar pagamento aprovado
      if (payment.status === 'approved') {
        logger.info({
          organizationId,
          paymentId,
          paymentType: payment.payment_type_id,
          amount: payment.transaction_amount,
          metadata: payment.metadata
        }, 'Payment approved')

        // Verificar tipo de pagamento (metadata)
        const metadata = payment.metadata || {}
        const paymentType = metadata.type // 'subscription', 'upgrade', 'addon'

        let result

        if (paymentType === 'addon') {
          // Processar add-on
          result = await processAddon({
            organizationId,
            paymentId: paymentId.toString(),
            payment,
            metadata,
          })
        } else {
          // Processar assinatura (nova ou upgrade)
          result = await processSubscription({
            organizationId,
            paymentId: paymentId.toString(),
            payment,
            metadata,
          })
        }

        return NextResponse.json({
          received: true,
          processed: true,
          ...result,
        })
      }

      // Processar pagamento rejeitado/cancelado
      if (['rejected', 'cancelled', 'refunded'].includes(payment.status || '')) {
        logger.warn({
          organizationId,
          paymentId,
          status: payment.status,
          statusDetail: payment.status_detail
        }, 'Payment rejected/cancelled/refunded')

        // Se a organização estava em plano pago, voltar para FREE
        if (organization.tier !== 'FREE') {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              tier: 'FREE',
              mercadoPagoSubscriptionId: null
            }
          })

          logger.info({
            organizationId,
            paymentId,
            previousTier: organization.tier
          }, 'Organization downgraded to FREE due to payment failure')

          // Disparar webhook de downgrade
          dispatchWebhookAsync(organizationId, WEBHOOK_EVENTS.ORGANIZATION_DOWNGRADED, {
            organization: {
              id: organization.id,
              name: organization.name,
              tier: 'FREE'
            },
            reason: payment.status,
            payment: {
              id: paymentId.toString(),
              status: payment.status
            }
          })
        }

        return NextResponse.json({
          received: true,
          processed: true,
          action: 'downgraded_to_free'
        })
      }

      // Pagamento pendente ou em processamento
      logger.info({
        organizationId,
        paymentId,
        status: payment.status
      }, 'Payment pending or in process')

      return NextResponse.json({
        received: true,
        processed: false,
        status: payment.status
      })
    }

    // Outros tipos de notificação (merchant_order, etc)
    logger.info({
      type: body.type,
      action: body.action
    }, 'Non-payment webhook received')

    return NextResponse.json({ received: true })

  } catch (error) {
    logger.error({
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 'Error processing Mercado Pago webhook')

    // Retornar 200 para evitar reenvios do Mercado Pago
    return NextResponse.json(
      { error: 'Internal error', received: true },
      { status: 200 }
    )
  }
}

/**
 * GET /api/webhooks/mercadopago
 * Endpoint de verificação
 */
export async function GET() {
  return NextResponse.json({
    service: 'Mercado Pago Webhook',
    status: 'active',
    timestamp: new Date().toISOString()
  })
}
