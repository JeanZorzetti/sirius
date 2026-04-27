import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/access-logs?orgId=...&days=30
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })
    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const days = parseInt(searchParams.get('days') ?? '30', 10)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const orgFilter = orgId ? { organizationId: orgId } : {}

    // 1. Organizations with user stats (createdAt, lastAccess)
    const organizations = await prisma.organization.findMany({
      where: orgId ? { id: orgId } : {},
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            accessSessions: {
              orderBy: { loginAt: 'desc' },
              take: 1,
              select: { loginAt: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Average session duration per org
    const sessionStats = await prisma.accessSession.groupBy({
      by: ['organizationId'],
      where: {
        ...orgFilter,
        loginAt: { gte: since },
        durationS: { not: null },
      },
      _avg: { durationS: true },
      _count: { id: true },
    })
    const sessionMap = new Map(sessionStats.map((s) => [s.organizationId, s]))

    // 3. Top 5 pages per org
    const pageViews = await prisma.pageViewLog.groupBy({
      by: ['organizationId', 'path'],
      where: { ...orgFilter, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    // Group top pages by org
    const topPagesMap = new Map<string, { path: string; count: number }[]>()
    for (const pv of pageViews) {
      const list = topPagesMap.get(pv.organizationId) ?? []
      if (list.length < 5) list.push({ path: pv.path, count: pv._count.id })
      topPagesMap.set(pv.organizationId, list)
    }

    const result = organizations.map((org) => {
      const stats = sessionMap.get(org.id)
      const lastAccessDates = org.users
        .flatMap((u) => u.accessSessions.map((s) => s.loginAt))
        .sort((a, b) => b.getTime() - a.getTime())

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        tier: org.tier,
        createdAt: org.createdAt,
        userCount: org.users.length,
        users: org.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          lastAccess: u.accessSessions[0]?.loginAt ?? null,
        })),
        lastAccess: lastAccessDates[0] ?? null,
        avgSessionDurationS: stats?._avg?.durationS ? Math.round(stats._avg.durationS) : null,
        totalSessions: stats?._count?.id ?? 0,
        topPages: topPagesMap.get(org.id) ?? [],
      }
    })

    return NextResponse.json({ organizations: result, days, since })
  } catch (error) {
    console.error('access-logs error', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
