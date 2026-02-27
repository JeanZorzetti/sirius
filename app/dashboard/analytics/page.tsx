import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewChart } from '@/components/analytics/overview-chart';
import { MonthlyChart } from '@/components/analytics/monthly-chart';
import { ClientChart } from '@/components/analytics/client-chart';
import { DollarSign, TrendingUp, Target, CalendarClock } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Suspense } from 'react';
import { AnalyticsDateFilter } from './date-filter';
import { MonthlyChartFilter } from './monthly-filter';
import { ClientChartFilter } from './client-filter';
import { PipelineFilter } from './pipeline-filter';
import { ValueFilter } from './value-filter';
import { ContactFilter } from './contact-filter';

export const metadata = { title: "Analytics | Sirius CRM" }

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; mfrom?: string; mto?: string; ctop?: string; csort?: string; pid?: string; vmin?: string; vmax?: string; cid?: string }>
}) {
  const session = await getSession();
  if (!session || !session.user || !session.user.email) {
    return <div>Não autorizado. Faça login novamente.</div>;
  }

  const { from, to, mfrom, mto, ctop, csort, pid, vmin, vmax, cid } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true }
  })

  if (!user || !user.organizationId) {
    return <div>Usuário não pertence a uma organização.</div>
  }

  // Pipelines disponíveis para o filtro
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true, isDefault: true },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })

  // Pipeline filter — undefined = todas
  const pipelineFilter = pid && pid !== 'all' ? { pipelineId: pid } : {}

  // Value filter
  const valueFilter: any = {}
  if (vmin) valueFilter.gte = Number(vmin)
  if (vmax) valueFilter.lte = Number(vmax)
  const hasValueFilter = !!(vmin || vmax)

  // Contact filter
  const contactFilter = cid ? { contactId: cid } : {}

  // Contacts list for filter dropdown (only contacts with deals)
  const contactsWithDeals = await prisma.contact.findMany({
    where: {
      organizationId: user.organizationId,
      deals: { some: { organizationId: user.organizationId } },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Build closeDate filter when date params are present
  const closeDateFilter: any = {}
  if (from) closeDateFilter.gte = new Date(from)
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    closeDateFilter.lte = toDate
  }
  const isFiltered = !!(from || to)

  const deals = await prisma.deal.findMany({
    where: {
      organizationId: user.organizationId,
      ...pipelineFilter,
      ...contactFilter,
      ...(isFiltered ? { closeDate: closeDateFilter } : {}),
      ...(hasValueFilter ? { value: valueFilter } : {}),
    },
    select: {
      id: true,
      stageId: true,
      value: true,
      closeDate: true,
      stage: { select: { name: true } }
    },
  });

  const stages = await prisma.pipelineStage.findMany({
    where: {
      organizationId: user.organizationId,
      ...(pid && pid !== 'all' ? { pipelineId: pid } : {}),
    },
    orderBy: { order: 'asc' }
  });

  // KPIs
  const totalValue = deals.reduce((sum: number, deal) => sum + (deal.value ? Number(deal.value) : 0), 0);
  const dealCount = deals.length;
  const avgTicket = dealCount > 0 ? totalValue / dealCount : 0;

  // Forecast: when filtered use all deals in set; otherwise current month only
  const now = new Date();
  const forecastDeals = isFiltered
    ? deals
    : deals.filter(deal => {
        if (!deal.closeDate) return false;
        const d = new Date(deal.closeDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
  const forecastValue = forecastDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);

  // Conversion Rate
  const lastStage = stages[stages.length - 1];
  const wonStageIds = stages
    .filter(s =>
      s.name.toLowerCase().includes('ganho') ||
      s.name.toLowerCase().includes('fechado') ||
      s.name.toLowerCase().includes('won') ||
      s.name.toLowerCase().includes('vendido') ||
      s.id === lastStage?.id
    )
    .map(s => s.id);

  const wonDealsCount = deals.filter(deal => wonStageIds.includes(deal.stageId)).length;
  const conversionRate = dealCount > 0 ? (wonDealsCount / dealCount) * 100 : 0;

  // Monthly analysis — dynamic range, defaults to Jan 2025 → current month
  const mFromStr = mfrom ?? '2025-01'
  const mToStr = mto ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [mFromYear, mFromMonth] = mFromStr.split('-').map(Number)
  const [mToYear, mToMonth] = mToStr.split('-').map(Number)

  const mStartDate = new Date(mFromYear, mFromMonth - 1, 1)
  const mEndDate = new Date(mToYear, mToMonth, 0, 23, 59, 59, 999)

  const allMonthlyDeals = await prisma.deal.findMany({
    where: {
      organizationId: user.organizationId,
      ...pipelineFilter,
      ...contactFilter,
      ...(hasValueFilter ? { value: valueFilter } : {}),
      closeDate: { gte: mStartDate, lte: mEndDate },
    },
    select: { value: true, closeDate: true },
  })

  const monthSlots: { key: string; label: string; value: number; count: number }[] = []
  let sy = mFromYear, sm = mFromMonth
  while (sy < mToYear || (sy === mToYear && sm <= mToMonth)) {
    const d = new Date(sy, sm - 1, 1)
    const key = `${sy}-${String(sm).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    monthSlots.push({ key, label, value: 0, count: 0 })
    sm++
    if (sm > 12) { sm = 1; sy++ }
  }
  for (const deal of allMonthlyDeals) {
    if (!deal.closeDate) continue
    const d = new Date(deal.closeDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const slot = monthSlots.find(m => m.key === key)
    if (slot) {
      slot.value += Number(deal.value || 0)
      slot.count += 1
    }
  }
  const monthlyData = monthSlots.map(({ label, value, count }) => ({ label, value, count }))

  // Stage chart
  const stageData = deals.reduce((acc: Record<string, { name: string; count: number; value: number }>, deal) => {
    const stageId = deal.stageId;
    const stageName = deal.stage?.name || 'Unknown';
    if (!acc[stageId]) acc[stageId] = { name: stageName, count: 0, value: 0 };
    acc[stageId].count += 1;
    acc[stageId].value += deal.value ? Number(deal.value) : 0;
    return acc;
  }, {} as Record<string, { name: string; count: number; value: number }>);

  const chartData = Object.values(stageData);

  // Client chart
  const clientDeals = await prisma.deal.findMany({
    where: {
      organizationId: user.organizationId,
      ...pipelineFilter,
      ...contactFilter,
      contactId: { not: null },
      ...(isFiltered ? { closeDate: closeDateFilter } : {}),
      ...(hasValueFilter ? { value: valueFilter } : {}),
    },
    select: {
      value: true,
      contact: { select: { name: true } },
    },
  });

  const clientMap: Record<string, { name: string; value: number; count: number }> = {};
  for (const deal of clientDeals) {
    const name = deal.contact?.name ?? 'Sem nome';
    if (!clientMap[name]) clientMap[name] = { name, value: 0, count: 0 };
    clientMap[name].value += Number(deal.value || 0);
    clientMap[name].count += 1;
  }
  const clientSortKey = csort === 'count' ? 'count' : 'value'
  const clientLimit = Math.min(Math.max(Number(ctop ?? 10), 1), 20)
  const clientData = Object.values(clientMap)
    .sort((a, b) => b[clientSortKey] - a[clientSortKey])
    .slice(0, clientLimit);

  const activePipelineName = pipelines.find(p => p.id === pid)?.name

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visão geral da performance do seu pipeline de vendas
          </p>
        </div>
        <Suspense>
          <AnalyticsDateFilter />
        </Suspense>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 items-end">
        <Suspense>
          <PipelineFilter pipelines={pipelines} />
        </Suspense>
        <Suspense>
          <ValueFilter />
        </Suspense>
        <Suspense>
          <ContactFilter contacts={contactsWithDeals} />
        </Suspense>
      </div>

      {(isFiltered || activePipelineName) && (
        <p className="text-xs text-zinc-500">
          {activePipelineName && <><strong>{activePipelineName}</strong>{' — '}</>}
          {isFiltered && <>
            Filtrando por data do fechamento
            {from ? ` a partir de ${new Date(from).toLocaleDateString('pt-BR')}` : ''}
            {to ? ` até ${new Date(to).toLocaleDateString('pt-BR')}` : ''}
            {' — '}
          </>}
          <strong>{dealCount}</strong> negócio(s) encontrado(s).
        </p>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors overflow-hidden relative group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="h-24 w-24 text-indigo-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Valor Total</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {isFiltered ? 'No período selecionado' : 'Em todas as etapas do pipeline'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors overflow-hidden relative group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="h-24 w-24 text-purple-500 transform -rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Taxa de Conversão</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-zinc-500 mt-1">
              {wonDealsCount} de {dealCount} negócios fechados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors overflow-hidden relative group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CalendarClock className="h-24 w-24 text-amber-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {isFiltered ? 'Fechamentos no Período' : 'Previsão de Fechamento'}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <CalendarClock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              {forecastValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {forecastDeals.length} negócio(s) {isFiltered ? 'no período' : 'este mês'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors overflow-hidden relative group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-24 w-24 text-emerald-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Ticket Médio</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              {avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Valor médio dos negócios</p>
          </CardContent>
        </Card>
      </div>

      {/* Stage chart */}
      <Card className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Negócios por Etapa</CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <OverviewChart data={chartData} />
        </CardContent>
      </Card>

      {/* Monthly chart */}
      <Card className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Análise Mensal</CardTitle>
              <p className="text-xs text-zinc-500 mt-1">Valor e quantidade de negócios com fechamento no período</p>
            </div>
            <Suspense>
              <MonthlyChartFilter />
            </Suspense>
          </div>
        </CardHeader>
        <CardContent className="pl-0">
          <MonthlyChart data={monthlyData} />
        </CardContent>
      </Card>

      {/* Client chart */}
      <Card className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Análise por Cliente</CardTitle>
              <p className="text-xs text-zinc-500 mt-1">
                Top {clientLimit} clientes por {clientSortKey === 'count' ? 'quantidade' : 'valor'} — barras = valor (R$), linha = quantidade
              </p>
            </div>
            <Suspense>
              <ClientChartFilter />
            </Suspense>
          </div>
        </CardHeader>
        <CardContent className="pl-0">
          <ClientChart data={clientData} />
        </CardContent>
      </Card>
    </div>
  );
}
