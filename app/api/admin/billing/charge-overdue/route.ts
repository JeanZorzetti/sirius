/**
 * POST /api/admin/billing/charge-overdue
 *
 * Gera novo link de pagamento para organizações com cobrança em atraso.
 * Uso: cobrar manualmente Cartopel, 3A3 Consultoria e Wordseg (2º mês vencido).
 *
 * Body: { organizationId: string }
 * Resposta: { checkoutUrl: string } — link para enviar ao cliente
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutPreference, CheckoutPlan } from '@/lib/mercadopago'
import { sendEmail } from '@/lib/email'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { organizationId, sendEmail: shouldSendEmail = true } = body

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId obrigatório' }, { status: 400 })
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, tier: true, billingStartDate: true, isFounder: true },
  })

  if (!org) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  if (org.tier === 'FREE') {
    return NextResponse.json({ error: 'Organização já está no plano FREE' }, { status: 400 })
  }

  const owner = await prisma.user.findFirst({
    where: { organizationId },
    select: { email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!owner?.email) {
    return NextResponse.json({ error: 'Nenhum usuário encontrado na organização' }, { status: 404 })
  }

  // Gerar link de pagamento para o mês em atraso
  const plan = org.tier as CheckoutPlan
  const { initPoint, preferenceId } = await createCheckoutPreference(
    org.id,
    org.name,
    owner.email,
    plan
  )

  await prisma.organization.update({
    where: { id: org.id },
    data: { mercadoPagoPreferenceId: preferenceId },
  })

  logger.info(
    { organizationId, plan, preferenceId, adminEmail: session.user.email },
    '[ADMIN:BILLING] Overdue charge link generated'
  )

  if (shouldSendEmail) {
    const planPrices: Record<string, number> = { STARTER: 67, PRO: 147, BUSINESS: 397 }
    const price = planPrices[plan] ?? 0

    await sendEmail({
      to: owner.email,
      subject: `💳 Cobrança pendente – Sirius CRM (${org.name})`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Olá, ${owner.name || 'Cliente'}!</h2>
          <p>Identificamos uma cobrança em aberto na sua conta <strong>${org.name}</strong> no Sirius CRM.</p>
          <ul>
            <li>Plano: <strong>${plan}</strong></li>
            <li>Valor: <strong>R$ ${price.toFixed(2)}</strong></li>
          </ul>
          <p>Para regularizar e manter o acesso completo, clique abaixo:</p>
          <a href="${initPoint}"
             style="display:inline-block;background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
            Pagar agora
          </a>
          <p style="color:#64748b;font-size:13px;margin-top:32px;">
            Dúvidas? Responda este email ou acesse o suporte.
          </p>
        </div>
      `,
    }).catch(err => logger.error({ err }, '[ADMIN:BILLING] Failed to send overdue email'))
  }

  return NextResponse.json({
    success: true,
    organizationId,
    organizationName: org.name,
    ownerEmail: owner.email,
    checkoutUrl: initPoint,
    preferenceId,
  })
}
