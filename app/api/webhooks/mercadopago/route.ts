/**
 * Webhook: Mercado Pago (LEGADO — novos checkouts vão via Stripe)
 *
 * Recebe notificações de pagamento e atualiza assinaturas de clientes antigos.
 * A lógica de negócio (upgrade, fundadores, créditos, referral, churn) vive em
 * lib/billing-effects.ts, compartilhada com o webhook da Stripe.
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { SubscriptionTier } from '@prisma/client'
import logger from '@/lib/logger'
import { webhookRateLimit } from '@/lib/ratelimit'
import { createHmac } from 'crypto'
import {
  PaymentInfo,
  upgradePlan,
  upgradeToFounder,
  processAddonPurchase,
  renewSubscription,
  downgradeToFree,
  handleFailedRecurringPayment,
  recordWhatsAppSetupPurchase,
} from '@/lib/billing-effects'

/**
 * Payment shape as returned by the MP SDK. `preapproval_id` is present in
 * recurring-payment payloads but missing from the SDK's type.
 */
type MpPayment = Awaited<ReturnType<InstanceType<typeof Payment>['get']>> & {
  preapproval_id?: string | null
}

let _mp: MercadoPagoConfig | null = null
function getMp() {
  if (!_mp) _mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! })
  return _mp
}

export const dynamic = 'force-dynamic'

/** Normaliza o payment do MP para o formato provider-neutral da lib de billing. */
function mpPaymentInfo(payment: MpPayment): PaymentInfo {
  return {
    provider: 'MERCADO_PAGO',
    providerPaymentId: payment.id != null ? String(payment.id) : null,
    amount: payment.transaction_amount ?? 0,
    feeAmount: payment.fee_details?.reduce((acc, f) => acc + (f.amount || 0), 0) || null,
    netAmount: payment.transaction_details?.net_received_amount || null,
    currency: payment.currency_id ?? 'BRL',
    paymentMethod: payment.payment_method_id ?? null,
    installments: payment.installments ?? null,
  }
}

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
      const payment = await new Payment(getMp()).get({ id: paymentId })

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

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error({ error: message }, 'MercadoPago webhook error')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function processApprovedPayment(payment: MpPayment) {
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
  let tierOrAddon = externalReference.substring(underscoreIdx + 1)

  // Detect annual billing suffix (e.g. STARTER_ANNUAL, PRO_ANNUAL)
  const isAnnual = tierOrAddon.endsWith('_ANNUAL')
  if (isAnnual) {
    tierOrAddon = tierOrAddon.replace('_ANNUAL', '')
  }

  const pay = mpPaymentInfo(payment)

  // Programa de Fundadores (FOUNDER_STARTER | FOUNDER_PRO | FOUNDER_BUSINESS)
  if (tierOrAddon.startsWith('FOUNDER_')) {
    await upgradeToFounder(organizationId, tierOrAddon, pay)
    return
  }

  // Verificar se é upgrade de plano
  if (Object.values(SubscriptionTier).includes(tierOrAddon as SubscriptionTier)) {
    // Salvar subscriptionId se vier no pagamento (primeiro ciclo de assinatura recorrente)
    const subscriptionIdToSave = payment.metadata?.preapproval_id
      || payment.preapproval_id
      || null

    await upgradePlan(
      organizationId,
      tierOrAddon as SubscriptionTier,
      pay,
      isAnnual,
      subscriptionIdToSave ? { mercadoPagoSubscriptionId: subscriptionIdToSave } : {}
    )
  } else if (tierOrAddon === 'WHATSAPP_SETUP') {
    await recordWhatsAppSetupPurchase(organizationId, pay)
  } else {
    // É um add-on
    await processAddonPurchase(organizationId, tierOrAddon, pay)
  }
}

/**
 * Processa eventos de assinatura (aprovação, cancelamento, pausa)
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
      await downgradeToFree(org.id, {
        previousTier: org.tier,
        reason: 'subscription_cancelled',
        provider: 'MERCADO_PAGO',
      })
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
 * Processa pagamento recorrente (renovação mensal)
 * - Aprovado: renova tier + reseta créditos + envia email de confirmação
 * - Rejeitado: incrementa tentativas (máx 3) → cancela e faz downgrade
 */
async function processRecurringPayment(paymentId: string) {
  logger.info({ paymentId }, '[MP:RECURRING] Processing recurring payment')

  try {
    const payment = await new Payment(getMp()).get({ id: paymentId })

    const externalReference = payment.external_reference
    if (!externalReference) {
      logger.warn({ paymentId }, '[MP:RECURRING] No external reference')
      return
    }

    const underscoreIdx = externalReference.indexOf('_')
    if (underscoreIdx === -1) return
    const organizationId = externalReference.substring(0, underscoreIdx)
    const tier = externalReference.substring(underscoreIdx + 1).replace('_ANNUAL', '')
    if (!organizationId) return

    // Pagamento rejeitado → retry logic
    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await handleFailedRecurringPayment(organizationId, 'MERCADO_PAGO')
      return
    }

    if (payment.status !== 'approved') {
      logger.info({ paymentId, status: payment.status }, '[MP:RECURRING] Payment pending, skipping')
      return
    }

    const subscriptionTier = (tier || 'PRO') as SubscriptionTier

    // Garantir que o subscriptionId está salvo (pode ter chegado nulo no primeiro ciclo)
    const subscriptionIdFromPayment = (payment as MpPayment).preapproval_id || null

    await renewSubscription(
      organizationId,
      subscriptionTier,
      mpPaymentInfo(payment),
      subscriptionIdFromPayment ? { mercadoPagoSubscriptionId: subscriptionIdFromPayment } : {}
    )
  } catch (err) {
    logger.error({ err, paymentId }, '[MP:RECURRING] Error processing recurring payment')
  }
}
