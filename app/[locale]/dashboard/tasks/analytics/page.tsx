import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ChevronLeft, BarChart3 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getOrganizationEntitlements } from '@/lib/feature-gates'
import { UpgradePrompt } from '@/components/upgrade/upgrade-prompt'
import { AnalyticsDashboard } from '@/components/tasks/analytics/analytics-dashboard'
import { AnalyticsProjectFilter } from '@/components/tasks/analytics/analytics-project-filter'

export const metadata: Metadata = {
  title: 'Analytics de Tarefas - CRM',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ projectId?: string }>
}

export default async function TasksAnalyticsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { projectId } = await searchParams

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

  const [entitlements, projects] = await Promise.all([
    getOrganizationEntitlements(user.organizationId),
    prisma.taskProject.findMany({
      where: { organizationId: user.organizationId, archived: false },
      select: { id: true, name: true, color: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
  ])

  const selectedProject = projects.find((p) => p.id === projectId) ?? null

  // Gate: feature bloqueada para FREE e STARTER
  if (!entitlements.features.taskAnalytics) {
    return (
      <div className="flex-1 space-y-6">
        <Link
          href={`/${locale}/dashboard/tasks`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          Voltar para tarefas
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground">
              Analytics de Tarefas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Métricas de produtividade, tendências e insights do seu time
            </p>
          </div>
        </div>

        <UpgradePrompt feature="Analytics de Tarefas" requiredTier="PRO" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6">
      <Link
        href={`/${locale}/dashboard/tasks`}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Voltar para tarefas
      </Link>

      {/* Header premium */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-card/60 to-transparent p-6 backdrop-blur-xl">
        {/* Glow decorativo */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-violet-500/5 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/20">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tighter text-foreground truncate">
                Analytics de Tarefas
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedProject
                  ? `Métricas do projeto "${selectedProject.name}"`
                  : 'Produtividade, tendências e insights do seu time'}
              </p>
            </div>
          </div>

          {/* Filtro de projeto */}
          {projects.length > 0 && (
            <Suspense fallback={null}>
              <AnalyticsProjectFilter
                projects={projects}
                currentProjectId={projectId}
              />
            </Suspense>
          )}
        </div>
      </div>

      <AnalyticsDashboard projectId={projectId} projectName={selectedProject?.name} locale={locale} />
    </div>
  )
}
