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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Em todas as etapas do pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Negócios</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealCount}</div>
            <p className="text-xs text-muted-foreground">
              Negócios ativos no pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio dos negócios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Negócios por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
