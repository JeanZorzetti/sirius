/**
 * ✅ FASE 17: Dashboard de Campanhas — CAC Real
 *
 * /dashboard/marketing/campaigns
 *
 * - KPIs: gasto total, conversões, CAC médio, LTV/CAC ratio
 * - Gráfico: gasto e conversões por dia
 * - Tabela: top campanhas por gasto
 * - Entrada manual: form para registrar gasto sem API
 */

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CampaignROIChart } from '@/components/marketing/campaign-roi-chart'
import { ManualAdEntryForm } from '@/components/marketing/manual-ad-entry-form'
import { DollarSign, Target, TrendingDown, BarChart3, Settings, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Decimal } from '@prisma/client/runtime/library'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Campanhas & CAC | Sirius CRM' }

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function decimalToNumber(d: Decimal | null | undefined): number {
  if (d === null || d === undefined) return 0
  return parseFloat(String(d))
}

export default async function CampaignsPage() {
  const session = await getSession()
  if (!session?.user?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organizationId: true,
      organization: {
        select: {
          googleAdsCustomerId: true,
          facebookAdAccountId: true,
          adsIntegrationEnabled: true,
          adsLastSyncAt: true,
          tier: true,
        },
      },
    },
  })

  if (!user?.organizationId) redirect('/dashboard')

  const orgId = user.organizationId

  // Período: últimos 30 dias
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 30)

  // Métricas agregadas
  const metrics = await prisma.adsMetric.findMany({
    where: {
      organizationId: orgId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  })

  // KPIs totais
  const totalSpend = metrics.reduce((s, m) => s + decimalToNumber(m.spend), 0)
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0)
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0)
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0)
  const cac = totalConversions > 0 ? totalSpend / totalConversions : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0

  // LTV estimado baseado no MRR médio × 12 meses (simplificado)
  const org = user.organization
  const tierLTV: Record<string, number> = { STARTER: 97 * 12, PRO: 197 * 12, BUSINESS: 497 * 12, FREE: 0 }
  const estimatedLTV = tierLTV[org?.tier ?? 'FREE'] ?? 0
  const ltvCacRatio = cac > 0 ? estimatedLTV / cac : 0

  // Dados diários para gráfico
  const dailyMap = new Map<string, { spend: number; conversions: number }>()
  for (const m of metrics) {
    const day = m.date.toISOString().split('T')[0]
    const existing = dailyMap.get(day) ?? { spend: 0, conversions: 0 }
    dailyMap.set(day, {
      spend: existing.spend + decimalToNumber(m.spend),
      conversions: existing.conversions + m.conversions,
    })
  }
  const dailyData = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    spend: parseFloat(v.spend.toFixed(2)),
    conversions: v.conversions,
    cac: v.conversions > 0 ? parseFloat((v.spend / v.conversions).toFixed(2)) : 0,
  }))

  // Top campanhas por gasto
  const campaignMap = new Map<string, {
    campaignName: string; source: string; spend: number;
    impressions: number; clicks: number; conversions: number
  }>()
  for (const m of metrics) {
    const key = `${m.source}_${m.campaignId ?? ''}`
    const existing = campaignMap.get(key) ?? {
      campaignName: m.campaignName ?? m.source,
      source: m.source,
      spend: 0, impressions: 0, clicks: 0, conversions: 0,
    }
    campaignMap.set(key, {
      ...existing,
      spend: existing.spend + decimalToNumber(m.spend),
      impressions: existing.impressions + m.impressions,
      clicks: existing.clicks + m.clicks,
      conversions: existing.conversions + m.conversions,
    })
  }
  const campaignSummary = Array.from(campaignMap.values())
    .sort((a, b) => b.spend - a.spend)
    .map(c => ({
      ...c,
      cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
      cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
    }))

  const hasData = metrics.length > 0
  const isConnected = org?.googleAdsCustomerId || org?.facebookAdAccountId

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Campanhas & CAC
          </h1>
          <p className="text-muted-foreground mt-1">
            Custo de aquisição real por cliente — últimos 30 dias
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/settings/integrations/google-ads">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Conectar APIs
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Gasto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totalImpressions.toLocaleString('pt-BR')} impressões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConversions}</p>
            <p className="text-xs text-muted-foreground mt-1">{totalClicks.toLocaleString('pt-BR')} cliques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              CAC Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{cac > 0 ? formatCurrency(cac) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              CPC: {cpc > 0 ? formatCurrency(cpc) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              LTV / CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${ltvCacRatio >= 3 ? 'text-green-600' : ltvCacRatio > 0 ? 'text-amber-600' : ''}`}>
              {ltvCacRatio > 0 ? `${ltvCacRatio.toFixed(1)}x` : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {ltvCacRatio >= 3 ? 'Excelente' : ltvCacRatio >= 1 ? 'Aceitável' : ltvCacRatio > 0 ? 'Atenção' : 'Sem dados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert: Sem integração de API */}
      {!isConnected && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Conecte Google Ads ou Meta Ads para sincronização automática
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Enquanto isso, use o formulário abaixo para registrar gastos manualmente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos (Client Component) */}
      {hasData && (
        <CampaignROIChart dailyData={dailyData} campaignSummary={campaignSummary} />
      )}

      {/* Tabela de campanhas */}
      {campaignSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes por Campanha</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Campanha</th>
                  <th className="text-left pb-2 font-medium">Fonte</th>
                  <th className="text-right pb-2 font-medium">Gasto</th>
                  <th className="text-right pb-2 font-medium">Cliques</th>
                  <th className="text-right pb-2 font-medium">Conversões</th>
                  <th className="text-right pb-2 font-medium">CAC</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaignSummary.map((c, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium">{c.campaignName}</td>
                    <td className="py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        c.source === 'google_ads' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        c.source === 'facebook_ads' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {c.source === 'google_ads' ? 'Google' : c.source === 'facebook_ads' ? 'Meta' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-2 text-right">{formatCurrency(c.spend)}</td>
                    <td className="py-2 text-right">{c.clicks.toLocaleString('pt-BR')}</td>
                    <td className="py-2 text-right">{c.conversions}</td>
                    <td className="py-2 text-right font-medium">{c.cpa > 0 ? formatCurrency(c.cpa) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Formulário de entrada manual */}
      <ManualAdEntryForm />

      {/* Empty state */}
      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">Nenhum dado de campanha ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Conecte Google Ads / Meta Ads ou use o formulário acima para registrar gastos manualmente
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Link href="/dashboard/settings/integrations/google-ads">
                <Button variant="outline" size="sm">Conectar Google Ads</Button>
              </Link>
              <Link href="/dashboard/settings/integrations/facebook-ads">
                <Button variant="outline" size="sm">Conectar Meta Ads</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
