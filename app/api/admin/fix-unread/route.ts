/**
 * POST /api/admin/fix-unread
 *
 * One-time fix: mark all OUTBOUND messages and history-sync messages as read.
 * This corrects inflated unread counters caused by history sync importing
 * old messages with isRead=false.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 1. Mark all OUTBOUND messages as read (they never need "reading")
  const outbound = await prismaWa.whatsAppMessage.updateMany({
    where: { direction: 'OUTBOUND', isRead: false },
    data: { isRead: true },
  })

  // 2. Mark all old INBOUND messages as read (older than 24h = historical)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const oldInbound = await prismaWa.whatsAppMessage.updateMany({
    where: {
      direction: 'INBOUND',
      isRead: false,
      sentAt: { lt: cutoff },
    },
    data: { isRead: true },
  })

  logger.info(
    { outbound: outbound.count, oldInbound: oldInbound.count },
    'fix-unread: marked messages as read'
  )

  return NextResponse.json({
    fixed: {
      outboundMarkedRead: outbound.count,
      oldInboundMarkedRead: oldInbound.count,
    },
  })
}
