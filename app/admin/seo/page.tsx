import { Metadata } from 'next'
import { getSEOMetrics } from '@/lib/google-search-console'
import { SEOMetricsChart } from '@/components/admin/seo-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, MousePointer, Eye, TrendingUp, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SEO Command Center - Admin',
}

export const dynamic = 'force-dynamic'

export default async function SEOPage() {
  let metrics
  let error: string | null = null

  try {
    metrics = await getSEOMetrics(30)
  } catch (e) {
    console.error('Error fetching SEO metrics:', e)
    error = e instanceof Error ? e.message : 'Failed to fetch SEO data'
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SEO Command Center</h1>
          <p className="text-zinc-400 mt-2">Google Search Console Integration</p>
        </div>

        <Card className="border-red-900/50 bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              Erro de Configuracao
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-300">
            <p className="mb-4">Nao foi possivel conectar ao Google Search Console.</p>
            <p className="text-sm text-zinc-500 mb-2">Erro: {error}</p>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>Verifique se:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>As variaveis de ambiente estao configuradas corretamente</li>
                <li>A Service Account tem acesso ao Search Console</li>
                <li>O site foi verificado no Google Search Console</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">SEO Command Center</h1>
        <p className="text-zinc-400 mt-2">
          Dados dos ultimos 30 dias do Google Search Console
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.totals.clicks.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Visitantes organicos
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total de Impressoes</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.totals.impressions.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Aparicoes no Google
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">CTR Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.totals.ctr.toFixed(2)}%
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Taxa de cliques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-white">Performance ao Longo do Tempo</CardTitle>
          <CardDescription className="text-zinc-400">
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
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Search className="h-5 w-5 text-green-500" />
              Top Buscas
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Termos que mais trazem trafego
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.keywords.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhum dado disponivel</p>
              ) : (
                metrics.keywords.map((keyword, index) => (
                  <div
                    key={keyword.query}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-500 w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-white truncate max-w-[180px]" title={keyword.query}>
                        {keyword.query}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-400">{keyword.clicks} cliques</span>
                      <span className="text-zinc-500">{keyword.impressions.toLocaleString('pt-BR')} imp</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Programmatic Pages */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Nichos Programaticos
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Performance das paginas /solucoes/
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.pages.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhuma pagina de nicho encontrada</p>
              ) : (
                metrics.pages.map((page, index) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-zinc-500 w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-white truncate max-w-[180px]" title={page.slug}>
                        {page.slug || '/'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-400">{page.clicks} cliques</span>
                      <span className="text-purple-400">{page.ctr.toFixed(1)}% CTR</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
