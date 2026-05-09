/**
 * POST /api/admin/fix-waba-id
 * Admin-only: fix wabaBusinessAccountId for an org
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const ADMIN_EMAIL = 'jeanzorzetti@gmail.com'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { organizationId, wabaBusinessAccountId } = await req.json()

  if (!organizationId || !wabaBusinessAccountId) {
    return NextResponse.json({ error: 'organizationId and wabaBusinessAccountId required' }, { status: 400 })
  }

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { wabaBusinessAccountId },
    select: { id: true, name: true, wabaBusinessAccountId: true },
  })

  return NextResponse.json({ success: true, org })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgs = await prisma.organization.findMany({
    where: { OR: [{ wabaEnabled: true }, { wabaBusinessAccountId: { not: null } }] },
    select: { id: true, name: true, wabaBusinessAccountId: true, wabaPhoneNumberId: true, wabaEnabled: true },
  })

  return NextResponse.json(orgs)
}
