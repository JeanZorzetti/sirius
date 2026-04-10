import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, FolderKanban } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { TaskDetailContent } from '@/components/tasks/task-detail-content'

export const metadata: Metadata = {
  title: 'Detalhes da Tarefa - CRM',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ taskId: string; locale: string }>
}

export default async function TaskDetailPage({ params }: Props) {
  const { taskId } = await params

  const session = await getSession()
  if (!session?.user?.email) {
    return <div>Não autorizado.</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true, orgRole: true },
  })

  if (!user?.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, organizationId: user.organizationId },
    include: {
      status: true,
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      labels: true,
      project: {
        include: {
          statuses: { orderBy: { order: 'asc' } },
          labels: true,
        },
      },
      deal: { select: { id: true, title: true } },
      contact: { select: { id: true, name: true } },
      parent: { select: { id: true, title: true } },
      subtasks: {
        include: {
          status: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { order: 'asc' },
      },
      recurrence: true,
      _count: {
        select: {
          subtasks: true,
          comments: true,
          checklists: true,
          timeEntries: true,
        },
      },
    },
  })

  if (!task) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Link
          href="/dashboard/tasks"
          className="hover:text-foreground transition-colors"
        >
          Tarefas
        </Link>
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <Link
          href={`/dashboard/tasks/${task.projectId}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <FolderKanban className="h-3 w-3" />
          {task.project.name}
        </Link>
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <span className="text-foreground">Detalhes</span>
      </nav>

      <TaskDetailContent
        task={task as any}
        currentUserId={user.id}
        currentUserRole={user.orgRole}
      />
    </div>
  )
}
