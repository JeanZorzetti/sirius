'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Gauge,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Info,
} from 'lucide-react'
import type { CrUXSummary } from '@/lib/crux-report'
import type { PageSpeedMetrics } from '@/lib/pagespeed-insights'

interface SEOWebVitalsProps {
  mobile: CrUXSummary | { error: string } | null
  desktop: CrUXSummary | { error: string } | null
  pageSpeedMobile?: PageSpeedMetrics | { error: string } | null
  pageSpeedDesktop?: PageSpeedMetrics | { error: string } | null
}

// Configuração de cores e ícones por categoria
const categoryConfig = {
  good: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    label: 'Bom',
  },
  'needs-improvement': {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    label: 'Precisa Melhorar',
  },
  poor: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: XCircle,
    iconColor: 'text-red-600',
    label: 'Ruim',
  },
}

function formatMetricValue(name: string, value: number): string {
  if (name.includes('LAYOUT SHIFT')) {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

function getMetricShortName(name: string): string {
  const mapping: Record<string, string> = {
    'LARGEST CONTENTFUL PAINT': 'LCP',
    'INTERACTION TO NEXT PAINT': 'INP',
    'CUMULATIVE LAYOUT SHIFT': 'CLS',
    'FIRST CONTENTFUL PAINT': 'FCP',
    'EXPERIMENTAL TIME TO FIRST BYTE': 'TTFB',
  }
  return mapping[name] || name
}

function getMetricDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'LARGEST CONTENTFUL PAINT':
      'Tempo até o maior elemento de conteúdo ser renderizado',
    'INTERACTION TO NEXT PAINT':
      'Tempo de resposta a interações do usuário (substituiu FID em 2024)',
    'CUMULATIVE LAYOUT SHIFT':
      'Estabilidade visual - quanto os elementos se movem durante o carregamento',
    'FIRST CONTENTFUL PAINT': 'Tempo até o primeiro conteúdo aparecer na tela',
    'EXPERIMENTAL TIME TO FIRST BYTE': 'Tempo até receber o primeiro byte do servidor',
  }
  return descriptions[name] || ''
}

export function SEOWebVitals({ mobile, desktop, pageSpeedMobile, pageSpeedDesktop }: SEOWebVitalsProps) {
  const hasMobileData = mobile && !('error' in mobile)
  const hasDesktopData = desktop && !('error' in desktop)
  const hasAnyData = hasMobileData || hasDesktopData

  if (!hasAnyData) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Gauge className="h-5 w-5 text-blue-600" />
            Core Web Vitals
          </CardTitle>
          <CardDescription className="text-slate-500">
            Métricas de performance e experiência do usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Info className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">
              Nenhum dado disponível no Chrome UX Report
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Seu site ainda não tem volume suficiente de usuários Chrome para gerar dados de
              campo. Continue otimizando e os dados aparecerão em breve!
            </p>
            {(pageSpeedMobile || pageSpeedDesktop) && (
              <p className="text-xs text-blue-600">
                💡 Estamos usando dados de laboratório (simulados) enquanto isso
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Escolher dados para exibir (preferir mobile se disponível)
  const primaryData = hasMobileData ? mobile : desktop
  const primaryFormFactor = hasMobileData ? 'mobile' : 'desktop'

  if (!primaryData || 'error' in primaryData) return null

  // Core metrics (os que importam para ranking)
  const coreMetrics = primaryData.metrics.filter((m) =>
    ['LARGEST CONTENTFUL PAINT', 'INTERACTION TO NEXT PAINT', 'CUMULATIVE LAYOUT SHIFT'].includes(
      m.name
    )
  )

  // Additional metrics
  const additionalMetrics = primaryData.metrics.filter(
    (m) =>
      !['LARGEST CONTENTFUL PAINT', 'INTERACTION TO NEXT PAINT', 'CUMULATIVE LAYOUT SHIFT'].includes(
        m.name
      )
  )

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Gauge className="h-5 w-5 text-blue-600" />
              Core Web Vitals
            </CardTitle>
            <CardDescription className="text-slate-500">
              Métricas de performance com dados reais de usuários (últimos 28 dias)
            </CardDescription>
          </div>

          {/* Overall Assessment Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${
              primaryData.overallAssessment === 'passing'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {primaryData.overallAssessment === 'passing' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <div className="text-right">
              <p
                className={`text-xs font-medium ${
                  primaryData.overallAssessment === 'passing' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {primaryData.overallAssessment === 'passing' ? 'Aprovado' : 'Reprovado'}
              </p>
              <p
                className={`text-sm font-bold ${
                  primaryData.overallAssessment === 'passing' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                Core Web Vitals
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Device Tabs Info */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          {hasMobileData && (
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                Dados de {primaryFormFactor === 'mobile' ? 'Mobile' : 'Desktop'}
              </span>
            </div>
          )}
          <span className="text-xs text-blue-600">•</span>
          <span className="text-xs text-blue-600">
            Período: {primaryData.collectionPeriod}
          </span>
        </div>

        {/* Core Metrics (LCP, INP, CLS) */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Métricas Core (Fatores de Ranking)
          </h3>

          <div className="grid gap-3 md:grid-cols-3">
            {coreMetrics.map((metric) => {
              const config = categoryConfig[metric.category]
              const Icon = config.icon

              return (
                <div
                  key={metric.name}
                  className={`p-4 rounded-lg border-2 ${config.border} ${config.bg}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.iconColor}`} />
                      <span className="text-xs font-bold text-slate-600">
                        {getMetricShortName(metric.name)}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
                  </div>

                  {/* Value */}
                  <div className="mb-2">
                    <p className={`text-2xl font-bold ${config.text}`}>
                      {formatMetricValue(metric.name, metric.p75)}
                    </p>
                    <p className="text-xs text-slate-500">p75 (75% dos usuários)</p>
                  </div>

                  {/* Distribution */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-700">Bom</span>
                      <span className="font-medium text-green-700">{metric.goodPercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-green-500"
                        style={{ width: `${metric.goodPercentage}%` }}
                      />
                      <div
                        className="bg-yellow-500"
                        style={{ width: `${metric.needsImprovementPercentage}%` }}
                      />
                      <div className="bg-red-500" style={{ width: `${metric.poorPercentage}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-yellow-700">{metric.needsImprovementPercentage}%</span>
                      <span className="text-red-700">{metric.poorPercentage}%</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-2">
                    {getMetricDescription(metric.name)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Additional Metrics */}
        {additionalMetrics.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Métricas Adicionais</h3>

            <div className="grid gap-3 md:grid-cols-2">
              {additionalMetrics.map((metric) => {
                const config = categoryConfig[metric.category]
                const Icon = config.icon

                return (
                  <div
                    key={metric.name}
                    className={`p-3 rounded-lg border ${config.border} ${config.bg}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.iconColor}`} />
                        <span className="text-xs font-bold text-slate-700">
                          {getMetricShortName(metric.name)}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${config.text}`}>
                        {formatMetricValue(metric.name, metric.p75)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{getMetricDescription(metric.name)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <p className="text-sm font-bold text-blue-800 mb-2">
            💡 Como melhorar seu Core Web Vitals
          </p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
            <li>
              <span className="font-medium">LCP:</span> Otimize imagens, use CDN, implemente lazy loading
            </li>
            <li>
              <span className="font-medium">INP:</span> Reduza JavaScript, otimize event handlers
            </li>
            <li>
              <span className="font-medium">CLS:</span> Defina dimensões de imagens/vídeos, evite
              inserções dinâmicas
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
