/**
 * ✅ FASE 13.1: Dashboard de Negócios Perdidos
 *
 * /dashboard/analytics/lost-deals
 *
 * - KPIs: total perdido, valor perdido, taxa de perda
 * - Gráfico: Top 5 motivos de perda
 * - Lista: Últimos 20 negócios perdidos
 */

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LostDealsCharts } from '@/components/analytics/lost-deals-charts'
import { TrendingDown, DollarSign, AlertTriangle, Percent } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Negócios Perdidos – Analytics | Sirius CRM' }

export default async function LostDealsPage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })

  if (!user?.organizationId) redirect('/dashboard')

  const orgId = user.organizationId

  // Buscar todos os negócios perdidos
  const lostDeals = await prisma.deal.findMany({
    where: { organizationId: orgId, status: 'LOST' },
    select: {
      id: true,
      title: true,
      value: true,
      lostReason: true,
      updatedAt: true,
      contact: { select: { name: true } },
      stage: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Total de negócios (para calcular taxa)
  const totalDeals = await prisma.deal.count({ where: { organizationId: orgId } })

  // KPIs
  const totalLost = lostDeals.length
  const valueLost = lostDeals.reduce((sum, d) => sum + (d.value ? Number(d.value) : 0), 0)
  const lossRate = totalDeals > 0 ? (totalLost / totalDeals) * 100 : 0

  // Top 5 motivos de perda (agrupados)
  const reasonCounts: Record<string, number> = {}
  for (const deal of lostDeals) {
    const reason = deal.lostReason || 'Motivo não informado'
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
  }

  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name: name.length > 30 ? name.slice(0, 30) + '…' : name,
      count,
      percentage: totalLost > 0 ? Math.round((count / totalLost) * 100) : 0,
    }))

  const recentLost = lostDeals.slice(0, 20)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingDown className="h-6 w-6 text-destructive" />
          Negócios Perdidos
        </h1>
        <p className="text-muted-foreground mt-1">
          Análise de negócios perdidos e principais motivos de perda
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Total Perdido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{totalLost}</p>
            <p className="text-xs text-muted-foreground mt-1">negócios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-destructive" />
              Valor Perdido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{formatCurrency(valueLost)}</p>
            <p className="text-xs text-muted-foreground mt-1">receita não realizada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4 text-amber-500" />
              Taxa de Perda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{lossRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">dos {totalDeals} negócios totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Top 5 Motivos (Client Component) */}
      {topReasons.length > 0 && (
        <LostDealsCharts topReasons={topReasons} />
      )}

      {topReasons.length === 0 && totalLost === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingDown className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">Nenhum negócio perdido</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quando você marcar um negócio como perdido, ele aparecerá aqui
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de negócios perdidos recentes */}
      {recentLost.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Negócios Perdidos Recentemente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentLost.map(deal => (
                <div key={deal.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{deal.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {deal.contact?.name && (
                        <span className="text-xs text-muted-foreground">{deal.contact.name}</span>
                      )}
                      {deal.stage?.name && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{deal.stage.name}</span>
                      )}
                      {deal.lostReason && (
                        <span className="text-xs text-destructive/80 bg-destructive/10 px-1.5 py-0.5 rounded">
                          {deal.lostReason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {deal.value && (
                      <p className="text-sm font-medium text-destructive">
                        -{formatCurrency(Number(deal.value))}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(deal.updatedAt, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
