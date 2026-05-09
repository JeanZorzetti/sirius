import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FolderKanban, CheckSquare, BarChart3, ArrowRight, LayoutGrid } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getOrganizationEntitlements } from '@/lib/feature-gates'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { TasksHubActions } from '@/components/tasks/tasks-hub-actions'
import { ProjectCard } from '@/components/tasks/project-card'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  return { title: `${t('pages.tasks.title')} - CRM` }
}

export const dynamic = 'force-dynamic'

export default async function TasksHubPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const session = await getSession()
  if (!session?.user?.email) {
    return <div>{t('errors.unauthorized')}</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true, orgRole: true },
  })

  if (!user?.organizationId) {
    return <div>{t('errors.userNoOrg')}</div>
  }

  const userRole = user.orgRole ?? 'MEMBER'

  // Fetch all projects for organization, then filter by allowedRoles client-side.
  // allowedRoles column may not exist yet if db push hasn't run — graceful fallback.
  let allProjects: Array<{
    id: string
    name: string
    description: string | null
    color: string
    allowedRoles: string[]
    order: number
    createdAt: Date
    _count: { tasks: number }
  }>

  try {
    allProjects = await prisma.taskProject.findMany({
      where: {
        organizationId: user.organizationId,
        archived: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        allowedRoles: true,
        order: true,
        createdAt: true,
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
  } catch {
    // Fallback: query without allowedRoles if column doesn't exist yet (pre-migration)
    const rows = await prisma.taskProject.findMany({
      where: { organizationId: user.organizationId, archived: false },
      select: { id: true, name: true, description: true, color: true, order: true, createdAt: true, _count: { select: { tasks: { where: { archived: false } } } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
    allProjects = rows.map((p) => ({ ...p, allowedRoles: [] }))
  }

  // OWNER always sees all projects. Others: if allowedRoles is empty → visible to all,
  // otherwise the user's role must be in the list.
  const projects = userRole === 'OWNER'
    ? allProjects
    : allProjects.filter((p) =>
        p.allowedRoles.length === 0 || p.allowedRoles.includes(userRole as string)
      )

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

  const canManageRoles = userRole === 'OWNER' || userRole === 'GERENTE'
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
    <div className="flex-1 space-y-10 sm:space-y-12 pb-12 w-full max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Premium */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            Tarefas <span className="text-muted-foreground/30 font-light">/</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Central de projetos e produtividade. Organize demandas, gerencie status e monitore a performance da sua equipe de forma interativa.
          </p>
        </div>
        <TasksHubActions />
      </div>

      {/* Quick Cards Grid */}
      <div className={canAccessAnalytics ? 'grid grid-cols-1 gap-5 lg:grid-cols-3' : 'grid grid-cols-1 gap-5'}>
        {/* My Tasks Quick Card */}
        <Link
          href="/dashboard/tasks/my-tasks"
          className={`group relative block overflow-hidden rounded-3xl border border-indigo-500/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background p-8 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:-translate-y-1 ${canAccessAnalytics ? 'lg:col-span-2' : ''}`}
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-full">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500 ring-1 ring-inset ring-indigo-500/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <CheckSquare className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">A Minha Fila</h2>
                <p className="mt-1 text-sm text-muted-foreground/80 font-medium">
                  {myTotal === 0 ? "Você não possui nenhuma atividade atribuída." : `Sua lista tem ${myTotal} atividades distribuídas.`}
                </p>
              </div>
            </div>
            
            <div className="flex w-full md:w-auto items-center justify-around md:justify-end gap-6 sm:gap-10 border-t md:border-t-0 border-border/40 pt-6 md:pt-0">
              <div className="text-center group/stat">
                <div className="text-3xl font-black tracking-tight text-foreground transition-transform group-hover/stat:scale-110">{myTotal}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Abertas</div>
              </div>
              <div className="text-center group/stat">
                <div className="flex items-center justify-center gap-1 text-3xl font-black tracking-tight text-amber-500 transition-transform group-hover/stat:scale-110">
                  {myDueToday}
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Hoje</div>
              </div>
              <div className="text-center group/stat relative">
                {myOverdue > 0 && <span className="absolute -top-1 -right-2 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span></span>}
                <div className="flex items-center justify-center gap-1 text-3xl font-black tracking-tight text-rose-500 transition-transform group-hover/stat:scale-110">
                  {myOverdue}
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-rose-500/70">Atrasos</div>
              </div>
            </div>
          </div>
        </Link>

        {/* Analytics + Velocity Card (PRO+) */}
        {canAccessAnalytics && (
          <Link
            href="/dashboard/tasks/analytics"
            className="group relative flex flex-col justify-between gap-5 overflow-hidden rounded-3xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-background p-8 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] hover:-translate-y-1"
          >
            {/* Ambient glow */}
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />

            {/* Top: icon + título */}
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 ring-1 ring-inset ring-emerald-500/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Desempenho</h2>
                  <p className="text-xs text-emerald-600/80 font-medium tracking-wide uppercase mt-0.5">Visão Analytics</p>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-background/50 flex items-center justify-center backdrop-blur shadow-sm group-hover:bg-background transition-colors">
                 <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:-rotate-45 transition-all duration-300" />
              </div>
            </div>

            {/* Sparkline de velocity */}
            <div className="relative z-10 space-y-3 mt-auto">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="font-display text-4xl font-black tracking-tighter text-foreground leading-none">
                    {currentVelocity}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    tasks entregues / sem
                  </p>
                </div>
                {velocityDelta !== null && (
                  <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${velocityDelta >= 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20'}`}>
                    {velocityDelta >= 0 ? '↑' : '↓'} {Math.abs(velocityDelta)}%
                  </div>
                )}
              </div>

              {/* Mini sparkline SVG bar */}
              <div className="flex items-end gap-1.5 h-10 mt-2">
                {weeklyVelocity.map((v, i) => {
                  const maxV = Math.max(...weeklyVelocity, 1)
                  const h = Math.max(10, Math.round((v / maxV) * 100))
                  const isLast = i === weeklyVelocity.length - 1
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-md transition-all duration-500 ${isLast ? 'bg-emerald-500 shadow-md' : 'bg-emerald-500/20'}`}
                      style={{ height: `${h}%` }}
                    />
                  )
                })}
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Projects Grid */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
             <div className="bg-muted p-2 rounded-lg"><LayoutGrid className="w-5 h-5 text-muted-foreground" /></div>
             <h2 className="text-xl font-bold tracking-tight text-foreground">
              Diretórios do Projeto
             </h2>
          </div>
          <span className="text-sm font-semibold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{projects.length} ativados</span>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Nenhum projeto ainda"
            description="Crie seu primeiro projeto de tarefas para começar a organizar o trabalho do seu time."
            action={<TasksHubActions variant="empty" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => {
              const total = project._count.tasks
              const done = doneByProject.get(project.id) ?? 0
              const overdue = overdueByProject.get(project.id) ?? 0
              const progress = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  total={total}
                  done={done}
                  overdue={overdue}
                  progress={progress}
                  canManageRoles={canManageRoles}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
