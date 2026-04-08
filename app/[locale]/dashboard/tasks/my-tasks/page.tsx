import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, CheckSquare, AlertCircle, Clock, Calendar } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { MyTasksWorkspace } from '@/components/tasks/my-tasks-workspace'
import type { TaskLite } from '@/components/tasks/task-types'

export const metadata: Metadata = {
  title: 'Minhas Tarefas - CRM',
}

export const dynamic = 'force-dynamic'

export default async function MyTasksPage() {
  const session = await getSession()
  if (!session?.user?.email) {
    return <div>Não autorizado.</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true },
  })

  if (!user?.organizationId) {
    return <div>Usuário não pertence a uma organização.</div>
  }

  const tasks = await prisma.task.findMany({
    where: {
      organizationId: user.organizationId,
      archived: false,
      assigneeId: user.id,
    },
    include: {
      status: true,
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      labels: true,
      project: { select: { id: true, name: true, color: true } },
      deal: { select: { id: true, title: true } },
      contact: { select: { id: true, name: true } },
      _count: {
        select: { subtasks: true, comments: true, checklists: true },
      },
    },
    orderBy: [
      { completedAt: 'asc' },
      { dueDate: 'asc' },
      { priority: 'desc' },
    ],
  })

  const now = new Date()
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const overdue = tasks.filter(
    (t) => !t.completedAt && t.dueDate && new Date(t.dueDate) < now
  ).length
  const dueToday = tasks.filter(
    (t) =>
      !t.completedAt &&
      t.dueDate &&
      new Date(t.dueDate) >= now &&
      new Date(t.dueDate) <= endOfToday
  ).length
  const open = tasks.filter((t) => !t.completedAt).length
  const completed = tasks.filter((t) => !!t.completedAt).length

  const stats = [
    { label: 'Abertas', value: open, icon: CheckSquare, color: 'text-indigo-500 bg-indigo-500/10' },
    { label: 'Hoje', value: dueToday, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Atrasadas', value: overdue, icon: AlertCircle, color: 'text-red-500 bg-red-500/10' },
    { label: 'Concluídas', value: completed, icon: Calendar, color: 'text-emerald-500 bg-emerald-500/10' },
  ]

  return (
    <div className="flex-1 space-y-6">
      <Link
        href="/dashboard/tasks"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Todos os projetos
      </Link>

      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground">
          Minhas Tarefas
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Todas as tarefas atribuídas a você em todos os projetos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight text-foreground">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <MyTasksWorkspace tasks={tasks as unknown as TaskLite[]} />
    </div>
  )
}
