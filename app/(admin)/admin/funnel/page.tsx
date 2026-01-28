import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { getFunnelMetrics, identifyBottleneck } from '@/lib/analytics/funnel-service'
import { simulateRevenueGoal, calculateOptimizationROI } from '@/lib/analytics/revenue-simulator'
import { FunnelChart } from '@/components/admin/funnel-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Users, AlertCircle, Target, Zap } from 'lucide-react'
import { RevenueSimulator } from '@/components/admin/revenue-simulator'

export const metadata: Metadata = {
  title: 'Ultimate Sales Funnel | Sirius Admin',
  description: 'Análise completa do funil de conversão: Google → Pagamento',
}

// Cache por 1 hora (evita estourar quota do GSC)
const getCachedFunnelMetrics = unstable_cache(
  async () => {
    return await getFunnelMetrics()
  },
  ['funnel-metrics'],
  {
    revalidate: 3600, // 1 hora
  }
)

export default async function FunnelPage() {
  const metrics = await getCachedFunnelMetrics()
  const bottleneck = identifyBottleneck(metrics)

  // Simular meta de R$ 5.000/mês
  const defaultGoal = 5000
  const simulation = simulateRevenueGoal(metrics, defaultGoal)

  // Calcular ROI de otimizações
  const signupOptimization = calculateOptimizationROI(metrics, 'signup', 50)
  const activationOptimization = calculateOptimizationROI(metrics, 'activation', 30)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Ultimate Sales Funnel</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Rastreamento completo: Impressão no Google até Pagamento
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Período: {new Date(metrics.dateRange.startDate).toLocaleDateString('pt-BR')} até{' '}
          {new Date(metrics.dateRange.endDate).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* KPIs de Unit Economics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CAC Orgânico</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.unitEconomics.organicCAC.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Custo para adquirir 1 cliente via SEO
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
              R$ {metrics.unitEconomics.averageTicket.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita mensal por cliente PRO
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV Estimado</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.unitEconomics.estimatedLTV.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime Value (12 meses de retenção)
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
              LTV / CAC:{' '}
              {(metrics.unitEconomics.estimatedLTV / metrics.unitEconomics.organicCAC).toFixed(
                1
              )}
              x
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gargalo do Funil (Alert) */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertCircle className="h-5 w-5" />
            Gargalo Identificado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium mb-2">
            {bottleneck.stage} - {bottleneck.dropOffRate.toFixed(1)}% de perda
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Recomendação:</strong> {bottleneck.recommendation}
          </p>
        </CardContent>
      </Card>

      {/* Visualização do Funil */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão Completo</CardTitle>
          <CardDescription>
            Cada etapa mostra conversão e drop-off em relação à anterior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelChart metrics={metrics} />
        </CardContent>
      </Card>

      {/* Simulador de Metas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Simulador de Metas
          </CardTitle>
          <CardDescription>
            Calcule quanto tráfego precisa para atingir uma meta de faturamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueSimulator currentMetrics={metrics} defaultGoal={defaultGoal} />
        </CardContent>
      </Card>

      {/* ROI de Otimizações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            ROI de Otimizações
          </CardTitle>
          <CardDescription>
            Impacto estimado de melhorar cada etapa do funil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h3 className="font-semibold mb-3">Melhorar Cadastro +50%</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Receita Atual:</span>
                  <span className="font-medium">
                    R$ {signupOptimization.currentRevenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Receita Projetada:</span>
                  <span className="font-medium">
                    R$ {signupOptimization.projectedRevenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Receita Adicional:</span>
                  <span className="font-bold text-green-600">
                    +R$ {signupOptimization.additionalRevenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ROI:</span>
                  <span className="font-bold text-blue-600">
                    {signupOptimization.roi.toLocaleString('pt-BR')}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <h3 className="font-semibold mb-3">Melhorar Ativação +30%</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Receita Atual:</span>
                  <span className="font-medium">
                    R$ {activationOptimization.currentRevenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Receita Projetada:</span>
                  <span className="font-medium">
                    R$ {activationOptimization.projectedRevenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Receita Adicional:</span>
                  <span className="font-bold text-green-600">
                    +R$ {activationOptimization.additionalRevenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ROI:</span>
                  <span className="font-bold text-purple-600">
                    {activationOptimization.roi.toLocaleString('pt-BR')}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
