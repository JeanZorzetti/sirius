import { Metadata } from 'next'
import { Suspense } from 'react'
import { getFunnelMetrics, identifyBottleneck } from '@/lib/analytics/funnel-service'
import { simulateRevenueGoal, calculateOptimizationROI } from '@/lib/analytics/revenue-simulator'
import { FunnelChart } from '@/components/admin/funnel-chart'
import { DateRangePicker } from '@/components/admin/date-range-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Users, AlertCircle, Target, Sparkles, Filter, MousePointer, Activity } from 'lucide-react'
import { RevenueSimulator } from '@/components/admin/revenue-simulator'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ultimate Funnel Command Center | Sirius Admin',
}

export const dynamic = 'force-dynamic'

interface FunnelPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  )
}

async function FunnelContent({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  let metrics
  let error: string | null = null

  try {
    metrics = await getFunnelMetrics({
      startDate: searchParams.from,
      endDate: searchParams.to,
    })
  } catch (e) {
    console.error('Error fetching Funnel metrics:', e)
    error = e instanceof Error ? e.message : 'Failed to fetch Funnel data'
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Erro ao carregar dados do funil
          </CardTitle>
        </CardHeader>
        <CardContent className="text-slate-700">
          <p className="mb-4">Nao foi possivel calcular as métricas.</p>
          <p className="text-sm text-slate-500 mb-2">Erro: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const bottleneck = identifyBottleneck(metrics)
  const defaultGoal = 5000
  const signupOptimization = calculateOptimizationROI(metrics, 'signup', 50)
  const activationOptimization = calculateOptimizationROI(metrics, 'activation', 30)

  // ML Insight logic proxy (just simple alerts based on the funnel)
  const hasConversionDrop = metrics.globalConversion < 0.5 && metrics.stages.impressions.value > 1000
  const isHealthy = metrics.globalConversion >= 1.0

  // Synthesis layout
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Funnel Command Center</h1>
          <p className="text-slate-500 mt-1">
            Integração Total: Tráfego SEO → Conversão CRM → Receita Real
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Suspense fallback={null}>
            <DateRangePicker
              currentStartDate={metrics.dateRange.startDate}
              currentEndDate={metrics.dateRange.endDate}
            />
          </Suspense>
        </div>
      </div>

      {/* AI Insight Card (SEO Synthesis) */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg text-slate-900">Insight de IA - Diagnóstico Integrado</CardTitle>
            </div>
            {hasConversionDrop && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300">
                <AlertCircle className="h-4 w-4 text-yellow-700" />
                <span className="text-xs font-medium text-yellow-800">Alerta: Fuga de Tráfego Detectada</span>
              </div>
            )}
            {isHealthy && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-300">
                <Target className="h-4 w-4 text-green-700" />
                <span className="text-xs font-medium text-green-800">Funil em Alta Performance</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <div className={`p-4 rounded-lg border-2 border-indigo-200 bg-white`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Ponto de Atrito Principal</p>
                  <p className="text-lg font-bold text-slate-900">
                    {bottleneck.stage}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Drop-off de {bottleneck.dropOffRate.toFixed(1)}%. <br/>
                <span className="font-medium text-indigo-700">Sugestão:</span> {bottleneck.recommendation}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-green-200 bg-white">
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Eficiência LTV/CAC</p>
                    <p className={`text-lg font-bold ${metrics.unitEconomics.organicCAC > 0 && metrics.unitEconomics.estimatedLTV / metrics.unitEconomics.organicCAC >= 3 ? 'text-green-600' : 'text-orange-500'}`}>
                      {metrics.unitEconomics.organicCAC > 0 ? (metrics.unitEconomics.estimatedLTV / metrics.unitEconomics.organicCAC).toFixed(1) + 'x' : 'N/A'}
                    </p>
                  </div>
               </div>
               <p className="text-sm text-slate-600 mt-2">
                 Custo de Aquisição: R$ {metrics.unitEconomics.organicCAC.toLocaleString('pt-BR')}<br/>
                 Retenção Estimada (LTV): R$ {metrics.unitEconomics.estimatedLTV.toLocaleString('pt-BR')}
               </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Universais (Analytics Synthesis) */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tráfego SEO (Topo)</CardTitle>
            <Filter className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metrics.stages.clicks.value.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-slate-500 mt-1">Cliques Orgânicos</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Conversões a Lead (Meio)</CardTitle>
            <MousePointer className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metrics.stages.signups.value.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {(metrics.stages.clicks.value > 0 ? (metrics.stages.signups.value / metrics.stages.clicks.value) * 100 : 0).toFixed(1)}% Taxa de Cadastro
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Novos Clientes (Fundo)</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metrics.stages.customers.value.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.globalConversion.toFixed(2)}% Conversão Global
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Nova Receita Recebida</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              R$ {(metrics.stages.customers.value * metrics.unitEconomics.averageTicket).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ticket Médio: R$ {metrics.unitEconomics.averageTicket.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visualização de Funil */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Fluxo da Jornada do Cliente</CardTitle>
          <CardDescription>
            Como os usuários fluem desde o tráfego gerado na busca orgânica até se tornarem clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelChart metrics={metrics} />
        </CardContent>
      </Card>

      {/* Simuladores Lado a Lado (SEO & Analytics Flow) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Previsão de Receita (Analytics Side)
            </CardTitle>
            <CardDescription>
              Simulador para visualizar métricas necessárias na conquista de metas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueSimulator currentMetrics={metrics} defaultGoal={defaultGoal} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              Retorno sobre Otimizações (SEO Side)
            </CardTitle>
            <CardDescription>
              Estimativa do incremento no faturamento (MRR) de acordo com o esforço de otimização no fluxo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h3 className="font-semibold mb-3 text-sm text-slate-800">Melhorar Cadastro (Top of Funnel) +50%</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Receita Atual:</span>
                    <span className="font-medium">R$ {signupOptimization.currentRevenue.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Receita Adicional Estimada:</span>
                    <span className="font-bold text-green-600">+R$ {signupOptimization.additionalRevenue.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <h3 className="font-semibold mb-3 text-sm text-slate-800">Melhorar Ativação (Mid Funnel) +30%</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Receita Atual:</span>
                    <span className="font-medium">R$ {activationOptimization.currentRevenue.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-t border-purple-200 pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Receita Adicional Estimada:</span>
                    <span className="font-bold text-purple-600">+R$ {activationOptimization.additionalRevenue.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default async function FunnelPage({ searchParams }: FunnelPageProps) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingState />}>
        <FunnelContent searchParams={params} />
      </Suspense>
    </div>
  )
}
