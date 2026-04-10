import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FolderKanban, CheckSquare, Clock, AlertCircle, Plus, BarChart3, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getOrganizationEntitlements } from '@/lib/feature-gates'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { TasksHubActions } from '@/components/tasks/tasks-hub-actions'

export const metadata: Metadata = {
  title: 'Tarefas - CRM',
}

export const dynamic = 'force-dynamic'

export default async function TasksHubPage() {
  const session = await getSession()
  if (!session?.user?.email) {
    return <div>Não autorizado. Faça login novamente.</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true },
  })

  if (!user?.organizationId) {
    return <div>Usuário não pertence a uma organização.</div>
  }

  // Fetch all projects for organization
  const projects = await prisma.taskProject.findMany({
    where: {
      organizationId: user.organizationId,
      archived: false,
    },
    include: {
      _count: {
        select: {
          tasks: {
            where: { archived: false },
          },
        },
      },
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

  // My tasks aggregate counts
  const myTasksWhere = {
    organizationId: user.organizationId,
    archived: false,
    assigneeId: user.id,
    completedAt: null,
  }

  const now = new Date()
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  // Velocity: tasks concluídas nas últimas 4 semanas para sparkline
  const fourWeeksAgo = new Date(now)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const projectIds = projects.map((p) => p.id)

  const [myTotal, myOverdue, myDueToday, entitlements, velocityRaw, projectDoneRaw, projectOverdueRaw] = await Promise.all([
    prisma.task.count({ where: myTasksWhere }),
    prisma.task.count({
      where: { ...myTasksWhere, dueDate: { lt: now } },
    }),
    prisma.task.count({
      where: { ...myTasksWhere, dueDate: { gte: now, lte: endOfToday } },
    }),
    getOrganizationEntitlements(user.organizationId),
    prisma.task.findMany({
      where: {
        organizationId: user.organizationId,
        archived: false,
        completedAt: { gte: fourWeeksAgo, lte: now },
      },
      select: { completedAt: true },
    }),
    // Done count por projeto
    prisma.task.groupBy({
      by: ['projectId'],
      where: {
        organizationId: user.organizationId,
        archived: false,
        projectId: { in: projectIds },
        completedAt: { not: null },
      },
      _count: { _all: true },
    }),
    // Overdue count por projeto
    prisma.task.groupBy({
      by: ['projectId'],
      where: {
        organizationId: user.organizationId,
        archived: false,
        projectId: { in: projectIds },
        dueDate: { lt: now },
        completedAt: null,
      },
      _count: { _all: true },
    }),
  ])

  // Maps para lookup rápido por projectId
  const doneByProject = new Map(projectDoneRaw.map((r) => [r.projectId, r._count._all]))
  const overdueByProject = new Map(projectOverdueRaw.map((r) => [r.projectId, r._count._all]))

  const canAccessAnalytics = entitlements.features.taskAnalytics ?? false

  // Calcular velocity por semana (4 pontos)
  const weeklyVelocity: number[] = [0, 0, 0, 0]
  for (const t of velocityRaw) {
    if (!t.completedAt) continue
    const diffDays = Math.floor((now.getTime() - t.completedAt.getTime()) / (1000 * 60 * 60 * 24))
    const weekIdx = Math.min(3, Math.floor(diffDays / 7))
    weeklyVelocity[3 - weekIdx] += 1 // índice 3 = semana mais recente
  }
  const currentVelocity = weeklyVelocity[3]
  const prevVelocity = weeklyVelocity[2]
  const velocityDelta = prevVelocity > 0 ? Math.round(((currentVelocity - prevVelocity) / prevVelocity) * 100) : null

  return (
    <div className="flex-1 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-bold tracking-tighter text-foreground">
            Tarefas
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Organize seu trabalho em projetos. Crie tarefas, defina prazos e acompanhe o progresso.
          </p>
        </div>
        <TasksHubActions />
      </div>

      {/* Quick Cards Grid */}
      <div className={canAccessAnalytics ? 'grid grid-cols-1 gap-4 lg:grid-cols-3' : ''}>
        {/* My Tasks Quick Card */}
        <Link
          href="/dashboard/tasks/my-tasks"
          className={`group relative block overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent p-6 transition-all duration-200 hover:border-indigo-500/30 hover:shadow-md ${canAccessAnalytics ? 'lg:col-span-2' : ''}`}
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Minhas Tarefas</h2>
                <p className="text-xs text-muted-foreground">
                  Todas as tarefas atribuídas a você, em todos os projetos
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-6 sm:flex">
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight text-foreground">{myTotal}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Abertas</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {myDueToday}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Hoje</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                  {myOverdue}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Atrasadas</div>
              </div>
            </div>
          </div>
        </Link>

        {/* Analytics + Velocity Card (PRO+) */}
        {canAccessAnalytics && (
          <Link
            href="/dashboard/tasks/analytics"
            className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent p-6 transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md"
          >
            {/* Top: icon + título */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Analytics</h2>
                  <p className="text-xs text-muted-foreground">Produtividade e insights</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>

            {/* Sparkline de velocity */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="font-display text-3xl font-bold tracking-tighter text-foreground leading-none">
                    {currentVelocity}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    tasks/semana
                  </p>
                </div>
                {velocityDelta !== null && (
                  <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${velocityDelta >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                    {velocityDelta >= 0 ? '↑' : '↓'} {Math.abs(velocityDelta)}%
                  </div>
                )}
              </div>

              {/* Mini sparkline SVG */}
              <div className="flex items-end gap-1 h-8">
                {weeklyVelocity.map((v, i) => {
                  const maxV = Math.max(...weeklyVelocity, 1)
                  const h = Math.max(4, Math.round((v / maxV) * 32))
                  const isLast = i === weeklyVelocity.length - 1
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm transition-all duration-300 ${isLast ? 'bg-emerald-500' : 'bg-emerald-500/25'}`}
                      style={{ height: `${h}px` }}
                    />
                  )
                })}
              </div>
              <p className="text-[10px] text-muted-foreground/60">últimas 4 semanas</p>
            </div>
          </Link>
        )}
      </div>

      {/* Projects Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Projetos
          </h2>
          <span className="text-xs text-muted-foreground">{projects.length} projeto(s)</span>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Nenhum projeto ainda"
            description="Crie seu primeiro projeto de tarefas para começar a organizar o trabalho do seu time."
            action={<TasksHubActions variant="empty" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const total = project._count.tasks
              const done = doneByProject.get(project.id) ?? 0
              const overdue = overdueByProject.get(project.id) ?? 0
              const progress = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <Link
                  key={project.id}
                  href={`/dashboard/tasks/${project.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md"
                >
                  {/* Accent bar colorida no topo */}
                  <div
                    className="absolute inset-x-0 top-0 h-0.5 opacity-60 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ backgroundColor: project.color }}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: project.color }}
                    >
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {overdue > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-500 ring-1 ring-inset ring-rose-500/20">
                          {overdue} atrasada{overdue !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {total} task{total !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-4 text-base font-semibold leading-tight text-foreground">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* Progress bar + stats */}
                  <div className="mt-auto pt-4 space-y-2">
                    {total > 0 && (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: project.color,
                                opacity: 0.8,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
                            {progress}%
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {done} de {total} concluída{done !== 1 ? 's' : ''}
                        </p>
                      </>
                    )}
                    <span className="block text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Abrir projeto →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
