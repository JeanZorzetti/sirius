import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewChart } from '@/components/analytics/overview-chart';
import { DollarSign, TrendingUp, Package } from 'lucide-react';

export default async function AnalyticsPage() {
  const user = await prisma.user.findFirst({
    include: { organization: true }
  })

  if (!user || !user.organizationId) {
    return <div>Usuário não pertence a uma organização.</div>
  }

  // Fetch all deals from Prisma
  const deals = await prisma.deal.findMany({
    where: {
      organizationId: user.organizationId
    },
    include: {
      stage: true,
    },
  });

  type DealWithStage = {
    stageId: string;
    value: any; // Prisma Decimal
    stage: { name: string } | null;
  }

  // Calculate KPIs
  const totalValue = deals.reduce((sum: number, deal) => sum + (deal.value ? Number(deal.value) : 0), 0);
  const dealCount = deals.length;
  const avgTicket = dealCount > 0 ? totalValue / dealCount : 0;

  // Prepare data for bar chart: Group deals by stageId
  const stageData = deals.reduce((acc: Record<string, { name: string; count: number; value: number }>, deal) => {
    const stageId = deal.stageId;
    const stageName = deal.stage?.name || 'Unknown';

    if (!acc[stageId]) {
      acc[stageId] = {
        name: stageName,
        count: 0,
        value: 0,
      };
    }

    acc[stageId].count += 1;
    acc[stageId].value += deal.value ? Number(deal.value) : 0;

    return acc;
  }, {} as Record<string, { name: string; count: number; value: number }>);

  const chartData = Object.values(stageData);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <p className="text-muted-foreground">
        Visão geral da performance do seu pipeline de vendas
      </p>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl hover:bg-white/[0.04] transition-colors overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="h-24 w-24 text-indigo-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Valor Total</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-white font-mono">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Em todas as etapas do pipeline
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl hover:bg-white/[0.04] transition-colors overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="h-24 w-24 text-purple-500 transform -rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Negócios</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-white">{dealCount}</div>
            <p className="text-xs text-zinc-500 mt-1">
              Negócios ativos no pipeline
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-xl hover:bg-white/[0.04] transition-colors overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-24 w-24 text-emerald-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Ticket Médio</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 ring-1 ring-white/5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-white font-mono">
              {avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Valor médio dos negócios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Negócios por Etapa</CardTitle>
        </CardHeader>
        <CardContent className="pl-0">
          <OverviewChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
