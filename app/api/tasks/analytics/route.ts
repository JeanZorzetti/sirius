import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { requireFeature, FeatureBlockedError } from '@/lib/feature-gates'
import logger from '@/lib/logger'

/**
 * GET /api/tasks/analytics
 *
 * Query params:
 *   - projectId?: string  → escopo em um projeto (opcional, default = toda a org)
 *   - rangeDays?: number  → janela temporal para tendências (default: 30)
 *
 * Retorna métricas agregadas para o dashboard de analytics de tasks (PRO+).
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, orgRole: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Feature gate: analytics é PRO+
    try {
      await requireFeature(user.organizationId, 'can_use_task_analytics')
    } catch (err) {
      if (err instanceof FeatureBlockedError) {
        return NextResponse.json(
          {
            error: 'Feature bloqueada',
            feature: err.feature,
            requiredTier: err.requiredTier,
            currentTier: err.currentTier,
          },
          { status: 403 }
        )
      }
      throw err
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined
    const rangeDays = Math.max(
      1,
      Math.min(365, Number(searchParams.get('rangeDays') || 30))
    )

    const now = new Date()
    const rangeStart = new Date(now)
    rangeStart.setDate(rangeStart.getDate() - rangeDays)
    rangeStart.setHours(0, 0, 0, 0)

    const baseWhere: any = {
      organizationId: user.organizationId,
      archived: false,
    }
    if (projectId) baseWhere.projectId = projectId

    // MEMBER só vê o que pode ver
    if (user.orgRole === 'MEMBER') {
      baseWhere.OR = [{ assigneeId: user.id }, { creatorId: user.id }]
    }

    // ── Queries em paralelo ────────────────────────────────────────
    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByStatusRaw,
      tasksByPriority,
      completionsInRange,
      createdInRange,
      topAssigneesRaw,
      avgCompletionTimeRaw,
      overdueList,
    ] = await Promise.all([
      // Total
      prisma.task.count({ where: baseWhere }),

      // Concluídas (no range)
      prisma.task.count({
        where: {
          ...baseWhere,
          completedAt: { gte: rangeStart, lte: now },
        },
      }),

      // Overdue (dueDate passou e não concluída)
      prisma.task.count({
        where: {
          ...baseWhere,
          dueDate: { lt: now },
          completedAt: null,
        },
      }),

      // Por status
      prisma.task.groupBy({
        by: ['statusId'],
        where: baseWhere,
        _count: { _all: true },
      }),

      // Por prioridade
      prisma.task.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: { _all: true },
      }),

      // Concluídas por dia no range
      prisma.task.findMany({
        where: {
          ...baseWhere,
          completedAt: { gte: rangeStart, lte: now },
        },
        select: { completedAt: true },
      }),

      // Criadas por dia no range
      prisma.task.findMany({
        where: {
          ...baseWhere,
          createdAt: { gte: rangeStart, lte: now },
        },
        select: { createdAt: true },
      }),

      // Top assignees (todas as tasks do escopo)
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { ...baseWhere, assigneeId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { assigneeId: 'desc' } },
        take: 10,
      }),

      // Tempo médio de conclusão (em ms) — só tasks com completedAt e createdAt
      prisma.task.findMany({
        where: {
          ...baseWhere,
          completedAt: { not: null, gte: rangeStart },
        },
        select: { createdAt: true, completedAt: true },
      }),

      // Lista de overdue (top 10 mais antigas)
      prisma.task.findMany({
        where: {
          ...baseWhere,
          dueDate: { lt: now },
          completedAt: null,
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          priority: true,
          projectId: true,
          assignee: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, color: true } },
          status: { select: { id: true, name: true, color: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
    ])

    // ── Resolver nomes de status e assignees ─────────────────────────
    const statusIds = tasksByStatusRaw.map((s) => s.statusId)
    const assigneeIds = topAssigneesRaw
      .map((a) => a.assigneeId)
      .filter((id): id is string => !!id)

    const [statusDetails, assigneeDetails] = await Promise.all([
      prisma.taskStatus.findMany({
        where: { id: { in: statusIds } },
        select: { id: true, name: true, color: true, type: true },
      }),
      prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, name: true, email: true },
      }),
    ])

    const statusMap = new Map(statusDetails.map((s) => [s.id, s]))
    const assigneeMap = new Map(assigneeDetails.map((u) => [u.id, u]))

    // ── Processamento ───────────────────────────────────────────────
    const tasksByStatus = tasksByStatusRaw.map((s) => ({
      statusId: s.statusId,
      count: s._count._all,
      name: statusMap.get(s.statusId)?.name ?? 'Desconhecido',
      color: statusMap.get(s.statusId)?.color ?? '#71717a',
      type: statusMap.get(s.statusId)?.type ?? 'OPEN',
    }))

    const priorityCounts = tasksByPriority.map((p) => ({
      priority: p.priority,
      count: p._count._all,
    }))

    // Série diária: completions vs created
    const dailyMap = new Map<
      string,
      { date: string; completed: number; created: number }
    >()
    for (let d = 0; d < rangeDays; d++) {
      const day = new Date(rangeStart)
      day.setDate(day.getDate() + d)
      const key = day.toISOString().slice(0, 10)
      dailyMap.set(key, { date: key, completed: 0, created: 0 })
    }
    for (const t of completionsInRange) {
      if (!t.completedAt) continue
      const key = t.completedAt.toISOString().slice(0, 10)
      const entry = dailyMap.get(key)
      if (entry) entry.completed += 1
    }
    for (const t of createdInRange) {
      const key = t.createdAt.toISOString().slice(0, 10)
      const entry = dailyMap.get(key)
      if (entry) entry.created += 1
    }
    const trend = Array.from(dailyMap.values())

    // Top assignees com dados
    const topAssignees = topAssigneesRaw
      .filter((a) => a.assigneeId)
      .map((a) => {
        const u = assigneeMap.get(a.assigneeId!)
        return {
          userId: a.assigneeId!,
          name: u?.name ?? 'Sem nome',
          email: u?.email ?? '',
          image: null as string | null,
          count: a._count._all,
        }
      })

    // Tempo médio de conclusão
    let avgCompletionHours = 0
    if (avgCompletionTimeRaw.length > 0) {
      const totalMs = avgCompletionTimeRaw.reduce((sum, t) => {
        if (!t.completedAt) return sum
        return sum + (t.completedAt.getTime() - t.createdAt.getTime())
      }, 0)
      avgCompletionHours = totalMs / avgCompletionTimeRaw.length / (1000 * 60 * 60)
    }

    // KPIs
    const completionRate =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0
    const inProgressCount =
      tasksByStatus
        .filter((s) => s.type === 'IN_PROGRESS')
        .reduce((sum, s) => sum + s.count, 0) || 0

    return NextResponse.json({
      rangeDays,
      projectId: projectId ?? null,
      kpis: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressCount,
        overdue: overdueTasks,
        completionRate,
        avgCompletionHours: Number(avgCompletionHours.toFixed(1)),
      },
      tasksByStatus,
      tasksByPriority: priorityCounts,
      trend,
      topAssignees,
      overdueList,
    })
  } catch (error) {
    logger.error({ err: error }, '[tasks/analytics] error')
    return NextResponse.json(
      { error: 'Erro interno ao calcular analytics' },
      { status: 500 }
    )
  }
}
