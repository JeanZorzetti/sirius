import { Metadata } from 'next'
import { Suspense } from 'react'
import { getSEOMetrics } from '@/lib/google-search-console'
import { generateForecast, combineDataForChart } from '@/lib/seo-forecasting'
import { SEOMetricsChart } from '@/components/admin/seo-chart'
import { DateRangePicker } from '@/components/admin/date-range-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, MousePointer, Eye, TrendingUp, AlertCircle, Loader2, Sparkles, TrendingDown, Minus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SEO Command Center - Admin',
}

export const dynamic = 'force-dynamic'

interface SEOPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  )
}

async function SEOContent({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  let metrics
  let error: string | null = null

  try {
    metrics = await getSEOMetrics({
      startDate: searchParams.from,
      endDate: searchParams.to,
    })
  } catch (e) {
    console.error('Error fetching SEO metrics:', e)
    error = e instanceof Error ? e.message : 'Failed to fetch SEO data'
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            Erro de Configuracao
          </CardTitle>
        </CardHeader>
        <CardContent className="text-slate-700">
          <p className="mb-4">Nao foi possivel conectar ao Google Search Console.</p>
          <p className="text-sm text-slate-500 mb-2">Erro: {error}</p>
          <div className="text-sm text-slate-600 space-y-1">
            <p>Verifique se:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>As variaveis de ambiente estao configuradas corretamente</li>
              <li>A Service Account tem acesso ao Search Console</li>
              <li>O site foi verificado no Google Search Console</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate ML forecast
  const forecast = generateForecast(metrics.history, 30)
  const chartData = combineDataForChart(metrics.history, forecast)

  // Determine trend colors and icons
  const trendConfig = {
    Alta: {
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: TrendingUp,
      iconColor: 'text-green-600',
    },
    Baixa: {
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: TrendingDown,
      iconColor: 'text-red-600',
    },
    Estavel: {
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      icon: Minus,
      iconColor: 'text-slate-600',
    },
  }

  const clicksTrendConfig = trendConfig[forecast.trends.clicks]
  const impressionsTrendConfig = trendConfig[forecast.trends.impressions]
  const ClicksTrendIcon = clicksTrendConfig.icon
  const ImpressionsTrendIcon = impressionsTrendConfig.icon

  // Detect dangerous divergence: clicks up but impressions down
  const hasDangerousDivergence =
    forecast.trends.clicks === 'Alta' && forecast.trends.impressions === 'Baixa'

  return (
    <>
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">SEO Command Center</h1>
          <p className="text-slate-500 mt-1">
            Dados do Google Search Console
          </p>
        </div>
        <Suspense fallback={null}>
          <DateRangePicker
            currentStartDate={metrics.dateRange.startDate}
            currentEndDate={metrics.dateRange.endDate}
          />
        </Suspense>
      </div>

      {/* AI Insight Card */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg text-slate-900">Insight de IA - Previsao ML (30 dias)</CardTitle>
            </div>
            {hasDangerousDivergence && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300">
                <AlertCircle className="h-4 w-4 text-yellow-700" />
                <span className="text-xs font-medium text-yellow-800">Alerta: Visibilidade em Queda</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Trends Section */}
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            {/* Clicks Trend */}
            <div className={`p-4 rounded-lg border-2 ${clicksTrendConfig.borderColor} ${clicksTrendConfig.bgColor}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${clicksTrendConfig.bgColor}`}>
                  <ClicksTrendIcon className={`h-5 w-5 ${clicksTrendConfig.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Tendencia de Trafego (Cliques)</p>
                  <p className={`text-xl font-bold ${clicksTrendConfig.color}`}>
                    {forecast.trends.clicks} 🟢
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-medium">Previsao:</span> {forecast.predictedTotal.clicks.toLocaleString('pt-BR')} cliques</p>
                <p><span className="font-medium">Velocidade:</span> {forecast.velocity.clicks > 0 ? '+' : ''}{forecast.velocity.clicks}/dia</p>
                <p><span className="font-medium">Confianca:</span> {forecast.confidence.clicks}%</p>
              </div>
            </div>

            {/* Impressions Trend */}
            <div className={`p-4 rounded-lg border-2 ${impressionsTrendConfig.borderColor} ${impressionsTrendConfig.bgColor}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${impressionsTrendConfig.bgColor}`}>
                  <ImpressionsTrendIcon className={`h-5 w-5 ${impressionsTrendConfig.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Tendencia de Visibilidade (Impressoes)</p>
                  <p className={`text-xl font-bold ${impressionsTrendConfig.color}`}>
                    {forecast.trends.impressions} 🔵
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <p><span className="font-medium">Previsao:</span> {forecast.predictedTotal.impressions.toLocaleString('pt-BR')} imp</p>
                <p><span className="font-medium">Velocidade:</span> {forecast.velocity.impressions > 0 ? '+' : ''}{forecast.velocity.impressions}/dia</p>
                <p><span className="font-medium">Confianca:</span> {forecast.confidence.impressions}%</p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {hasDangerousDivergence && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <span className="font-bold">⚠️ Atencao:</span> O CTR esta segurando o trafego, mas a visibilidade esta caindo.
                Isso pode indicar perda futura de cliques se nao houver acao imediata no SEO.
              </p>
            </div>
          )}

          {/* Model Info */}
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-xs text-slate-600">
              <span className="font-medium">Modelo:</span> Regressao Linear
              <span className="ml-3 text-slate-500">
                (Baseado em {metrics.history.length} dias de dados)
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metrics.totals.clicks.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visitantes organicos
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Impressoes</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metrics.totals.impressions.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Aparicoes no Google
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">CTR Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {metrics.totals.ctr.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Taxa de cliques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart with Forecast */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Performance e Previsao</CardTitle>
          <CardDescription className="text-slate-500">
            Historico de cliques (linha solida) e projecao ML (linha pontilhada)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SEOMetricsChart data={chartData} showForecast={true} />
        </CardContent>
      </Card>

      {/* Tables Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Keywords */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Search className="h-5 w-5 text-green-600" />
              Top Buscas
            </CardTitle>
            <CardDescription className="text-slate-500">
              Termos que mais trazem trafego
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.keywords.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum dado disponivel</p>
              ) : (
                metrics.keywords.map((keyword, index) => (
                  <div
                    key={keyword.query}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-slate-700 truncate max-w-[180px]" title={keyword.query}>
                        {keyword.query}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600 font-medium">{keyword.clicks} cliques</span>
                      <span className="text-slate-400">{keyword.impressions.toLocaleString('pt-BR')} imp</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Programmatic Pages */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Nichos Programaticos
            </CardTitle>
            <CardDescription className="text-slate-500">
              Performance das paginas /solucoes/
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.pages.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma pagina de nicho encontrada</p>
              ) : (
                metrics.pages.map((page, index) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-slate-700 truncate max-w-[180px]" title={page.slug}>
                        {page.slug || '/'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600 font-medium">{page.clicks} cliques</span>
                      <span className="text-purple-600">{page.ctr.toFixed(1)}% CTR</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default async function SEOPage({ searchParams }: SEOPageProps) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingState />}>
        <SEOContent searchParams={params} />
      </Suspense>
    </div>
  )
}
