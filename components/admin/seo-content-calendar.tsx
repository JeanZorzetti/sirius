'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  AlertTriangle,
  TrendingDown,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'
import type { ContentDecayPrediction, ContentDecayResponse, DecayFactor } from '@/lib/ml/content-decay'

// ============================================================================
// PROPS
// ============================================================================

interface SEOContentCalendarProps {
  results: ContentDecayResponse | null
}

// ============================================================================
// URGENCY CONFIG
// ============================================================================

const URGENCY_CONFIG = {
  critical: {
    label: 'Crítico',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeVariant: 'destructive' as const,
    icon: AlertTriangle,
    iconColor: 'text-red-600',
  },
  high: {
    label: 'Alto Risco',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    badgeVariant: 'default' as const,
    icon: TrendingDown,
    iconColor: 'text-orange-600',
  },
  medium: {
    label: 'Médio Risco',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeVariant: 'secondary' as const,
    icon: Clock,
    iconColor: 'text-yellow-600',
  },
  low: {
    label: 'Baixo Risco',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeVariant: 'outline' as const,
    icon: Info,
    iconColor: 'text-blue-600',
  },
}

// ============================================================================
// FACTOR CONFIG
// ============================================================================

const FACTOR_CONFIG = {
  freshness: {
    label: 'Desatualização',
    icon: Clock,
    color: 'text-amber-600',
  },
  performance_decline: {
    label: 'Queda de Performance',
    icon: TrendingDown,
    color: 'text-red-600',
  },
  competition: {
    label: 'Competição',
    icon: AlertTriangle,
    color: 'text-orange-600',
  },
  seasonality: {
    label: 'Sazonalidade',
    icon: Calendar,
    color: 'text-blue-600',
  },
  ctr_drop: {
    label: 'Queda de CTR',
    icon: TrendingDown,
    color: 'text-pink-600',
  },
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PredictionCard({ prediction }: { prediction: ContentDecayPrediction }) {
  const [expanded, setExpanded] = useState(false)
  const config = URGENCY_CONFIG[prediction.urgency]
  const Icon = config.icon

  const refreshDate = new Date(prediction.recommendedRefreshDate)
  const daysFromNow = Math.ceil(
    (refreshDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div
      className={`p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {prediction.decayProbability}% decay
              </Badge>
              <Badge variant="outline" className="text-xs">
                {prediction.daysUntilDecay} dias
              </Badge>
            </div>
            <a
              href={prediction.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-medium ${config.color} hover:underline flex items-center gap-1 break-all`}
            >
              {prediction.url}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 p-1 hover:bg-white/50 rounded transition-colors flex-shrink-0"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Posição</p>
          <p className="text-sm font-semibold text-slate-900">#{prediction.currentPosition}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Cliques/mês</p>
          <p className="text-sm font-semibold text-slate-900">
            {prediction.currentClicks.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Perda estimada</p>
          <p className="text-sm font-semibold text-red-600">
            -{prediction.estimatedTrafficLossIfNotRefreshed} cliques
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Impacto</p>
          <p className="text-sm font-semibold text-red-600">
            -R$ {prediction.estimatedRevenueLossIfNotRefreshed.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Refresh Date */}
      <div className="flex items-center justify-between p-2 bg-white/60 rounded border border-slate-200 mb-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-slate-600" />
          <span className="text-sm text-slate-700">Atualizar até:</span>
          <span className="text-sm font-semibold text-slate-900">
            {refreshDate.toLocaleDateString('pt-BR')}
          </span>
          <span className="text-xs text-slate-500">
            ({daysFromNow > 0 ? `em ${daysFromNow} dias` : 'vencido'})
          </span>
        </div>
        <Button size="sm" variant="default" className="h-7">
          <RefreshCw className="h-3 w-3 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          {/* Decay Factors */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Fatores de Decay:</p>
            <div className="space-y-2">
              {prediction.factors.map((factor, idx) => {
                const factorConfig = FACTOR_CONFIG[factor.factor]
                const FactorIcon = factorConfig.icon
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-white/60 rounded border border-slate-200"
                  >
                    <FactorIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${factorConfig.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-700">
                          {factorConfig.label}
                        </span>
                        <Badge
                          variant={
                            factor.severity === 'critical'
                              ? 'destructive'
                              : factor.severity === 'high'
                                ? 'default'
                                : 'outline'
                          }
                          className="h-5 text-xs"
                        >
                          {factor.impact > 0 ? '+' : ''}
                          {factor.impact}%
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{factor.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trends */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-white/60 rounded border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Tendência de Posição</p>
              <Badge
                variant={
                  prediction.positionTrend === 'improving'
                    ? 'default'
                    : prediction.positionTrend === 'declining'
                      ? 'destructive'
                      : 'secondary'
                }
                className="text-xs"
              >
                {prediction.positionTrend === 'improving'
                  ? '📈 Melhorando'
                  : prediction.positionTrend === 'declining'
                    ? '📉 Caindo'
                    : '➡️ Estável'}
              </Badge>
            </div>
            <div className="p-2 bg-white/60 rounded border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Tendência de Tráfego</p>
              <Badge
                variant={
                  prediction.trafficTrend === 'growing'
                    ? 'default'
                    : prediction.trafficTrend === 'declining'
                      ? 'destructive'
                      : 'secondary'
                }
                className="text-xs"
              >
                {prediction.trafficTrend === 'growing'
                  ? '📈 Crescendo'
                  : prediction.trafficTrend === 'declining'
                    ? '📉 Caindo'
                    : '➡️ Estável'}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SEOContentCalendar({ results }: SEOContentCalendarProps) {
  const [activeTab, setActiveTab] = useState<'urgent' | 'calendar'>('urgent')

  if (!results || results.predictions.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Calendar className="h-5 w-5 text-slate-400" />
            Calendário de Atualização de Conteúdo (ML)
          </CardTitle>
          <CardDescription className="text-slate-500">
            Nenhuma página em risco detectada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center border-2 border-dashed border-green-200 rounded-lg bg-green-50">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-green-800 font-medium mb-1">Tudo em ordem!</p>
            <p className="text-sm text-green-700">
              Nenhum conteúdo com alto risco de decay detectado no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { predictions, summary } = results

  // Group by urgency
  const criticalPages = predictions.filter((p) => p.urgency === 'critical')
  const highRiskPages = predictions.filter((p) => p.urgency === 'high')
  const mediumRiskPages = predictions.filter((p) => p.urgency === 'medium')
  const lowRiskPages = predictions.filter((p) => p.urgency === 'low')

  // Group by time window for calendar view
  const next30Days = predictions.filter((p) => p.daysUntilDecay <= 30)
  const next60Days = predictions.filter((p) => p.daysUntilDecay > 30 && p.daysUntilDecay <= 60)
  const next90Days = predictions.filter((p) => p.daysUntilDecay > 60 && p.daysUntilDecay <= 90)

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Calendar className="h-5 w-5 text-purple-600" />
          Calendário de Atualização de Conteúdo (ML)
        </CardTitle>
        <CardDescription className="text-slate-500">
          {predictions.length} página{predictions.length !== 1 ? 's' : ''} com risco de decay •{' '}
          <span className="font-medium text-red-600">
            R$ {summary.totalEstimatedRevenueLoss.toLocaleString()}
          </span>{' '}
          em risco
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-xs font-medium text-red-700">Crítico</p>
            </div>
            <p className="text-2xl font-bold text-red-900">{summary.criticalPages}</p>
          </div>
          <div className="p-3 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-700">Alto</p>
            </div>
            <p className="text-2xl font-bold text-orange-900">{summary.highRiskPages}</p>
          </div>
          <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-xs font-medium text-yellow-700">Médio</p>
            </div>
            <p className="text-2xl font-bold text-yellow-900">{summary.mediumRiskPages}</p>
          </div>
          <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-slate-600" />
              <p className="text-xs font-medium text-slate-700">Perda Total</p>
            </div>
            <p className="text-lg font-bold text-slate-900">
              R$ {summary.totalEstimatedRevenueLoss.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('urgent')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'urgent'
                ? 'text-purple-700 border-b-2 border-purple-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚨 Urgentes ({criticalPages.length + highRiskPages.length})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'text-purple-700 border-b-2 border-purple-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Calendário (90 dias)
          </button>
        </div>

        {/* Content */}
        {activeTab === 'urgent' && (
          <div className="space-y-4">
            {/* Critical */}
            {criticalPages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Ação Imediata Necessária ({criticalPages.length})
                </h3>
                <div className="space-y-2">
                  {criticalPages.map((pred, idx) => (
                    <PredictionCard key={idx} prediction={pred} />
                  ))}
                </div>
              </div>
            )}

            {/* High Risk */}
            {highRiskPages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Alto Risco ({highRiskPages.length})
                </h3>
                <div className="space-y-2">
                  {highRiskPages.map((pred, idx) => (
                    <PredictionCard key={idx} prediction={pred} />
                  ))}
                </div>
              </div>
            )}

            {/* Medium Risk */}
            {mediumRiskPages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Médio Risco ({mediumRiskPages.length})
                </h3>
                <div className="space-y-2">
                  {mediumRiskPages.slice(0, 5).map((pred, idx) => (
                    <PredictionCard key={idx} prediction={pred} />
                  ))}
                  {mediumRiskPages.length > 5 && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      +{mediumRiskPages.length - 5} páginas de médio risco (ver calendário)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-4">
            {/* Next 30 days */}
            {next30Days.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-2">
                  📅 Próximos 30 dias ({next30Days.length})
                </h3>
                <div className="space-y-2">
                  {next30Days.map((pred, idx) => (
                    <PredictionCard key={idx} prediction={pred} />
                  ))}
                </div>
              </div>
            )}

            {/* 31-60 days */}
            {next60Days.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-orange-700 mb-2">
                  📅 31-60 dias ({next60Days.length})
                </h3>
                <div className="space-y-2">
                  {next60Days.map((pred, idx) => (
                    <PredictionCard key={idx} prediction={pred} />
                  ))}
                </div>
              </div>
            )}

            {/* 61-90 days */}
            {next90Days.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-700 mb-2">
                  📅 61-90 dias ({next90Days.length})
                </h3>
                <div className="space-y-2">
                  {next90Days.map((pred, idx) => (
                    <PredictionCard key={idx} prediction={pred} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attribution */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by Machine Learning - Content Decay Prediction
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
