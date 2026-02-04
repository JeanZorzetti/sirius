'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Target,
  MousePointerClick,
  TrendingUp,
  Shield,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  DollarSign,
  BarChart3,
  Sparkles,
  Info,
} from 'lucide-react'
import { useState } from 'react'
import type {
  RankingPrediction,
  RankingPredictionResponse,
  RankingCategory,
} from '@/lib/ml/ranking-prediction'
import {
  getCategoryLabel,
  getCategoryColor,
  getEffortLabel,
  getEffortColor,
} from '@/lib/ml/ranking-prediction'

// ============================================================================
// PROPS
// ============================================================================

interface SEORankingPredictionsProps {
  results: RankingPredictionResponse | null
}

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const CATEGORY_ICONS: Record<RankingCategory, typeof Zap> = {
  quick_win: Zap,
  striking_distance: Target,
  ctr_optimization: MousePointerClick,
  growth_opportunity: TrendingUp,
  defend_position: Shield,
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SEORankingPredictions({ results }: SEORankingPredictionsProps) {
  const [expandedCategory, setExpandedCategory] = useState<RankingCategory | null>('quick_win')
  const [showActions, setShowActions] = useState<string | null>(null)

  if (!results || results.predictions.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            Ranking Predictions (ML)
          </CardTitle>
          <CardDescription className="text-slate-500">
            Dados insuficientes para previsoes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Info className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">Dados insuficientes</p>
            <p className="text-sm text-slate-500">
              Necessario keywords com pelo menos 10 impressoes para gerar previsoes de ranking.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { predictions, summary } = results

  // Group predictions by category
  const grouped: Record<RankingCategory, RankingPrediction[]> = {
    quick_win: predictions.filter((p) => p.category === 'quick_win'),
    ctr_optimization: predictions.filter((p) => p.category === 'ctr_optimization'),
    striking_distance: predictions.filter((p) => p.category === 'striking_distance'),
    growth_opportunity: predictions.filter((p) => p.category === 'growth_opportunity'),
    defend_position: predictions.filter((p) => p.category === 'defend_position'),
  }

  // Category order (most actionable first)
  const categoryOrder: RankingCategory[] = [
    'quick_win',
    'ctr_optimization',
    'striking_distance',
    'growth_opportunity',
    'defend_position',
  ]

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Ranking Predictions (ML)
            </CardTitle>
            <CardDescription className="text-slate-500">
              {summary.totalKeywordsAnalyzed} keywords analisadas com scoring de oportunidade
            </CardDescription>
          </div>

          {/* Summary stats */}
          <div className="flex items-center gap-3">
            <div className="text-right px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs text-green-600">Trafego Potencial</p>
              <p className="text-sm font-bold text-green-700">
                +{summary.totalEstimatedTrafficGain.toLocaleString('pt-BR')} cliques/mes
              </p>
            </div>
            <div className="text-right px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
              <p className="text-xs text-indigo-600">Valor Estimado</p>
              <p className="text-sm font-bold text-indigo-700">
                R$ {summary.totalEstimatedRevenueImpact.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Summary Cards */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {categoryOrder.map((category) => {
            const count = grouped[category].length
            const colors = getCategoryColor(category)
            const Icon = CATEGORY_ICONS[category]
            const isActive = expandedCategory === category

            return (
              <button
                key={category}
                onClick={() => setExpandedCategory(isActive ? null : category)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isActive ? `${colors.border} ${colors.bg} ring-2 ring-offset-1 ring-${colors.border.replace('border-', '')}` : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-4 w-4 ${colors.icon}`} />
                  <span className={`text-xs font-bold ${isActive ? colors.text : 'text-slate-700'}`}>
                    {count}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-tight">
                  {getCategoryLabel(category)}
                </p>
              </button>
            )
          })}
        </div>

        {/* Expanded Category Details */}
        {expandedCategory && grouped[expandedCategory].length > 0 && (
          <div className="space-y-3">
            <CategoryHeader
              category={expandedCategory}
              count={grouped[expandedCategory].length}
              totalTraffic={grouped[expandedCategory].reduce((s, p) => s + p.estimatedTrafficGain, 0)}
            />
            {grouped[expandedCategory].slice(0, 15).map((prediction) => (
              <PredictionCard
                key={prediction.keyword}
                prediction={prediction}
                showActions={showActions === prediction.keyword}
                onToggleActions={() =>
                  setShowActions(showActions === prediction.keyword ? null : prediction.keyword)
                }
              />
            ))}
            {grouped[expandedCategory].length > 15 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                +{grouped[expandedCategory].length - 15} keywords adicionais nesta categoria
              </p>
            )}
          </div>
        )}

        {/* No category selected */}
        {!expandedCategory && (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Sparkles className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Clique em uma categoria acima para ver as previsoes detalhadas
            </p>
          </div>
        )}

        {/* ML Attribution */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3 text-indigo-600" />
              <span>Powered by Machine Learning</span>
              <Badge variant="outline" className="text-xs">
                CTR Curve + Opportunity Scoring
              </Badge>
            </div>
            <span>
              Atualizado:{' '}
              {new Date(results.processedAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// CATEGORY HEADER
// ============================================================================

function CategoryHeader({
  category,
  count,
  totalTraffic,
}: {
  category: RankingCategory
  count: number
  totalTraffic: number
}) {
  const colors = getCategoryColor(category)
  const Icon = CATEGORY_ICONS[category]
  const descriptions: Record<RankingCategory, string> = {
    quick_win:
      'Keywords na posicao 11-15 com bom volume. Pequenas otimizacoes podem levar a pagina 1.',
    striking_distance:
      'Keywords na posicao 15-20. Precisam de mais esforco mas tem potencial significativo.',
    ctr_optimization:
      'Keywords bem posicionadas mas com CTR abaixo do esperado. Otimize title/description.',
    growth_opportunity:
      'Keywords alem da posicao 20. Requerem investimento maior em conteudo e backlinks.',
    defend_position:
      'Keywords no top 3. Mantenha o conteudo atualizado e monitore competidores.',
  }

  return (
    <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border} mb-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${colors.icon}`} />
          <div>
            <h3 className={`text-sm font-bold ${colors.text}`}>
              {getCategoryLabel(category)} ({count})
            </h3>
            <p className="text-xs text-slate-600">{descriptions[category]}</p>
          </div>
        </div>
        {totalTraffic > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500">Potencial total</p>
            <p className={`text-sm font-bold ${colors.text}`}>
              +{totalTraffic.toLocaleString('pt-BR')} cliques
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// PREDICTION CARD
// ============================================================================

function PredictionCard({
  prediction,
  showActions,
  onToggleActions,
}: {
  prediction: RankingPrediction
  showActions: boolean
  onToggleActions: () => void
}) {
  const colors = getCategoryColor(prediction.category)
  const effortColor = getEffortColor(prediction.effortLevel)

  return (
    <div className={`rounded-lg border-2 ${colors.border} overflow-hidden`}>
      {/* Main Content */}
      <div className={`p-4 ${colors.bg}`}>
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-slate-900">{prediction.keyword}</p>
              <Badge className={`text-xs ${colors.badge}`}>
                Score: {prediction.opportunityScore}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>{prediction.currentImpressions.toLocaleString('pt-BR')} impressoes</span>
              <span>{prediction.currentClicks} cliques</span>
              <span className={effortColor}>
                Esforco: {getEffortLabel(prediction.effortLevel)}
              </span>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-xs text-slate-500">Ganho estimado</p>
            <p className="text-lg font-bold text-green-600">
              +{prediction.estimatedTrafficGain} cliques
            </p>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <p className="text-xs text-slate-500">Posicao Atual</p>
            <p className="text-base font-bold text-slate-900">
              #{prediction.currentPosition.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Alvo</p>
            <div className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3 text-green-600" />
              <p className="text-base font-bold text-green-700">#{prediction.targetPosition}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">CTR Atual</p>
            <p className="text-base font-bold text-slate-900">
              {prediction.currentCTR.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">CTR Alvo</p>
            <p className="text-base font-bold text-green-700">
              {prediction.targetCTR.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress bar: opportunity score */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${prediction.opportunityScore}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600">
            {prediction.confidence}% confianca
          </span>
        </div>

        {/* Revenue impact */}
        {prediction.estimatedRevenueImpact > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <DollarSign className="h-3 w-3 text-green-600" />
            <span>
              Valor estimado: R$ {prediction.estimatedRevenueImpact.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mes
            </span>
          </div>
        )}

        {/* CTR gap alert */}
        {prediction.ctrGap > 1 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
            <MousePointerClick className="h-3 w-3" />
            <span>
              CTR {prediction.ctrGap.toFixed(1)}% abaixo do esperado para posicao {Math.round(prediction.currentPosition)}
            </span>
          </div>
        )}
      </div>

      {/* Actions toggle */}
      <button
        onClick={onToggleActions}
        className="w-full px-4 py-2 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors border-t border-slate-100"
      >
        <span className="text-xs font-medium text-slate-700">
          {prediction.recommendedActions.length} acoes recomendadas
        </span>
        {showActions ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {/* Actions list */}
      {showActions && (
        <div className="px-4 pb-4 bg-white">
          <ul className="space-y-2 mt-2">
            {prediction.recommendedActions.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <ActionTypeBadge type={action.type} />
                <div className="flex-1">
                  <p className="text-xs text-slate-700">{action.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Impacto: {action.estimatedImpact}
                  </p>
                </div>
                <PriorityBadge priority={action.priority} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ActionTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    on_page: 'bg-yellow-100 text-yellow-700',
    content: 'bg-purple-100 text-purple-700',
    technical: 'bg-slate-100 text-slate-700',
    snippet: 'bg-blue-100 text-blue-700',
    internal_links: 'bg-green-100 text-green-700',
    backlinks: 'bg-red-100 text-red-700',
  }

  const labels: Record<string, string> = {
    on_page: 'On-Page',
    content: 'Conteudo',
    technical: 'Tecnico',
    snippet: 'Snippet',
    internal_links: 'Links Int.',
    backlinks: 'Backlinks',
  }

  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${styles[type] || 'bg-slate-100 text-slate-600'}`}>
      {labels[type] || type}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  }

  const labels: Record<string, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baixa',
  }

  return (
    <span className={`text-[10px] font-bold ${styles[priority] || 'text-slate-600'}`}>
      {labels[priority] || priority}
    </span>
  )
}
