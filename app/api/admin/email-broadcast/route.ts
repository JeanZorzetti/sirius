/**
 * POST /api/admin/email-broadcast
 * Admin-only: send WhatsApp migration notice to Starter/Pro orgs.
 * Only accessible to users with admin email (jeanzorzetti@gmail.com).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { sendEmail } from '@/lib/email'
import { WhatsAppMigrationEmail } from '@/emails/templates/whatsapp-migration'
import logger from '@/lib/logger'
import { Role } from '@prisma/client'
import React from 'react'

const ADMIN_EMAIL = 'jeanzorzetti@gmail.com'

export async function GET() {
  const session = await getSession()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Count affected orgs: Starter or Pro tier that have at least one WhatsAppConnection
  const waConnRows = await prismaWa.$queryRaw<{ org_id: string }[]>`
    SELECT DISTINCT "organizationId" AS org_id FROM "WhatsAppConnection"
  `
  const waOrgIds = waConnRows.map(r => r.org_id)

  if (!waOrgIds.length) {
    return NextResponse.json({ count: 0, orgs: [] })
  }

  const orgs = await prisma.organization.findMany({
    where: {
      id: { in: waOrgIds },
      tier: { in: ['STARTER', 'PRO'] },
    },
    select: {
      id: true,
      name: true,
      tier: true,
      users: {
        where: { role: Role.ADMIN },
        select: { id: true, name: true, email: true },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  return NextResponse.json({
    count: orgs.length,
    orgs: orgs.map(o => ({
      id: o.id,
      name: o.name,
      tier: o.tier,
      adminEmail: o.users[0]?.email ?? null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun: boolean = body.dryRun === true

  // Fetch affected orgs (same query as GET)
  const waConnRows = await prismaWa.$queryRaw<{ org_id: string }[]>`
    SELECT DISTINCT "organizationId" AS org_id FROM "WhatsAppConnection"
  `
  const waOrgIds = waConnRows.map(r => r.org_id)

  if (!waOrgIds.length) {
    return NextResponse.json({ dryRun, total: 0, sent: 0, errors: 0, results: [] })
  }

  const orgs = await prisma.organization.findMany({
    where: {
      id: { in: waOrgIds },
      tier: { in: ['STARTER', 'PRO'] },
    },
    select: {
      id: true,
      name: true,
      tier: true,
      users: {
        where: { role: Role.ADMIN },
        select: { id: true, name: true, email: true },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const results: { orgId: string; orgName: string; email: string; status: 'sent' | 'skipped' | 'error'; error?: string }[] = []

  for (const org of orgs) {
    const admin = org.users[0]
    if (!admin?.email) {
      results.push({ orgId: org.id, orgName: org.name, email: '(none)', status: 'skipped' })
      continue
    }

    if (dryRun) {
      results.push({ orgId: org.id, orgName: org.name, email: admin.email, status: 'skipped' })
      continue
    }

    try {
      const emailElement = React.createElement(WhatsAppMigrationEmail, {
        userName: admin.name || admin.email,
        organizationName: org.name,
      })

      const res = await sendEmail({
        to: admin.email,
        subject: 'Importante: mudança no WhatsApp do Sirius CRM',
        react: emailElement,
      })

      if (!res.success) throw new Error(String(res.error))

      // Log in EmailLog
      await prisma.emailLog.create({
        data: {
          organizationId: org.id,
          userId: admin.id,
          type: 'UPGRADE_NUDGE',
          to: admin.email,
          subject: 'Importante: mudança no WhatsApp do Sirius CRM',
          status: 'SENT',
          sentAt: new Date(),
        },
      }).catch(() => {}) // non-blocking

      results.push({ orgId: org.id, orgName: org.name, email: admin.email, status: 'sent' })
      logger.info({ orgId: org.id, email: admin.email }, 'broadcast: whatsapp migration email sent')
    } catch (err: any) {
      results.push({ orgId: org.id, orgName: org.name, email: admin.email, status: 'error', error: err.message })
      logger.error({ orgId: org.id, email: admin.email, error: err.message }, 'broadcast: failed to send')
    }
  }

  const sent = results.filter(r => r.status === 'sent').length
  const errors = results.filter(r => r.status === 'error').length

  return NextResponse.json({ dryRun, total: orgs.length, sent, errors, results })
}
