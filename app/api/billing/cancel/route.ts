import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cancelSubscription } from '@/lib/mercadopago'
import { SubscriptionTier } from '@prisma/client'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, organization: {
        select: {
          id: true,
          tier: true,
          isFounder: true,
          mercadoPagoSubscriptionId: true,
          billingPeriod: true,
        },
      }},
    })

    if (!user?.organization) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req })
    }

    if (user.role !== 'ADMIN') {
      return await apiError(ERR.FORBIDDEN, 403, { req })
    }

    const org = user.organization

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

    // Cancelar no Mercado Pago se houver assinatura recorrente
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
