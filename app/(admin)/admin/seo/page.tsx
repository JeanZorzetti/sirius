import { Metadata } from 'next'
import { Suspense } from 'react'
import { getSEOMetrics } from '@/lib/google-search-console'
import { SEOMetricsChart } from '@/components/admin/seo-chart'
import { DateRangePicker } from '@/components/admin/date-range-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, MousePointer, Eye, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'

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

      {/* Chart */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Performance ao Longo do Tempo</CardTitle>
          <CardDescription className="text-slate-500">
            Cliques e impressoes diarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SEOMetricsChart data={metrics.history} />
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
