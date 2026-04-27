import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaff } from '@/lib/support-auth'

export async function GET(request: NextRequest) {
  const ctx = await requireStaff()
  if (ctx instanceof NextResponse) return ctx

  const [
    totalOpen,
    totalInProgress,
    totalWaitingUser,
    totalResolved,
    totalClosed,
    byCategory,
    byPriority,
    avgFirstResponseMs,
  ] = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'WAITING_USER' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    prisma.supportTicket.groupBy({
      by: ['category'],
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
    }),
    prisma.supportTicket.groupBy({
      by: ['priority'],
      _count: { _all: true },
    }),
    prisma.supportTicket.findMany({
      where: { firstResponseAt: { not: null } },
      select: { createdAt: true, firstResponseAt: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const avgSlaMs =
    avgFirstResponseMs.length > 0
      ? avgFirstResponseMs.reduce((acc, t) => {
          const ms =
            new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime()
          return acc + ms
        }, 0) / avgFirstResponseMs.length
      : null

  const avgSlaHours = avgSlaMs !== null ? Math.round(avgSlaMs / (1000 * 60 * 60) * 10) / 10 : null

  return NextResponse.json({
    byStatus: {
      OPEN: totalOpen,
      IN_PROGRESS: totalInProgress,
      WAITING_USER: totalWaitingUser,
      RESOLVED: totalResolved,
      CLOSED: totalClosed,
    },
    byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count._all])),
    byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count._all])),
    avgFirstResponseHours: avgSlaHours,
    totalActive: totalOpen + totalInProgress + totalWaitingUser,
  })
}
