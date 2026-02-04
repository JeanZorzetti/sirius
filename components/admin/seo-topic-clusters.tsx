'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Layers,
  AlertTriangle,
  FileX,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  TrendingUp,
  Merge,
  PenLine,
  Shield,
  PlusCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { KeywordCluster, KeywordClusteringResponse } from '@/lib/ml/keyword-clustering'
import { getActionColor, getActionLabel } from '@/lib/ml/keyword-clustering'

// ============================================================================
// PROPS
// ============================================================================

interface SEOTopicClustersProps {
  results: KeywordClusteringResponse | null
}

// ============================================================================
// ACTION ICONS
// ============================================================================

const ACTION_ICONS: Record<string, typeof FileText> = {
  create_page: PlusCircle,
  expand_existing: PenLine,
  consolidate: Merge,
  optimize: TrendingUp,
  maintain: Shield,
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SEOTopicClusters({ results }: SEOTopicClustersProps) {
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null)

  if (!results || results.clusters.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Layers className="h-5 w-5 text-slate-400" />
            Topic Clusters (ML)
          </CardTitle>
          <CardDescription className="text-slate-500">
            Dados insuficientes para agrupamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Info className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">Dados insuficientes</p>
            <p className="text-sm text-slate-500">
              Necessario keywords com pelo menos 5 impressoes para agrupar por topico.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { clusters, summary } = results

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Layers className="h-5 w-5 text-teal-600" />
              Topic Clusters (ML)
            </CardTitle>
            <CardDescription className="text-slate-500">
              {summary.totalClusters} topicos identificados a partir de {summary.totalKeywords} keywords
            </CardDescription>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2">
            {summary.contentGaps > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                <FileX className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-bold text-red-700">
                  {summary.contentGaps} gap{summary.contentGaps > 1 ? 's' : ''}
                </span>
              </div>
            )}
            {summary.cannibalizationIssues > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-700">
                  {summary.cannibalizationIssues} canibalizacao
                </span>
              </div>
            )}
            {summary.estimatedMissingTraffic > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs font-bold text-green-700">
                  +{summary.estimatedMissingTraffic.toLocaleString('pt-BR')} cliques potenciais
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clusters.map((cluster) => (
            <ClusterCard
              key={cluster.clusterId}
              cluster={cluster}
              isExpanded={expandedCluster === cluster.clusterId}
              onToggle={() =>
                setExpandedCluster(
                  expandedCluster === cluster.clusterId ? null : cluster.clusterId
                )
              }
            />
          ))}
        </div>

        {/* ML Attribution */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Layers className="h-3 w-3 text-teal-600" />
              <span>Powered by Machine Learning</span>
              <Badge variant="outline" className="text-xs">
                Jaccard Similarity + Agglomerative Clustering
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
// CLUSTER CARD
// ============================================================================

function ClusterCard({
  cluster,
  isExpanded,
  onToggle,
}: {
  cluster: KeywordCluster
  isExpanded: boolean
  onToggle: () => void
}) {
  const colors = getActionColor(cluster.recommendedAction)
  const ActionIcon = ACTION_ICONS[cluster.recommendedAction] || FileText

  return (
    <div className={`rounded-lg border-2 ${colors.border} overflow-hidden`}>
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className={`w-full p-4 ${colors.bg} text-left transition-colors hover:brightness-95`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Topic name + action badge */}
            <div className="flex items-center gap-2 mb-1.5">
              <ActionIcon className={`h-4 w-4 ${colors.text}`} />
              <h3 className="text-sm font-bold text-slate-900">{cluster.topicName}</h3>
              <Badge className={`text-xs ${colors.badge}`}>
                {getActionLabel(cluster.recommendedAction)}
              </Badge>
              {cluster.cannibalizationRisk !== 'none' && (
                <Badge className="text-xs bg-yellow-100 text-yellow-700">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  Canibalizacao
                </Badge>
              )}
            </div>

            {/* Keywords preview */}
            <div className="flex flex-wrap gap-1 mb-2">
              {cluster.keywords.slice(0, 5).map((kw) => (
                <span
                  key={kw.query}
                  className="px-1.5 py-0.5 text-xs bg-white/60 text-slate-700 rounded border border-slate-200"
                >
                  {kw.query}
                </span>
              ))}
              {cluster.keywords.length > 5 && (
                <span className="px-1.5 py-0.5 text-xs text-slate-500">
                  +{cluster.keywords.length - 5} mais
                </span>
              )}
            </div>

            {/* Metrics row */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span>{cluster.keywords.length} keywords</span>
              <span>{cluster.totalImpressions.toLocaleString('pt-BR')} impressoes</span>
              <span>{cluster.totalClicks.toLocaleString('pt-BR')} cliques</span>
              <span>Pos. media: {cluster.averagePosition}</span>
            </div>
          </div>

          {/* Coverage + expand */}
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <p className="text-xs text-slate-500">Cobertura</p>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-2 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cluster.contentCoverage >= 60
                        ? 'bg-green-500'
                        : cluster.contentCoverage >= 30
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${cluster.contentCoverage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {cluster.contentCoverage}%
                </span>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="bg-white border-t border-slate-100 p-4">
          {/* Action recommendation */}
          <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border} mb-4`}>
            <div className="flex items-start gap-2">
              <ActionIcon className={`h-4 w-4 mt-0.5 ${colors.text}`} />
              <div>
                <p className={`text-xs font-bold ${colors.text} mb-0.5`}>
                  Acao Recomendada: {getActionLabel(cluster.recommendedAction)}
                </p>
                <p className="text-xs text-slate-600">{cluster.actionDescription}</p>
              </div>
            </div>
          </div>

          {/* Pages targeting this cluster */}
          {cluster.pagesTargeting.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-700 mb-2">
                Paginas targeting ({cluster.pagesTargeting.length}):
              </p>
              <div className="space-y-1">
                {cluster.pagesTargeting.map((page) => (
                  <div
                    key={page}
                    className="flex items-center gap-1.5 text-xs text-slate-600 px-2 py-1 bg-slate-50 rounded"
                  >
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                    <span className="truncate">{page}</span>
                  </div>
                ))}
              </div>
              {cluster.cannibalizationRisk !== 'none' && (
                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1.5 rounded">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    {cluster.pagesTargeting.length} paginas competindo pelo mesmo topico.
                    Considere consolidar.
                  </span>
                </div>
              )}
            </div>
          )}

          {cluster.pagesTargeting.length === 0 && (
            <div className="mb-4 flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-1.5 rounded border border-red-200">
              <FileX className="h-3 w-3" />
              <span>
                Nenhuma pagina cobre este topico. Oportunidade de criar conteudo novo.
              </span>
            </div>
          )}

          {/* All keywords in cluster */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">
              Keywords ({cluster.keywords.length}):
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1.5 pr-3 text-slate-500 font-medium">Keyword</th>
                    <th className="text-right py-1.5 px-2 text-slate-500 font-medium">Cliques</th>
                    <th className="text-right py-1.5 px-2 text-slate-500 font-medium">Impressoes</th>
                    <th className="text-right py-1.5 px-2 text-slate-500 font-medium">CTR</th>
                    <th className="text-right py-1.5 pl-2 text-slate-500 font-medium">Posicao</th>
                  </tr>
                </thead>
                <tbody>
                  {cluster.keywords.map((kw) => (
                    <tr key={kw.query} className="border-b border-slate-100 last:border-0">
                      <td className="py-1.5 pr-3 text-slate-700">{kw.query}</td>
                      <td className="text-right py-1.5 px-2 text-slate-600">
                        {kw.clicks.toLocaleString('pt-BR')}
                      </td>
                      <td className="text-right py-1.5 px-2 text-slate-600">
                        {kw.impressions.toLocaleString('pt-BR')}
                      </td>
                      <td className="text-right py-1.5 px-2 text-slate-600">
                        {kw.ctr.toFixed(2)}%
                      </td>
                      <td className="text-right py-1.5 pl-2 text-slate-600">
                        {kw.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
