/**
 * API Route: /api/billing/upgrade
 *
 * Cria preferência de checkout no Mercado Pago para upgrade/downgrade de plano
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { billingRateLimit } from '@/lib/ratelimit'
import { PLAN_PRICING, PLAN_NAMES } from '@/lib/entitlements'
import { SubscriptionTier } from '@prisma/client'
import { MercadoPagoConfig, Preference } from 'mercadopago'

let _mp: MercadoPagoConfig | null = null
function getMp() {
  if (!_mp) _mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! })
  return _mp
}

// IDs dos planos no Mercado Pago (criar no dashboard)
const MP_PLAN_IDS: Record<SubscriptionTier, string | null> = {
  [SubscriptionTier.FREE]: null,
  [SubscriptionTier.STARTER]: process.env.MP_STARTER_PLAN_ID || null,
  [SubscriptionTier.PRO]: process.env.MP_PRO_PLAN_ID || null,
  [SubscriptionTier.BUSINESS]: process.env.MP_BUSINESS_PLAN_ID || null,
}

export async function POST(req: NextRequest) {
  const blocked = await billingRateLimit(req)
  if (blocked) return blocked

  try {
    // 1. Autenticação
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Dados do request
    const { tier } = await req.json()

    if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    // 3. Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        organizationId: true,
      },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // 4. Buscar organização
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        id: true,
        name: true,
        tier: true,
      },
    })

    if (!org) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // 5. Se for FREE, atualizar diretamente
    if (tier === SubscriptionTier.FREE) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          tier: SubscriptionTier.FREE,
          plan: 'FREE',
        },
      })

      return NextResponse.json({ 
        success: true, 
        tier: SubscriptionTier.FREE,
        message: 'Plano alterado para Gratuito'
      })
    }

    // 6. Criar preferência de checkout no Mercado Pago
    const price = PLAN_PRICING[tier as SubscriptionTier]
    const planName = PLAN_NAMES[tier as SubscriptionTier]

    const preference = await new Preference(getMp()).create({
      body: {
        items: [
          {
            id: `plan_${tier}`,
            title: `Plano ${planName} - Sirius CRM`,
            description: `Assinatura mensal do plano ${planName}`,
            unit_price: price,
            quantity: 1,
            category_id: 'software',
          },
        ],
        payer: {
          email: session.user.email,
        },
        external_reference: `${org.id}_${tier}`,
        back_urls: {
          success: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/plans?success=true&tier=${tier}`,
          failure: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/plans?error=true`,
          pending: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/plans?pending=true`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        metadata: {
          organizationId: org.id,
          userId: user.id,
          tier,
        },
      },
    })

    return NextResponse.json({
      url: preference.init_point,
      preferenceId: preference.id,
    })

  } catch (error: any) {
    logger.error({ err: error }, 'Upgrade error')
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
