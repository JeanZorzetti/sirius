/**
 * Cron: Check Trial Expiry
 *
 * Roda diariamente. Detecta orgs com trial expirado e envia emails.
 * Chamar via cron externo (EasyPanel scheduler ou cron.io):
 *   GET /api/cron/check-trial-expiry
 *   Header: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendHtmlEmail } from '@/lib/email'
import logger from '@/lib/logger'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) return unauthorized()

  try {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // 1. Orgs cujo trial expira em ~1 dia (enviar aviso, uma vez só)
    const expiringSoon = await prisma.organization.findMany({
      where: {
        tier: 'FREE',
        trialStatus: 'ACTIVE',
        trialEndsAt: { gte: now, lte: tomorrow },
      },
      include: {
        users: { where: { orgRole: 'OWNER' }, select: { email: true, name: true }, take: 1 },
      },
    })

    for (const org of expiringSoon) {
      const owner = org.users[0]
      if (!owner?.email) continue
      try {
        await sendHtmlEmail({
          to: owner.email,
          subject: 'Seu trial do Sirius CRM expira amanhã',
          html: `
            <p>Olá${owner.name ? `, ${owner.name}` : ''}!</p>
            <p>Seu trial PRO do Sirius CRM expira <strong>amanhã</strong>. Após isso, sua conta ficará em modo somente leitura.</p>
            <p><a href="https://siriuscrm.com.br/dashboard/billing">Fazer upgrade agora →</a></p>
          `,
        })
        logger.info({ orgId: org.id, email: owner.email }, '[TRIAL] Expiring-soon email sent')
      } catch (err) {
        logger.error({ err, orgId: org.id }, '[TRIAL] Failed to send expiring-soon email')
      }
    }

    // 2. Orgs cujo trial já expirou mas status ainda é ACTIVE → marcar EXPIRED + enviar email
    const expired = await prisma.organization.findMany({
      where: {
        tier: 'FREE',
        trialStatus: 'ACTIVE',
        trialEndsAt: { lt: now },
      },
      include: {
        users: { where: { orgRole: 'OWNER' }, select: { email: true, name: true }, take: 1 },
      },
    })

    for (const org of expired) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { trialStatus: 'EXPIRED' },
      })

      const owner = org.users[0]
      if (!owner?.email) continue
      try {
        await sendHtmlEmail({
          to: owner.email,
          subject: 'Seu trial do Sirius CRM expirou',
          html: `
            <p>Olá${owner.name ? `, ${owner.name}` : ''}!</p>
            <p>Seu trial PRO do Sirius CRM expirou. Sua conta está agora em <strong>modo somente leitura</strong> — você pode ver todos os seus dados, mas não criar ou editar registros.</p>
            <p>Faça upgrade para continuar usando o Sirius sem restrições:</p>
            <p><a href="https://siriuscrm.com.br/dashboard/billing">Ver planos e fazer upgrade →</a></p>
          `,
        })
        logger.info({ orgId: org.id, email: owner.email }, '[TRIAL] Expired email sent')
      } catch (err) {
        logger.error({ err, orgId: org.id }, '[TRIAL] Failed to send expired email')
      }
    }

    return NextResponse.json({
      ok: true,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
    })
  } catch (err: any) {
    logger.error({ err: err.message }, '[TRIAL] Cron error')
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
