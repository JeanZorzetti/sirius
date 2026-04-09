import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Settings } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { ProjectSettingsForm } from '@/components/tasks/project-settings-form'

export const metadata: Metadata = {
  title: 'Configurações do Projeto - CRM',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ projectId: string; locale: string }>
}

export default async function ProjectSettingsPage({ params }: Props) {
  const { projectId } = await params

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

  const project = await prisma.taskProject.findFirst({
    where: { id: projectId, organizationId: user.organizationId },
    include: {
      statuses: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { tasks: true } } },
      },
      labels: { orderBy: { name: 'asc' } },
    },
  })

  if (!project) {
    notFound()
  }

  const canEdit = user.orgRole === 'OWNER'

  return (
    <div className="flex-1 space-y-6">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/tasks/${project.id}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Voltar ao projeto
      </Link>

      {/* Header */}
      <div className="flex items-end gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/40">
          <Settings className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground">
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            {project.name} · Statuses e etiquetas
          </p>
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
          Apenas owners da organização podem editar configurações do projeto.
        </div>
      )}

      <ProjectSettingsForm
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          color: project.color,
          icon: project.icon,
        }}
        statuses={project.statuses as any}
        labels={project.labels}
        canEdit={canEdit}
      />
    </div>
  )
}
