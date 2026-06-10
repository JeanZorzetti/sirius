/**
 * Cron: billing-pix
 *
 * Roda diariamente às 9h. Identifica organizações com plano pago via PIX
 * cujo billing vence hoje (billingStartDate + 30 dias) e envia email de cobrança
 * com link de checkout para renovação.
 *
 * PIX não suporta recorrência automática no Mercado Pago, então este cron
 * é responsável por notificar o cliente e emitir novo link de pagamento.
 *
 * Se o cliente não pagar em 3 dias após o vencimento, faz downgrade para FREE.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCheckoutPreference } from '@/lib/mercadopago'
import { sendHtmlEmail } from '@/lib/email'
import logger from '@/lib/logger'
import { SubscriptionTier } from '@prisma/client'

export const runtime = 'nodejs'
export const maxDuration = 300

const GRACE_PERIOD_DAYS = 3

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const urlToken = request.nextUrl.searchParams.get('token')
  const cronSecret = process.env.CRON_SECRET

  const isValid =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && urlToken === cronSecret)

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('[CRON:PIX] Starting PIX billing cycle check')

  const now = new Date()
  const results = { notified: 0, downgraded: 0, skipped: 0, errors: 0 }

  // Organizações pagas com PIX (sem subscriptionId = não são assinatura recorrente)
  // e com billingStartDate definido
  const orgs = await prisma.organization.findMany({
    where: {
      tier: { not: SubscriptionTier.FREE },
      mercadoPagoSubscriptionId: null,
      billingStartDate: { not: null },
      isFounder: false,
    },
    select: {
      id: true,
      name: true,
      tier: true,
      billingStartDate: true,
      billingPeriod: true,
      plan: true,
    },
  })

  for (const org of orgs) {
    try {
      const billingStart = org.billingStartDate!
      const isAnnual = org.billingPeriod === 'ANNUAL'

      // Calcular próxima data de vencimento (mensal ou anual)
      const dueDate = new Date(billingStart)
      if (isAnnual) {
        dueDate.setFullYear(dueDate.getFullYear() + 1)
      } else {
        dueDate.setMonth(dueDate.getMonth() + 1)
      }

      const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      // Ainda não venceu
      if (daysDiff < 0) {
        // Aviso antecipado 3 dias antes
        if (daysDiff === -3) {
          await sendPixRenewalEmail(org, dueDate, 'reminder')
          results.notified++
        } else {
          results.skipped++
        }
        continue
      }

      // Venceu hoje — enviar link de cobrança
      if (daysDiff === 0) {
        await sendPixRenewalEmail(org, dueDate, 'due')
        results.notified++
        continue
      }

      // Dentro do prazo de carência (1-3 dias após vencimento)
      if (daysDiff > 0 && daysDiff <= GRACE_PERIOD_DAYS) {
        await sendPixRenewalEmail(org, dueDate, 'overdue')
        results.notified++
        continue
      }

      // Prazo de carência esgotado → downgrade para FREE
      if (daysDiff > GRACE_PERIOD_DAYS) {
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            tier: SubscriptionTier.FREE,
            plan: 'FREE',
            billingPeriod: 'MONTHLY',
            agaasEnabled: false,
            agaasAgentLimit: 0,
            agaasMonthlyQuota: 0,
          },
        })

        await prisma.transaction.create({
          data: {
            organizationId: org.id,
            type: 'PLAN_DOWNGRADE',
            amount: 0,
            feeAmount: 0,
            netAmount: 0,
            currency: 'BRL',
            status: 'COMPLETED',
            provider: 'MERCADO_PAGO',
            metadata: {
              reason: 'pix_payment_overdue',
              previousTier: org.tier,
              newTier: 'FREE',
              daysOverdue: daysDiff,
            },
          },
        })

        logger.warn({ orgId: org.id, orgName: org.name, daysDiff }, '[CRON:PIX] Downgraded to FREE - payment overdue')
        results.downgraded++

        await sendDowngradeEmail(org)
      }
    } catch (err) {
      logger.error({ err, orgId: org.id }, '[CRON:PIX] Error processing org')
      results.errors++
    }
  }

  logger.info(results, '[CRON:PIX] Done')
  return NextResponse.json({ success: true, results })
}

async function sendPixRenewalEmail(
  org: { id: string; name: string; tier: string; plan: string },
  dueDate: Date,
  type: 'reminder' | 'due' | 'overdue'
) {
  const owner = await prisma.user.findFirst({
    where: { organizationId: org.id },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!owner?.email) return

  const plan = org.tier as 'STARTER' | 'PRO' | 'BUSINESS'
  const planPrices: Record<string, number> = { STARTER: 67, PRO: 147, BUSINESS: 397 }
  const price = planPrices[plan] ?? 0

  // Gerar novo link de pagamento
  let checkoutUrl = ''
  try {
    const { initPoint } = await createCheckoutPreference(org.id, org.name, owner.email, plan)
    checkoutUrl = initPoint
  } catch {
    logger.error({ orgId: org.id }, '[CRON:PIX] Failed to create renewal checkout')
  }

  const subjects: Record<string, string> = {
    reminder: `⏰ Sua assinatura Sirius CRM vence em 3 dias – renove via PIX`,
    due: `💳 Renovação do Sirius CRM – seu plano vence hoje`,
    overdue: `⚠️ Pagamento em atraso – renove agora para não perder acesso`,
  }

  const dueDateStr = dueDate.toLocaleDateString('pt-BR')

  await sendHtmlEmail({
    to: owner.email,
    subject: subjects[type],
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Olá, ${owner.name || 'Cliente'}!</h2>
        <p>A renovação da assinatura <strong>${org.name}</strong> no Sirius CRM
        ${type === 'reminder' ? 'vence em 3 dias' : type === 'due' ? 'vence hoje' : 'está em atraso'}.</p>
        <ul>
          <li>Plano: <strong>${plan}</strong></li>
          <li>Valor: <strong>R$ ${price.toFixed(2)}/mês</strong></li>
          <li>Vencimento: <strong>${dueDateStr}</strong></li>
        </ul>
        ${checkoutUrl ? `
        <a href="${checkoutUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
          Pagar agora via PIX
        </a>
        ` : ''}
        ${type === 'overdue' ? `
        <p style="color:#dc2626;margin-top:16px;">
          <strong>Atenção:</strong> Após ${3} dias de atraso seu acesso será limitado ao plano gratuito.
        </p>
        ` : ''}
        <p style="color:#64748b;font-size:13px;margin-top:32px;">
          Dúvidas? Responda este email ou acesse o suporte no app.
        </p>
      </div>
    `,
  }).catch(err => logger.error({ err, orgId: org.id }, '[CRON:PIX] Failed to send email'))
}

async function sendDowngradeEmail(org: { id: string; name: string }) {
  const owner = await prisma.user.findFirst({
    where: { organizationId: org.id },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!owner?.email) return

  await sendHtmlEmail({
    to: owner.email,
    subject: `Acesso ao Sirius CRM limitado – renove para recuperar`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Plano revertido para gratuito</h2>
        <p>Olá ${owner.name || ''},</p>
        <p>Como não identificamos o pagamento da renovação de <strong>${org.name}</strong>,
        seu acesso foi revertido para o plano gratuito.</p>
        <p>Para reativar seu plano completo, acesse o painel de billing e realize o pagamento:</p>
        <a href="${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing"
           style="display:inline-block;background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
          Reativar plano
        </a>
      </div>
    `,
  }).catch(err => logger.error({ err, orgId: org.id }, '[CRON:PIX] Failed to send downgrade email'))
}
