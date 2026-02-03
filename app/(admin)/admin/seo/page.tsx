import { Metadata } from 'next'
import { Suspense } from 'react'
import {
  getSEOMetrics,
  getSEOByCountry,
  getSEOByDevice,
  getSearchAppearances,
  getKeywordOpportunities,
} from '@/lib/google-search-console'
import { generateForecast, combineDataForChart } from '@/lib/seo-forecasting'
import { getCrUXMetricsBoth } from '@/lib/crux-report'
import { getPageSpeedMetricsBatch } from '@/lib/pagespeed-insights'
import { compareKeywords, getRelatedQueries, getTrendingSearches } from '@/lib/google-trends'
import {
  inspectURLsBatch,
  extractErrors,
  generateCoverageSummary,
  type URLInspectionResult,
  type InspectionError,
  type CoverageSummary,
} from '@/lib/url-inspection'
import { SEOMetricsChart } from '@/components/admin/seo-chart'
import { DateRangePicker } from '@/components/admin/date-range-picker'
import { SeoAssistant } from '@/components/admin/seo-assistant'
import { SEODeviceBreakdown } from '@/components/admin/seo-device-breakdown'
import { SEOCountryTable } from '@/components/admin/seo-country-table'
import { SEOSearchAppearances } from '@/components/admin/seo-appearances'
import { SEOKeywordOpportunities } from '@/components/admin/seo-opportunities'
import { SEOWebVitals } from '@/components/admin/seo-web-vitals'
import { SEOCriticalPages } from '@/components/admin/seo-critical-pages'
import { SEOTrendsChart } from '@/components/admin/seo-trends-chart'
import { SEOTrendingKeywords } from '@/components/admin/seo-trending-keywords'
import { SEOCoverageDashboard } from '@/components/admin/seo-coverage-dashboard'
import { SEOIndexationErrors } from '@/components/admin/seo-indexation-errors'
import { SEOAnomalyAlerts } from '@/components/admin/seo-anomaly-alerts'
import {
  detectAnomalies,
  historyToTimeSeries,
  type DetectAnomaliesResponse,
} from '@/lib/ml/anomaly-detection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, MousePointer, Eye, TrendingUp, AlertCircle, Loader2, Sparkles, TrendingDown, Minus, Target } from 'lucide-react'

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
  let countries
  let devices
  let appearances
  let opportunities
  let cruxData
  let pageSpeedPages
  let trendsData
  let relatedQueriesData
  let trendingSearches
  let inspectionResults: URLInspectionResult[] = []
  let inspectionErrors: InspectionError[] = []
  let coverageSummary: CoverageSummary | null = null
  let anomalyResults: DetectAnomaliesResponse | null = null
  let error: string | null = null

  try {
    // Get site URL for Core Web Vitals
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://sirius.roilabs.com.br/'

    // Keywords to track in Google Trends (customize based on your niche)
    const trackingKeywords = ['crm', 'crm online', 'automação de vendas']

    // Fetch all metrics in parallel
    ;[metrics, countries, devices, appearances, opportunities, cruxData, pageSpeedPages, trendsData, relatedQueriesData, trendingSearches] = await Promise.all([
      getSEOMetrics({
        startDate: searchParams.from,
        endDate: searchParams.to,
      }),
      getSEOByCountry({
        startDate: searchParams.from,
        endDate: searchParams.to,
      }),
      getSEOByDevice({
        startDate: searchParams.from,
        endDate: searchParams.to,
      }),
      getSearchAppearances({
        startDate: searchParams.from,
        endDate: searchParams.to,
      }),
      getKeywordOpportunities({
        startDate: searchParams.from,
        endDate: searchParams.to,
      }),
      // Core Web Vitals: CrUX data (real users)
      getCrUXMetricsBoth(siteUrl),
      // PageSpeed Insights: Analyze top pages
      getSEOMetrics({
        startDate: searchParams.from,
        endDate: searchParams.to,
      }).then(async (metricsData) => {
        // Get top 5 pages by clicks
        const topPages = metricsData.pages.slice(0, 5).map(p => p.page)
        return getPageSpeedMetricsBatch(topPages, 'mobile')
      }),
      // Google Trends: Interest over time
      compareKeywords(trackingKeywords, { geo: 'BR', timeRange: 'today 12-m' }),
      // Google Trends: Related queries
      Promise.all(trackingKeywords.map(kw => getRelatedQueries(kw, { geo: 'BR' }))),
      // Google Trends: Trending searches
      getTrendingSearches('BR'),
    ])

    // URL Inspection: Inspect top 10 pages (after getting metrics)
    // This is done separately due to rate limiting concerns
    if (metrics && metrics.pages.length > 0) {
      try {
        const topPages = metrics.pages.slice(0, 10).map(p => {
          // Ensure full URL
          const pageUrl = p.page.startsWith('http') ? p.page : `${siteUrl}${p.page}`
          return pageUrl
        })

        // Inspect URLs with 2 second delay between each (rate limiting)
        inspectionResults = await inspectURLsBatch(topPages, 2000)

        // Extract errors and generate summary
        if (inspectionResults.length > 0) {
          inspectionErrors = extractErrors(inspectionResults)
          coverageSummary = generateCoverageSummary(inspectionResults)
        }
      } catch (inspectionError) {
        console.error('Error inspecting URLs:', inspectionError)
        // Don't fail the whole page if URL inspection fails
      }
    }

    // Anomaly Detection: Detect anomalies in clicks using ML
    // This is done separately to not block the page if ML API is unavailable
    if (metrics && metrics.history.length > 0) {
      try {
        const clicksData = historyToTimeSeries(metrics.history, 'clicks')

        anomalyResults = await detectAnomalies({
          data: clicksData,
          metric_type: 'clicks',
          window_size: 14,
          z_threshold: 3.0,
          method: 'combined',
        })
      } catch (anomalyError) {
        console.error('Error detecting anomalies:', anomalyError)
        // Gracefully degrade if ML API is not available
      }
    }
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
      {/* Header with Date Picker and AI Assistant */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">SEO Command Center</h1>
          <p className="text-slate-500 mt-1">
            Dados do Google Search Console
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Suspense fallback={null}>
            <DateRangePicker
              currentStartDate={metrics.dateRange.startDate}
              currentEndDate={metrics.dateRange.endDate}
            />
          </Suspense>
          <SeoAssistant metrics={metrics} forecast={forecast} />
        </div>
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
                <p><span className="font-medium">ML Direta:</span> {forecast.predictedTotal.clicks.toLocaleString('pt-BR')} cliques</p>
                <p><span className="font-medium">Via Eficiencia:</span> <span className="text-amber-600 font-semibold">{forecast.predictedTotal.clicksFromEfficiency.toLocaleString('pt-BR')}</span> cliques</p>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Card className={`border-2 shadow-sm ${
          forecast.efficiency.trend === 'Melhorando'
            ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
            : forecast.efficiency.trend === 'Piorando'
            ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50'
            : 'border-slate-200 bg-white'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Custo de Visibilidade</CardTitle>
            <Target className={`h-4 w-4 ${
              forecast.efficiency.trend === 'Melhorando'
                ? 'text-green-600'
                : forecast.efficiency.trend === 'Piorando'
                ? 'text-red-600'
                : 'text-slate-600'
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              forecast.efficiency.trend === 'Melhorando'
                ? 'text-green-700'
                : forecast.efficiency.trend === 'Piorando'
                ? 'text-red-700'
                : 'text-slate-900'
            }`}>
              {forecast.efficiency.currentRatio}
            </div>
            <p className={`text-xs mt-1 font-medium ${
              forecast.efficiency.trend === 'Melhorando'
                ? 'text-green-600'
                : forecast.efficiency.trend === 'Piorando'
                ? 'text-red-600'
                : 'text-slate-500'
            }`}>
              {forecast.efficiency.trend === 'Melhorando' && (
                <>▼ Eficiencia aumentando (CTR subindo)</>
              )}
              {forecast.efficiency.trend === 'Piorando' && (
                <>▲ Alerta: Snippets menos atrativos</>
              )}
              {forecast.efficiency.trend === 'Estavel' && (
                <>Impressoes p/ 1 clique (estavel)</>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Prev. 30d: {forecast.efficiency.forecastNext30d}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart with Forecast */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Performance e Previsao Dupla</CardTitle>
          <CardDescription className="text-slate-500">
            Historico (solida), ML Direta (cinza pontilhada) e ML via Eficiencia (laranja pontilhada)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SEOMetricsChart data={chartData} showForecast={true} />
        </CardContent>
      </Card>

      {/* Anomaly Detection Alerts (ML) */}
      <SEOAnomalyAlerts results={anomalyResults} />

      {/* Device Breakdown */}
      {devices && devices.length > 0 && (
        <SEODeviceBreakdown devices={devices} />
      )}

      {/* Country Breakdown */}
      {countries && countries.length > 0 && (
        <SEOCountryTable countries={countries} />
      )}

      {/* Search Appearances */}
      {appearances && (
        <SEOSearchAppearances appearances={appearances} />
      )}

      {/* Keyword Opportunities */}
      {opportunities && (
        <SEOKeywordOpportunities opportunities={opportunities} />
      )}

      {/* Core Web Vitals */}
      {cruxData && (
        <SEOWebVitals
          mobile={cruxData.mobile}
          desktop={cruxData.desktop}
        />
      )}

      {/* Critical Pages */}
      {pageSpeedPages && pageSpeedPages.length > 0 && (
        <SEOCriticalPages pages={pageSpeedPages} />
      )}

      {/* URL Inspection: Coverage Dashboard */}
      <SEOCoverageDashboard summary={coverageSummary} />

      {/* URL Inspection: Indexation Errors */}
      {inspectionErrors.length > 0 && (
        <SEOIndexationErrors errors={inspectionErrors} />
      )}

      {/* Google Trends Chart */}
      {trendsData && trendsData.length > 0 && (
        <SEOTrendsChart trendsData={trendsData} />
      )}

      {/* Trending Keywords & Related Queries */}
      {relatedQueriesData && relatedQueriesData.length > 0 && (
        <SEOTrendingKeywords
          relatedQueries={relatedQueriesData.filter((r): r is import('@/lib/google-trends').RelatedQueriesData => !('error' in r))}
          trendingSearches={trendingSearches && 'error' in trendingSearches ? null : trendingSearches}
        />
      )}

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
