import { Metadata } from 'next'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AutomationToggleForm } from './toggle-form'
import { DeleteAutomationButton } from './delete-button'
import { EmptyState } from '@/components/ui/empty-state'
import { Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Automações de Negócios | Sirius CRM'
}

export const dynamic = 'force-dynamic'

const TRIGGER_LABELS: Record<string, string> = {
  DEAL_CREATED: 'Negócio criado',
  DEAL_MOVED: 'Negócio movido',
  DEAL_WON: 'Negócio ganho',
  DEAL_LOST: 'Negócio perdido',
  DEAL_IDLE: 'Negócio parado'
}

const TRIGGER_COLORS: Record<string, string> = {
  DEAL_CREATED: 'bg-blue-100 text-blue-800',
  DEAL_MOVED: 'bg-purple-100 text-purple-800',
  DEAL_WON: 'bg-green-100 text-green-800',
  DEAL_LOST: 'bg-red-100 text-red-800',
  DEAL_IDLE: 'bg-yellow-100 text-yellow-800'
}

const THIRTY_DAYS_AGO = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d
}

export default async function AutomationsPage() {
  const session = await getSession()

  if (!session?.user) {
    return <div className="p-6">Não autorizado. Faça login novamente.</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    select: {
      organizationId: true,
      organization: {
        select: { tier: true }
      }
    }
  })

  if (!user?.organizationId) {
    return <div className="p-6">Organização não encontrada.</div>
  }

  const isPro = user.organization?.tier !== 'FREE'

  const automations = await prisma.dealAutomation.findMany({
    where: { organizationId: user.organizationId },
    include: {
      executions: {
        where: { executedAt: { gte: THIRTY_DAYS_AGO() } },
        select: { id: true, status: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automações de Negócios</h1>
          <p className="text-muted-foreground mt-1">
            Configure gatilhos automáticos para ações em seus negócios.
          </p>
        </div>
        {isPro && (
          <Button asChild>
            <Link href="/dashboard/automations/new">Nova Automação</Link>
          </Button>
        )}
      </div>

      {/* Upgrade banner for FREE tier */}
      {!isPro && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 flex items-start gap-3">
          <div>
            <p className="font-semibold text-yellow-800">Recurso PRO</p>
            <p className="text-sm text-yellow-700 mt-1">
              Automações de negócios estão disponíveis nos planos PRO e BUSINESS.
              Faça upgrade para criar automações e economizar tempo.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
            <Link href="/dashboard/billing">Fazer Upgrade</Link>
          </Button>
        </div>
      )}

      {/* Empty state */}
      {automations.length === 0 && (
        <EmptyState
          icon={Zap}
          title="Nenhuma automação configurada"
          description="Crie sua primeira automação para executar ações automáticas nos seus negócios."
          action={isPro ? (
            <Button asChild>
              <Link href="/dashboard/automations/new">Criar automação</Link>
            </Button>
          ) : undefined}
        />
      )}

      {/* Automations list */}
      {automations.length > 0 && (
        <div className="grid gap-4">
          {automations.map(automation => {
            const recentTotal = automation.executions.length
            const recentSuccess = automation.executions.filter(e => e.status === 'SUCCESS').length
            const triggerLabel = TRIGGER_LABELS[automation.triggerType] ?? automation.triggerType
            const triggerColor = TRIGGER_COLORS[automation.triggerType] ?? 'bg-gray-100 text-gray-800'

            return (
              <Card key={automation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <AutomationToggleForm
                        automationId={automation.id}
                        enabled={automation.enabled}
                      />
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{automation.name}</CardTitle>
                        {automation.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {automation.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${triggerColor}`}
                      >
                        {triggerLabel}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {automation.executionCount} execucoes no total
                      </span>
                      {recentTotal > 0 && (
                        <span>
                          {recentSuccess}/{recentTotal} sucesso (ultimos 30 dias)
                        </span>
                      )}
                      {automation.lastExecutedAt && (
                        <span>
                          Ultima vez:{' '}
                          {new Date(automation.lastExecutedAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/automations/${automation.id}/edit`}>
                          Editar
                        </Link>
                      </Button>
                      <DeleteAutomationButton automationId={automation.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// DeleteAutomationButton moved to ./delete-button.tsx (client component with confirmation dialog)
