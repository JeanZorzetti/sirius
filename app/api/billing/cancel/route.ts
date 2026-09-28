import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cancelSubscription } from '@/lib/mercadopago'
import { agendarCancelamento, desistirComReembolso, dentroDoArrependimento, lerAssinatura } from '@/lib/stripe'
import { downgradeToFree } from '@/lib/billing-effects'
import { sendEmail } from '@/lib/email'
import { createElement } from 'react'
import { SubscriptionTier } from '@prisma/client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const dataBR = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const reais = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Receipt of the cancellation for the account owner (proof of what was asked and when). */
async function comprovante(email: string, assunto: string, linhas: string[]) {
  await sendEmail({
    to: email,
    subject: assunto,
    react: createElement('div', null, ...linhas.map((l, i) => createElement('p', { key: i }, l))),
  }).catch(err => logger.error({ err }, '[BILLING] Failed to send cancellation receipt'))
}

async function donoDaConta(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) return { erro: await apiError(ERR.UNAUTHORIZED, 401, { req }) }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, email: true, organization: {
      select: {
        id: true, tier: true, isFounder: true, stripeSubscriptionId: true, mercadoPagoSubscriptionId: true,
        cancelAtPeriodEnd: true,
      },
    }},
  })
  if (!user?.organization) return { erro: await apiError(ERR.ORG_NOT_FOUND, 404, { req }) }
  if (user.role !== 'ADMIN') return { erro: await apiError(ERR.FORBIDDEN, 403, { req }) }
  return { email: user.email, org: user.organization }
}

/** DELETE: undoes a cancellation scheduled for the end of the period. */
export async function DELETE(req: NextRequest) {
  try {
    const dono = await donoDaConta(req)
    if ('erro' in dono) return dono.erro
    const { org } = dono
    if (!org.cancelAtPeriodEnd || !org.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Não há cancelamento agendado nesta conta.' }, { status: 400 })
    }
    await agendarCancelamento(org.stripeSubscriptionId, false)
    // isolamento: org is the signed-in admin's own organization (donoDaConta)
    await prisma.organization.update({
      where: { id: org.id },
      data: { cancelAtPeriodEnd: false, currentPeriodEnd: null },
    })
    logger.info({ orgId: org.id }, 'Scheduled cancellation undone')
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Error undoing cancellation')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req })
  }
}

export async function POST(req: NextRequest) {
  try {
    const dono = await donoDaConta(req)
    if ('erro' in dono) return dono.erro

    const org = dono.org
    // Stripe (current provider): withdrawal within 7 days, otherwise keep the plan until the end of the paid period
    if (org.stripeSubscriptionId && org.tier !== SubscriptionTier.FREE && !org.isFounder) {
      const { inicio } = await lerAssinatura(org.stripeSubscriptionId)

      if (dentroDoArrependimento(inicio)) {
        const reembolso = await desistirComReembolso(org.stripeSubscriptionId)
        await downgradeToFree(org.id, {
          previousTier: org.tier,
          reason: 'withdrawal_refund',
          provider: 'STRIPE',
          clearProviderIds: true,
          extraMetadata: { refunded: reembolso },
        })
        await comprovante(dono.email, 'Desistência registrada – Sirius CRM', [
          `Registramos sua desistência em ${dataBR(new Date())}.`,
          `Estornamos ${reais(reembolso)} no mesmo meio de pagamento. O prazo para aparecer depende do seu banco.`,
          'Sua conta voltou ao plano gratuito. Seus dados continuam guardados e você pode assinar de novo quando quiser.',
        ])
        return NextResponse.json({ success: true, refunded: reembolso })
      }

      const fim = await agendarCancelamento(org.stripeSubscriptionId, true)
      // isolamento: org is the signed-in admin's own organization (donoDaConta)
      await prisma.organization.update({
        where: { id: org.id },
        data: { cancelAtPeriodEnd: true, currentPeriodEnd: fim, pendingPlan: null },
      })
      await comprovante(dono.email, 'Cancelamento registrado – Sirius CRM', [
        `Registramos o cancelamento da sua assinatura em ${dataBR(new Date())}.`,
        `Seu plano continua ativo até ${dataBR(fim)}, e não haverá nova cobrança.`,
        'Mudou de ideia? Em Configurações → Cobrança, clique em "Manter assinatura" antes dessa data.',
      ])
      logger.info({ orgId: org.id, fim }, 'Cancellation scheduled for the end of the period')
      return NextResponse.json({ success: true, accessUntil: fim.toISOString() })
    }

    if (org.tier === SubscriptionTier.FREE) {
      return NextResponse.json({ error: 'Organização já está no plano gratuito' }, { status: 400 })
    }

    if (org.isFounder) {
      return NextResponse.json(
        { error: 'Assinaturas de fundadores não podem ser canceladas pelo sistema. Entre em contato pelo suporte.' },
        { status: 400 }
      )
    }

    const previousTier = org.tier

    // Legacy path (Mercado Pago, or a paid tier set by hand): ends now.
    // ponytail: the only MP subscription left is a founder's, which is refused above; schedule it if MP comes back.
    if (org.mercadoPagoSubscriptionId) {
      try {
        await cancelSubscription(org.mercadoPagoSubscriptionId)
        logger.info({ orgId: org.id, subscriptionId: org.mercadoPagoSubscriptionId }, 'MP subscription cancelled')
      } catch (err) {
        // Logar mas não bloquear — webhook também processa o cancelamento
        logger.error({ err, orgId: org.id }, 'Failed to cancel MP subscription — proceeding with local downgrade')
      }
    }

    // Downgrade local imediato
    // isolamento: org is the signed-in admin's own organization (donoDaConta)
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        tier: SubscriptionTier.FREE,
        plan: 'FREE',
        billingPeriod: 'MONTHLY',
        mercadoPagoSubscriptionId: null,
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
          reason: 'user_cancelled',
          previousTier,
          newTier: 'FREE',
        },
      },
    })

    logger.info({ orgId: org.id, previousTier }, 'Subscription cancelled by user')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Error cancelling subscription')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req })
  }
}
