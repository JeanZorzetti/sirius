import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// Adoption score: 0–100
// - Sessions last N days:       35%  (capped at 60 sessions = 100%)
// - Avg session duration:       25%  (capped at 30 min = 100%)
// - Unique pages visited:       20%  (capped at 20 distinct pages = 100%)
// - DAU/MAU (active days / N):  20%  (1.0 = 100%)
function computeScore(
  totalSessions: number,
  avgDurationS: number | null,
  uniquePages: number,
  activeDays: number,
  days: number,
): number {
  const sessionScore = Math.min(totalSessions / 60, 1) * 35
  const durationScore = avgDurationS != null ? Math.min(avgDurationS / 1800, 1) * 25 : 0
  const pagesScore = Math.min(uniquePages / 20, 1) * 20
  const dauMau = Math.min(activeDays / days, 1) * 20
  return Math.round(sessionScore + durationScore + pagesScore + dauMau)
}

function adoptionLevel(score: number): 'champion' | 'active' | 'regular' | 'dormant' {
  if (score >= 70) return 'champion'
  if (score >= 40) return 'active'
  if (score >= 15) return 'regular'
  return 'dormant'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return await apiError(ERR.UNAUTHORIZED, 401)

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })
    if (!dbUser || dbUser.role !== 'ADMIN') {
      return await apiError(ERR.FORBIDDEN, 403)
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const days = parseInt(searchParams.get('days') ?? '30', 10)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const orgFilter = orgId ? { organizationId: orgId } : {}

    // 1. Orgs + users (with last session)
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
    })

    // 2. Session stats (count + avg duration)
    const sessionStats = await prisma.accessSession.groupBy({
      by: ['organizationId'],
      where: { ...orgFilter, loginAt: { gte: since }, durationS: { not: null } },
      _avg: { durationS: true },
      _count: { id: true },
    })
    const sessionMap = new Map(sessionStats.map((s) => [s.organizationId, s]))

    // 3. Active days per org (distinct calendar days with at least one session)
    const sessions = await prisma.accessSession.findMany({
      where: { ...orgFilter, loginAt: { gte: since } },
      select: { organizationId: true, loginAt: true },
    })
    const activeDaysMap = new Map<string, Set<string>>()
    for (const s of sessions) {
      const day = s.loginAt.toISOString().slice(0, 10)
      if (!activeDaysMap.has(s.organizationId)) activeDaysMap.set(s.organizationId, new Set())
      activeDaysMap.get(s.organizationId)!.add(day)
    }

    // 4. Page views — unique paths + top 5
    const pageViews = await prisma.pageViewLog.groupBy({
      by: ['organizationId', 'path'],
      where: { ...orgFilter, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    const topPagesMap = new Map<string, { path: string; count: number }[]>()
    const uniquePagesMap = new Map<string, number>()
    for (const pv of pageViews) {
      uniquePagesMap.set(pv.organizationId, (uniquePagesMap.get(pv.organizationId) ?? 0) + 1)
      const list = topPagesMap.get(pv.organizationId) ?? []
      if (list.length < 5) list.push({ path: pv.path, count: pv._count.id })
      topPagesMap.set(pv.organizationId, list)
    }

    const result = organizations.map((org) => {
      const stats = sessionMap.get(org.id)
      const totalSessions = stats?._count?.id ?? 0
      const avgDurationS = stats?._avg?.durationS ? Math.round(stats._avg.durationS) : null
      const uniquePages = uniquePagesMap.get(org.id) ?? 0
      const activeDays = activeDaysMap.get(org.id)?.size ?? 0

      const score = computeScore(totalSessions, avgDurationS, uniquePages, activeDays, days)
      const level = adoptionLevel(score)

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
        avgSessionDurationS: avgDurationS,
        totalSessions,
        activeDays,
        uniquePages,
        topPages: topPagesMap.get(org.id) ?? [],
        score,
        level,
      }
    })

    // Sort by score desc, then sessions desc
    result.sort((a, b) => b.score - a.score || b.totalSessions - a.totalSessions)

    return NextResponse.json({ organizations: result, days, since })
  } catch (error) {
    console.error('access-logs error', error)
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
