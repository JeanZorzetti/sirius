import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getOrganizationEntitlements } from '@/lib/feature-gates'
import { TaskProjectWorkspace } from '@/components/tasks/task-project-workspace'
import { ProjectMetricsBar } from '@/components/tasks/project-metrics-bar'
import { ProjectHeader } from '@/components/tasks/project-header'
import type { TaskLite, TaskStatusLite } from '@/components/tasks/task-types'

export const metadata: Metadata = {
  title: 'Projeto de Tarefas - CRM',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ projectId: string; locale: string }>
}

export default async function TaskProjectPage({ params }: Props) {
  const { projectId, locale } = await params

  const session = await getSession()
  if (!session?.user?.email) {
    return <div>Não autorizado. Faça login novamente.</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, orgRole: true, organizationId: true },
  })

  if (!user?.organizationId) {
    return <div>Usuário não pertence a uma organização.</div>
  }

  const project = await prisma.taskProject.findFirst({
    where: {
      id: projectId,
      organizationId: user.organizationId,
    },
    include: {
      statuses: { orderBy: { order: 'asc' } },
      labels: true,
    },
  })

  if (!project) {
    notFound()
  }

  const baseWhere: any = {
    projectId,
    organizationId: user.organizationId,
    archived: false,
    parentId: null,
  }

  // MEMBER users only see their own tasks
  if (user.orgRole === 'MEMBER') {
    baseWhere.OR = [{ assigneeId: user.id }, { creatorId: user.id }]
  }

  const tasks = await prisma.task.findMany({
    where: baseWhere,
    include: {
      status: true,
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      labels: true,
      deal: { select: { id: true, title: true } },
      contact: { select: { id: true, name: true } },
      _count: {
        select: {
          subtasks: true,
          comments: true,
          checklists: true,
        },
      },
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  const entitlements = await getOrganizationEntitlements(user.organizationId)

  return (
    <div className="flex-1 space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/tasks"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Todos os projetos
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <ProjectHeader
          projectId={project.id}
          projectName={project.name}
          projectColor={project.color}
          projectDescription={project.description}
          taskCount={tasks.length}
          statusCount={project.statuses.length}
          canEdit={user.orgRole === 'OWNER'}
        />
      </div>

      {/* Metrics bar */}
      <ProjectMetricsBar
        tasks={tasks as unknown as TaskLite[]}
        statuses={project.statuses as TaskStatusLite[]}
        projectId={project.id}
        locale={locale}
        canAccessAnalytics={entitlements.features.taskAnalytics ?? false}
      />

      {/* Workspace */}
      <TaskProjectWorkspace
        projectId={project.id}
        projectName={project.name}
        locale={locale}
        isAdmin={user.orgRole === 'OWNER'}
        statuses={project.statuses as TaskStatusLite[]}
        tasks={tasks as unknown as TaskLite[]}
        entitlements={{
          taskKanban: entitlements.features.taskKanban ?? true,
          taskCalendar: entitlements.features.taskCalendar ?? false,
          taskTable: entitlements.features.taskTable ?? false,
          taskAnalytics: entitlements.features.taskAnalytics ?? false,
        }}
      />
    </div>
  )
}
