import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { requireFeature, FeatureBlockedError } from '@/lib/feature-gates'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * GET /api/tasks/analytics
 *
 * Query params:
 *   - projectId?: string  → escopo em um projeto (opcional)
 *   - rangeDays?: number  → janela temporal (default: 30)
 *
 * Retorna métricas + comparação com período anterior (PRO+).
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, orgRole: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

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
    const rangeDays = Math.max(1, Math.min(365, Number(searchParams.get('rangeDays') || 30)))

    // ── Janelas de tempo ────────────────────────────────────────────
    const now = new Date()

    const rangeStart = new Date(now)
    rangeStart.setDate(rangeStart.getDate() - rangeDays)
    rangeStart.setHours(0, 0, 0, 0)

    // Período anterior: mesmo número de dias, imediatamente antes do rangeStart
    const prevRangeEnd = new Date(rangeStart)
    prevRangeEnd.setMilliseconds(prevRangeEnd.getMilliseconds() - 1)
    const prevRangeStart = new Date(rangeStart)
    prevRangeStart.setDate(prevRangeStart.getDate() - rangeDays)
    prevRangeStart.setHours(0, 0, 0, 0)

    // ── Base where ──────────────────────────────────────────────────
    const baseWhere: any = {
      organizationId: user.organizationId,
      archived: false,
    }
    if (projectId) baseWhere.projectId = projectId
    if (user.orgRole === 'MEMBER') {
      baseWhere.OR = [{ assigneeId: user.id }, { creatorId: user.id }]
    }

    // ── Queries período atual + anterior em paralelo ────────────────
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
      // Período anterior
      prevCompletedTasks,
      prevOverdueTasks,
      prevCreatedTasks,
      prevAvgCompletionTimeRaw,
      prevCompletionsInRange,
      heatmapRaw,
    ] = await Promise.all([
      // ── Período atual ──
      prisma.task.count({ where: baseWhere }),

      prisma.task.count({
        where: { ...baseWhere, completedAt: { gte: rangeStart, lte: now } },
      }),

      prisma.task.count({
        where: { ...baseWhere, dueDate: { lt: now }, completedAt: null },
      }),

      prisma.task.groupBy({
        by: ['statusId'],
        where: baseWhere,
        _count: { _all: true },
      }),

      prisma.task.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { _count: { priority: 'desc' } },
      }),

      prisma.task.findMany({
        where: { ...baseWhere, completedAt: { gte: rangeStart, lte: now } },
        select: { completedAt: true },
      }),

      prisma.task.findMany({
        where: { ...baseWhere, createdAt: { gte: rangeStart, lte: now } },
        select: { createdAt: true },
      }),

      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { ...baseWhere, assigneeId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { assigneeId: 'desc' } },
        take: 10,
      }),

      prisma.task.findMany({
        where: { ...baseWhere, completedAt: { not: null, gte: rangeStart } },
        select: { createdAt: true, completedAt: true },
      }),

      prisma.task.findMany({
        where: { ...baseWhere, dueDate: { lt: now }, completedAt: null },
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

      // ── Período anterior ──
      prisma.task.count({
        where: { ...baseWhere, completedAt: { gte: prevRangeStart, lte: prevRangeEnd } },
      }),

      prisma.task.count({
        where: { ...baseWhere, dueDate: { lt: prevRangeEnd }, completedAt: null, createdAt: { lte: prevRangeEnd } },
      }),

      prisma.task.count({
        where: { ...baseWhere, createdAt: { gte: prevRangeStart, lte: prevRangeEnd } },
      }),

      prisma.task.findMany({
        where: { ...baseWhere, completedAt: { not: null, gte: prevRangeStart, lte: prevRangeEnd } },
        select: { createdAt: true, completedAt: true },
      }),

      // Série diária do período anterior (para overlay no trend chart)
      prisma.task.findMany({
        where: { ...baseWhere, completedAt: { gte: prevRangeStart, lte: prevRangeEnd } },
        select: { completedAt: true },
      }),

      // Heatmap anual: completions por dia nos últimos 365 dias
      prisma.task.findMany({
        where: {
          ...baseWhere,
          completedAt: {
            gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            lte: now,
          },
        },
        select: { completedAt: true },
      }),
    ])

    // ── Resolver nomes ──────────────────────────────────────────────
    const statusIds = tasksByStatusRaw.map((s) => s.statusId)
    const assigneeIds = topAssigneesRaw.map((a) => a.assigneeId).filter((id): id is string => !!id)

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

    // ── Processamento período atual ─────────────────────────────────
    const tasksByStatus = tasksByStatusRaw.map((s) => ({
      statusId: s.statusId,
      count: s._count._all,
      name: statusMap.get(s.statusId)?.name ?? 'Desconhecido',
      color: statusMap.get(s.statusId)?.color ?? '#71717a',
      type: statusMap.get(s.statusId)?.type ?? 'OPEN',
    }))

    const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']
    const PRIORITY_LABELS: Record<string, string> = {
      URGENT: 'Urgente',
      HIGH: 'Alta',
      MEDIUM: 'Média',
      LOW: 'Baixa',
      NONE: 'Sem prioridade',
    }
    const PRIORITY_COLORS: Record<string, string> = {
      URGENT: '#f43f5e',
      HIGH: '#f97316',
      MEDIUM: '#f59e0b',
      LOW: '#38bdf8',
      NONE: '#71717a',
    }
    const priorityMap = new Map(tasksByPriority.map((p) => [p.priority, p._count._all]))
    const tasksByPriorityFull = PRIORITY_ORDER.map((p) => ({
      priority: p,
      label: PRIORITY_LABELS[p],
      color: PRIORITY_COLORS[p],
      count: priorityMap.get(p as any) ?? 0,
    })).filter((p) => p.count > 0)

    // Série diária
    const dailyMap = new Map<string, { date: string; completed: number; created: number }>()
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

    // Série do período anterior — mesmos índices de dia (0..rangeDays-1) para overlay
    const prevDailyMap = new Map<string, number>()
    for (let d = 0; d < rangeDays; d++) {
      const day = new Date(prevRangeStart)
      day.setDate(day.getDate() + d)
      const key = day.toISOString().slice(0, 10)
      prevDailyMap.set(key, 0)
    }
    for (const t of prevCompletionsInRange) {
      if (!t.completedAt) continue
      const key = t.completedAt.toISOString().slice(0, 10)
      if (prevDailyMap.has(key)) prevDailyMap.set(key, (prevDailyMap.get(key) ?? 0) + 1)
    }
    // Converte para array com índice relativo (0 = mais antigo) para o chart
    const prevTrend = trend.map((_, i) => {
      const entries = Array.from(prevDailyMap.values())
      return entries[i] ?? 0
    })

    // Velocity: média de tasks concluídas por semana
    const weeksInRange = Math.max(1, rangeDays / 7)
    const velocity = Math.round((completionsInRange.length / weeksInRange) * 10) / 10

    // Top assignees
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

    // Tempo médio de conclusão (horas)
    function calcAvgHours(rows: { createdAt: Date; completedAt: Date | null }[]): number {
      if (rows.length === 0) return 0
      const totalMs = rows.reduce((sum, t) => {
        if (!t.completedAt) return sum
        return sum + (t.completedAt.getTime() - t.createdAt.getTime())
      }, 0)
      return totalMs / rows.length / (1000 * 60 * 60)
    }

    const avgCompletionHours = calcAvgHours(avgCompletionTimeRaw)
    const prevAvgCompletionHours = calcAvgHours(prevAvgCompletionTimeRaw)

    // ── Helpers de comparação ───────────────────────────────────────
    function delta(current: number, previous: number): number | null {
      if (previous === 0) return null
      return Math.round(((current - previous) / previous) * 100)
    }

    const currentCreated = createdInRange.length
    const prevCreatedCount = prevCreatedTasks

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const inProgressCount = tasksByStatus.filter((s) => s.type === 'IN_PROGRESS').reduce((sum, s) => sum + s.count, 0)

    // ── Heatmap: { date: 'yyyy-mm-dd', count: number }[] ──────────────
    const heatmapMap = new Map<string, number>()
    for (const t of heatmapRaw) {
      if (!t.completedAt) continue
      const key = t.completedAt.toISOString().slice(0, 10)
      heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1)
    }
    const heatmap = Array.from(heatmapMap.entries()).map(([date, count]) => ({ date, count }))

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
        velocity,
        created: currentCreated,
      },
      comparison: {
        completed: {
          current: completedTasks,
          previous: prevCompletedTasks,
          delta: delta(completedTasks, prevCompletedTasks),
        },
        overdue: {
          current: overdueTasks,
          previous: prevOverdueTasks,
          delta: delta(overdueTasks, prevOverdueTasks),
        },
        created: {
          current: currentCreated,
          previous: prevCreatedCount,
          delta: delta(currentCreated, prevCreatedCount),
        },
        avgCompletionHours: {
          current: Number(avgCompletionHours.toFixed(1)),
          previous: Number(prevAvgCompletionHours.toFixed(1)),
          delta: delta(
            Math.round(avgCompletionHours * 10),
            Math.round(prevAvgCompletionHours * 10)
          ),
        },
        velocity: {
          current: velocity,
          previous: Math.round((prevAvgCompletionTimeRaw.length / weeksInRange) * 10) / 10,
          delta: delta(
            completedTasks,
            prevCompletedTasks
          ),
        },
      },
      tasksByStatus,
      tasksByPriority: tasksByPriorityFull,
      trend,
      prevTrend,
      heatmap,
      topAssignees,
      overdueList,
    })
  } catch (error) {
    logger.error({ err: error }, '[tasks/analytics] error')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
