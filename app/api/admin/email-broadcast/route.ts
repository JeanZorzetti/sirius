/**
 * POST /api/admin/email-broadcast
 * Admin-only: send WhatsApp migration notice to all paying orgs (Starter/Pro/Business)
 * plus manually included FREE orgs that had a paid history.
 * Only accessible to users with admin email (jeanzorzetti@gmail.com).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { WhatsAppMigrationEmail } from '@/emails/templates/whatsapp-migration'
import logger from '@/lib/logger'
import React from 'react'

const ADMIN_EMAIL = 'jeanzorzetti@gmail.com'

// FREE orgs that previously had a paid plan — include manually
const OVERRIDE_ORG_IDS = [
  'e83b0cb1-edc1-4bec-b75e-c651202d38e7', // 3A3 Consultoria
  'b79b1f21-52ae-47f0-bbdf-cf9c76b562cb', // Cartopel
  '9c46f7ac-32b2-4130-adb6-bd66e5d2e75c', // worldseg
]

async function fetchOrgs() {
  const [payingOrgs, overrideOrgs] = await Promise.all([
    prisma.organization.findMany({
      where: { tier: { in: ['STARTER', 'PRO', 'BUSINESS'] }, isTestAccount: false },
      select: {
        id: true, name: true, tier: true,
        users: { select: { id: true, name: true, email: true, role: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.organization.findMany({
      where: { id: { in: OVERRIDE_ORG_IDS } },
      select: {
        id: true, name: true, tier: true,
        users: { select: { id: true, name: true, email: true, role: true }, orderBy: { createdAt: 'asc' } },
      },
    }),
  ])

  // Merge, deduplicate by id
  const seen = new Set<string>()
  const all = [...payingOrgs, ...overrideOrgs].filter(o => {
    if (seen.has(o.id)) return false
    seen.add(o.id)
    return true
  })

  return all.map(o => {
    // Prefer ADMIN user; fallback to first user
    const admin = o.users.find(u => u.role === 'ADMIN') ?? o.users[0] ?? null
    return { id: o.id, name: o.name, tier: o.tier, user: admin }
  })
}

export async function GET() {
  const session = await getSession()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgs = await fetchOrgs()

  return NextResponse.json({
    count: orgs.length,
    orgs: orgs.map(o => ({
      id: o.id,
      name: o.name,
      tier: o.tier,
      adminEmail: o.user?.email ?? null,
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

  const orgs = await fetchOrgs()
  const results: { orgId: string; orgName: string; email: string; status: 'sent' | 'skipped' | 'no-email' | 'error'; error?: string }[] = []

  for (const org of orgs) {
    if (!org.user?.email) {
      results.push({ orgId: org.id, orgName: org.name, email: '(none)', status: 'no-email' })
      continue
    }

    if (dryRun) {
      results.push({ orgId: org.id, orgName: org.name, email: org.user.email, status: 'skipped' })
      continue
    }

    try {
      const emailElement = React.createElement(WhatsAppMigrationEmail, {
        userName: org.user.name || org.user.email,
        organizationName: org.name,
      })

      const res = await sendEmail({
        to: org.user.email,
        subject: 'Atualização importante: WhatsApp Oficial no Sirius CRM',
        react: emailElement,
      })

      if (!res.success) throw new Error(String(res.error))

      await prisma.emailLog.create({
        data: {
          organizationId: org.id,
          userId: org.user.id,
          type: 'UPGRADE_NUDGE',
          to: org.user.email,
          subject: 'Atualização importante: WhatsApp Oficial no Sirius CRM',
          status: 'SENT',
          sentAt: new Date(),
        },
      }).catch(() => {})

      results.push({ orgId: org.id, orgName: org.name, email: org.user.email, status: 'sent' })
      logger.info({ orgId: org.id, email: org.user.email }, 'broadcast: whatsapp migration email sent')
    } catch (err: any) {
      results.push({ orgId: org.id, orgName: org.name, email: org.user.email, status: 'error', error: err.message })
      logger.error({ orgId: org.id, email: org.user.email, error: err.message }, 'broadcast: failed to send')
    }

    // Stay under Resend's 5 req/s rate limit
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  const sent = results.filter(r => r.status === 'sent').length
  const errors = results.filter(r => r.status === 'error').length

  return NextResponse.json({ dryRun, total: orgs.length, sent, errors, results })
}
