import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewChart } from '@/components/analytics/overview-chart';
import { MonthlyChart } from '@/components/analytics/monthly-chart';
import { ClientChart } from '@/components/analytics/client-chart';
import { LazyOnVisible } from '@/components/ui/lazy-on-visible';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Target, CalendarClock, Banknote, Activity } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Suspense } from 'react';
import { AnalyticsDateFilter } from './date-filter';
import { MonthlyChartFilter } from './monthly-filter';
import { ClientChartFilter } from './client-filter';
import { PipelineFilter } from './pipeline-filter';
import { ValueSearch } from './value-search';
import { ContactSearch } from './contact-search';
import { StageChartFilter } from './stage-chart-filter';
import { getTranslations } from 'next-intl/server';

export const metadata = { title: "Analytics | Sirius CRM" }

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ from?: string; to?: string; mfrom?: string; mto?: string; ctop?: string; csort?: string; pid?: string; vsearch?: string; csearch?: string; sfrom?: string; sto?: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const session = await getSession();
  if (!session || !session.user || !session.user.email) {
    return <div>{t('errors.unauthorized')}</div>;
  }

  const { from, to, mfrom, mto, ctop, csort, pid, vsearch, csearch, sfrom, sto } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true }
  })

  if (!user || !user.organizationId) {
    return <div>{t('errors.userNoOrg')}</div>
  }

  // Pipelines disponíveis para o filtro
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true, isDefault: true },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  })

  // Pipeline filter — multi-select (comma-separated IDs)
  // Default: Pipeline Principal (isDefault: true) when nothing is selected
  const defaultPipeline = pipelines.find(p => p.isDefault) ?? pipelines[0]
  const selectedPids = pid ? pid.split(',').filter(Boolean) : (defaultPipeline ? [defaultPipeline.id] : [])
  const pipelineFilter = selectedPids.length > 0 ? { pipelineId: { in: selectedPids } } : {}

  // Exact value search
  const valueSearchFilter = vsearch ? { value: { equals: Number(vsearch) } as any } : {}

  // Contact name search — resolve matching contact IDs first
  let contactSearchFilter: any = {}
  if (csearch) {
    const matchedContacts = await prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        name: { contains: csearch, mode: 'insensitive' },
      },
      select: { id: true },
    })
    contactSearchFilter = { contactId: { in: matchedContacts.map(c => c.id) } }
  }

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
      archived: false,
      ...pipelineFilter,
      ...valueSearchFilter,
      ...contactSearchFilter,
      ...(isFiltered ? { closeDate: closeDateFilter } : {}),
    },
    select: {
      id: true,
      stageId: true,
      value: true,
      closeDate: true,
      status: true,
      stage: { select: { name: true } },
      contact: { select: { name: true } },
    },
  });

  const now = new Date();

  // KPIs segmentados por status
  const activeDeals = deals.filter(d => d.status === 'ACTIVE');
  const wonDeals = deals.filter(d => d.status === 'WON');
  const lostDeals = deals.filter(d => d.status === 'LOST');

  const pipelineValue = activeDeals.reduce((s, d) => s + Number(d.value || 0), 0);

  // Conversão: contagem deals WON / (deals WON + deals LOST)
  const closedDealsCount = wonDeals.length + lostDeals.length;
  const conversionRate = closedDealsCount > 0 ? (wonDeals.length / closedDealsCount) * 100 : 0;

  // Previsão de fechamento: apenas deals ACTIVE com closeDate futuro
  const forecastDeals = isFiltered
    ? activeDeals
    : activeDeals.filter(d => {
        if (!d.closeDate) return false;
        const closeD = new Date(d.closeDate);
        return closeD >= now && closeD.getMonth() === now.getMonth() && closeD.getFullYear() === now.getFullYear();
      });
  const forecastValue = forecastDeals.reduce((s, d) => s + Number(d.value || 0), 0);

  // Ticket Médio: média dos valores reais recebidos (DealClosing) — calculado após kpiClosings

  const dealCount = deals.length;

  // Monthly analysis — dynamic range.
  // When a date filter is active, propagate from/to as default for the chart range.
  const defaultMFrom = from ? from.slice(0, 7) : '2025-01'
  const defaultMTo = to
    ? to.slice(0, 7)
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const mFromStr = mfrom ?? defaultMFrom
  const mToStr = mto ?? defaultMTo
  const [mFromYear, mFromMonth] = mFromStr.split('-').map(Number)
  const [mToYear, mToMonth] = mToStr.split('-').map(Number)

  const mStartDate = new Date(mFromYear, mFromMonth - 1, 1)
  const mEndDate = new Date(mToYear, mToMonth, 0, 23, 59, 59, 999)

  const allMonthlyDeals = await prisma.deal.findMany({
    where: {
      organizationId: user.organizationId,
      ...pipelineFilter,
      ...valueSearchFilter,
      ...contactSearchFilter,
      closeDate: { gte: mStartDate, lte: mEndDate },
    },
    select: { value: true, closeDate: true },
  })

  // DealClosing — receita real efetivada
  const allClosings = await prisma.dealClosing.findMany({
    where: {
      deal: {
        organizationId: user.organizationId,
        ...(selectedPids.length > 0 ? { pipelineId: { in: selectedPids } } : {}),
      },
      date: { gte: mStartDate, lte: mEndDate },
    },
    select: { value: true, date: true },
  })

  // KPI: total realizado (respeitando o mesmo filtro de data da tabela principal)
  const kpiClosings = await prisma.dealClosing.findMany({
    where: {
      deal: {
        organizationId: user.organizationId,
        ...(selectedPids.length > 0 ? { pipelineId: { in: selectedPids } } : {}),
      },
      ...(isFiltered ? { date: closeDateFilter } : {}),
    },
    select: { value: true },
  })
  const totalRealized = kpiClosings.reduce((s, c) => s + Number(c.value), 0)
  const avgTicket = kpiClosings.length > 0 ? totalRealized / kpiClosings.length : 0
  const ticketLabel = kpiClosings.length > 0 ? `Média de ${kpiClosings.length} recebimento(s)` : 'Nenhum recebimento registrado'

  const monthSlots: { key: string; label: string; value: number; count: number; closingsValue: number }[] = []
  let sy = mFromYear, sm = mFromMonth
  while (sy < mToYear || (sy === mToYear && sm <= mToMonth)) {
    const d = new Date(sy, sm - 1, 1)
    const key = `${sy}-${String(sm).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    monthSlots.push({ key, label, value: 0, count: 0, closingsValue: 0 })
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
  for (const closing of allClosings) {
    const d = new Date(closing.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const slot = monthSlots.find(m => m.key === key)
    if (slot) slot.closingsValue += Number(closing.value)
  }

  const monthlyData = monthSlots.map(({ label, value, count, closingsValue }) => ({ label, value, count, closingsValue }))

  // Stage chart — filtro de data próprio (sfrom/sto) por createdAt
  const stageCreatedFilter: any = {}
  if (sfrom) stageCreatedFilter.gte = new Date(sfrom)
  if (sto) {
    const stoDate = new Date(sto)
    stoDate.setHours(23, 59, 59, 999)
    stageCreatedFilter.lte = stoDate
  }
  const stageDeals = (sfrom || sto)
    ? await prisma.deal.findMany({
        where: {
          organizationId: user.organizationId,
          archived: false,
          ...pipelineFilter,
          createdAt: stageCreatedFilter,
        },
        select: {
          stageId: true,
          value: true,
          stage: { select: { name: true } },
          contact: { select: { name: true } },
        },
      })
    : deals

  const stageData = stageDeals.reduce((acc: Record<string, { name: string; count: number; value: number; clients: string[] }>, deal) => {
    const stageId = deal.stageId;
    const stageName = deal.stage?.name || 'Unknown';
    if (!acc[stageId]) acc[stageId] = { name: stageName, count: 0, value: 0, clients: [] };
    acc[stageId].count += 1;
    acc[stageId].value += deal.value ? Number(deal.value) : 0;
    if (deal.contact?.name) acc[stageId].clients.push(deal.contact.name);
    return acc;
  }, {} as Record<string, { name: string; count: number; value: number; clients: string[] }>);

  const chartData = Object.values(stageData);

  // Client chart — grouped by contactId to avoid merging contacts with same name
  const clientDeals = await prisma.deal.findMany({
    where: {
      organizationId: user.organizationId,
      archived: false,
      status: 'WON',
      ...pipelineFilter,
      ...valueSearchFilter,
      ...contactSearchFilter,
      contactId: { not: null },
      ...(isFiltered ? { closeDate: closeDateFilter } : {}),
    },
    select: {
      contactId: true,
      value: true,
      contact: { select: { name: true, company: true } },
    },
  });

  const clientMap: Record<string, { id: string; name: string; value: number; count: number; company?: string }> = {};
  for (const deal of clientDeals) {
    const id = deal.contactId!;
    if (!clientMap[id]) {
      clientMap[id] = { id, name: deal.contact?.name ?? 'Sem nome', value: 0, count: 0, company: deal.contact?.company ?? undefined };
    }
    clientMap[id].value += Number(deal.value || 0);
    clientMap[id].count += 1;
  }
  const clientSortKey = csort === 'count' ? 'count' : 'value'
  const clientLimit = Math.min(Math.max(Number(ctop ?? 10), 1), 20)
  const clientData = Object.values(clientMap)
    .sort((a, b) => b[clientSortKey] - a[clientSortKey])
    .slice(0, clientLimit);

  const activePipelineNames = pipelines.filter(p => selectedPids.includes(p.id)).map(p => p.name)

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

      {/* Filters + Search row */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 items-end">
        <Suspense>
          <PipelineFilter pipelines={pipelines} defaultId={defaultPipeline?.id} />
        </Suspense>
        <Suspense>
          <ValueSearch />
        </Suspense>
        <Suspense>
          <ContactSearch />
        </Suspense>
      </div>

      {(isFiltered || activePipelineNames.length > 0) && (
        <p className="text-xs text-zinc-500">
          {activePipelineNames.length > 0 && <><strong>{activePipelineNames.join(', ')}</strong>{' — '}</>}
          {isFiltered && <>
            Filtrando por data do fechamento
            {from ? ` a partir de ${new Date(from).toLocaleDateString('pt-BR')}` : ''}
            {to ? ` até ${new Date(to).toLocaleDateString('pt-BR')}` : ''}
            {' — '}
          </>}
          <strong>{dealCount}</strong> negócio(s) não arquivado(s).
        </p>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Valor Estimado */}
        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors overflow-hidden relative group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-24 w-24 text-indigo-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Valor Estimado</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              {pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1" title="Soma do valor estimado dos negócios ativos (Deal.value)">
              {activeDeals.length} negócio(s) em andamento
            </p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
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
            <p className="text-xs text-zinc-500 mt-1" title="Ganhos / (Ganhos + Perdidos) — exclui negócios ainda ativos">
              {wonDeals.length} ganhos de {closedDealsCount} fechados
            </p>
          </CardContent>
        </Card>

        {/* Previsão de Fechamento */}
        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors overflow-hidden relative group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CalendarClock className="h-24 w-24 text-amber-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {isFiltered ? 'Previsão no Período' : 'Previsão este Mês'}
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <CalendarClock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              {forecastValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1" title="Negócios ATIVOS com data de fechamento no período selecionado">
              {forecastDeals.length} negócio(s) {isFiltered ? 'no período' : 'este mês'}
            </p>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
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
            <p className="text-xs text-zinc-500 mt-1" title="Ticket médio calculado sobre negócios com valor definido">{ticketLabel}</p>
          </CardContent>
        </Card>

        {/* Receita Realizada */}
        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors overflow-hidden relative group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Banknote className="h-24 w-24 text-teal-500 transform -rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Receita Realizada</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
              <Banknote className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              {totalRealized.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1" title="Valor real recebido, registrado nos Fechamentos (DealClosing.value) — data do recebimento">
              {isFiltered ? 'Recebido no período' : 'Total recebido registrado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stage chart */}
      <Card className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">Negócios por Etapa</CardTitle>
              <p className="text-xs text-zinc-500 mt-1">
                {(sfrom || sto)
                  ? `Negócios criados${sfrom ? ` a partir de ${new Date(sfrom).toLocaleDateString('pt-BR')}` : ''}${sto ? ` até ${new Date(sto).toLocaleDateString('pt-BR')}` : ''}`
                  : 'Todos os negócios não arquivados'}
              </p>
            </div>
            <Suspense>
              <StageChartFilter />
            </Suspense>
          </div>
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
          <LazyOnVisible
            fallback={<Skeleton className="h-[300px] w-full rounded-md" />}
          >
            <MonthlyChart data={monthlyData} />
          </LazyOnVisible>
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
          <LazyOnVisible
            fallback={<Skeleton className="h-[300px] w-full rounded-md" />}
          >
            <ClientChart data={clientData} />
          </LazyOnVisible>
        </CardContent>
      </Card>
    </div>
  );
}
