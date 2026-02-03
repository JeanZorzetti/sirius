'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ExternalLink, Zap, TrendingDown, AlertCircle } from 'lucide-react'
import type { PageSpeedMetrics } from '@/lib/pagespeed-insights'

interface SEOCriticalPagesProps {
  pages: (PageSpeedMetrics | { error: string })[]
}

function getScoreCategory(score: number): {
  label: string
  color: string
  bgColor: string
  borderColor: string
} {
  if (score >= 90) {
    return {
      label: 'Bom',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    }
  }
  if (score >= 50) {
    return {
      label: 'Precisa Melhorar',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    }
  }
  return {
    label: 'Ruim',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  }
}

function getMetricStatusColor(value: number, metric: 'lcp' | 'cls' | 'fcp'): string {
  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    cls: { good: 0.1, poor: 0.25 },
    fcp: { good: 1800, poor: 3000 },
  }

  const { good, poor } = thresholds[metric]

  if (value <= good) return 'text-green-600'
  if (value <= poor) return 'text-yellow-600'
  return 'text-red-600'
}

function formatMetricValue(value: number, metric: 'lcp' | 'cls' | 'fcp'): string {
  if (metric === 'cls') {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

function getUrlShortName(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    if (path === '/' || path === '') return 'Homepage'
    return path
  } catch {
    return url
  }
}

export function SEOCriticalPages({ pages }: SEOCriticalPagesProps) {
  // Filtrar apenas páginas com sucesso e ordenar por performance score (pior primeiro)
  const validPages = pages
    .filter((page): page is PageSpeedMetrics => !('error' in page))
    .sort((a, b) => a.performanceScore - b.performanceScore)

  if (validPages.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Páginas Críticas
          </CardTitle>
          <CardDescription className="text-slate-500">
            Páginas que precisam de otimização urgente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Zap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">Nenhuma página analisada</p>
            <p className="text-sm text-slate-500">
              Configure a análise de páginas para ver quais precisam de otimização
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Identificar páginas críticas (score < 50)
  const criticalPages = validPages.filter((p) => p.performanceScore < 50)
  const needsImprovementPages = validPages.filter(
    (p) => p.performanceScore >= 50 && p.performanceScore < 90
  )

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Páginas Críticas
            </CardTitle>
            <CardDescription className="text-slate-500">
              Performance de páginas individuais (dados de laboratório)
            </CardDescription>
          </div>

          {/* Summary Badge */}
          {criticalPages.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border-2 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-right">
                <p className="text-xs font-medium text-red-600">Páginas Críticas</p>
                <p className="text-sm font-bold text-red-700">{criticalPages.length}</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid gap-3 mb-4 md:grid-cols-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-xs font-medium text-slate-600">Críticas</p>
            </div>
            <p className="text-2xl font-bold text-red-700">{criticalPages.length}</p>
            <p className="text-xs text-slate-500">Score &lt; 50</p>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-xs font-medium text-slate-600">Precisa Melhorar</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{needsImprovementPages.length}</p>
            <p className="text-xs text-slate-500">Score 50-89</p>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-green-600" />
              <p className="text-xs font-medium text-slate-600">Boas</p>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {validPages.length - criticalPages.length - needsImprovementPages.length}
            </p>
            <p className="text-xs text-slate-500">Score ≥ 90</p>
          </div>
        </div>

        {/* Pages List */}
        <div className="space-y-3">
          {validPages.slice(0, 10).map((page, index) => {
            const scoreConfig = getScoreCategory(page.performanceScore)

            return (
              <div
                key={page.url}
                className={`p-4 rounded-lg border-2 ${scoreConfig.borderColor} ${scoreConfig.bgColor}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 flex items-center gap-1"
                      >
                        {getUrlShortName(page.url)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-[600px]">{page.url}</p>
                  </div>

                  {/* Performance Score */}
                  <div className="text-right ml-4">
                    <p className="text-xs text-slate-500">Performance</p>
                    <p className={`text-2xl font-bold ${scoreConfig.color}`}>
                      {page.performanceScore}
                    </p>
                    <p className={`text-xs font-medium ${scoreConfig.color}`}>
                      {scoreConfig.label}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">LCP</p>
                    <p
                      className={`text-sm font-bold ${getMetricStatusColor(page.labData.lcp, 'lcp')}`}
                    >
                      {formatMetricValue(page.labData.lcp, 'lcp')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">CLS</p>
                    <p
                      className={`text-sm font-bold ${getMetricStatusColor(page.labData.cls, 'cls')}`}
                    >
                      {formatMetricValue(page.labData.cls, 'cls')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">FCP</p>
                    <p
                      className={`text-sm font-bold ${getMetricStatusColor(page.labData.fcp, 'fcp')}`}
                    >
                      {formatMetricValue(page.labData.fcp, 'fcp')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Speed Index</p>
                    <p className="text-sm font-bold text-slate-700">
                      {Math.round(page.labData.speedIndex)}ms
                    </p>
                  </div>
                </div>

                {/* Data Source Badge */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500">
                    {page.fieldData ? '📊 Dados de campo disponíveis' : '🧪 Dados de laboratório'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {page.strategy === 'mobile' ? '📱 Mobile' : '💻 Desktop'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {validPages.length > 10 && (
          <p className="text-xs text-slate-500 text-center mt-3">
            +{validPages.length - 10} páginas adicionais analisadas
          </p>
        )}

        {/* Recommendations */}
        {(criticalPages.length > 0 || needsImprovementPages.length > 0) && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
            <p className="text-sm font-bold text-orange-800 mb-2">
              ⚡ Ações Recomendadas
            </p>
            <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc">
              <li>Priorize páginas com score &lt; 50 - têm maior impacto no ranking</li>
              <li>Otimize imagens: comprima, use WebP, implemente lazy loading</li>
              <li>Reduza JavaScript: code splitting, tree shaking, minimize bundles</li>
              <li>Use CDN para assets estáticos e caching agressivo</li>
              <li>Implemente server-side rendering ou static generation quando possível</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
