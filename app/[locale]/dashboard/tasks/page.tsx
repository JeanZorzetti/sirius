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

  const [myTotal, myOverdue, myDueToday, entitlements] = await Promise.all([
    prisma.task.count({ where: myTasksWhere }),
    prisma.task.count({
      where: { ...myTasksWhere, dueDate: { lt: now } },
    }),
    prisma.task.count({
      where: { ...myTasksWhere, dueDate: { gte: now, lte: endOfToday } },
    }),
    getOrganizationEntitlements(user.organizationId),
  ])

  const canAccessAnalytics = entitlements.features.taskAnalytics ?? false

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

        {/* Analytics Quick Card (PRO+) */}
        {canAccessAnalytics && (
          <Link
            href="/dashboard/tasks/analytics"
            className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent p-6 transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Analytics</h2>
                <p className="text-xs text-muted-foreground">
                  Produtividade e insights
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground" />
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
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/tasks/${project.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: project.color }}
                  >
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {project._count.tasks} tarefa(s)
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold leading-tight text-foreground">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Abrir projeto →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
