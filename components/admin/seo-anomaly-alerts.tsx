'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, XCircle, Info, TrendingDown, TrendingUp, Zap, ExternalLink } from 'lucide-react'
import type {
  AnomalyAlert,
  Severity,
  DetectAnomaliesResponse,
} from '@/lib/ml/anomaly-detection'
import {
  getSeverityColor,
  getMetricName,
  formatDeviation,
  groupAlertsBySeverity,
} from '@/lib/ml/anomaly-detection'

interface SEOAnomalyAlertsProps {
  results: DetectAnomaliesResponse | null
  loading?: boolean
}

export function SEOAnomalyAlerts({ results, loading = false }: SEOAnomalyAlertsProps) {
  if (loading) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Zap className="h-5 w-5 text-purple-600 animate-pulse" />
            Alertas de Anomalias (ML)
          </CardTitle>
          <CardDescription className="text-slate-500">
            Analisando métricas com machine learning...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!results) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Zap className="h-5 w-5 text-slate-400" />
            Alertas de Anomalias (ML)
          </CardTitle>
          <CardDescription className="text-slate-500">
            Dados insuficientes para analise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Info className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">Dados insuficientes</p>
            <p className="text-sm text-slate-500">
              Necessario pelo menos 7 dias de dados historicos para detectar anomalias.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { alerts, total_alerts, critical_count, warning_count, info_count } = results

  // No alerts - all good!
  if (total_alerts === 0) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span>Nenhuma Anomalia Detectada</span>
          </CardTitle>
          <CardDescription className="text-green-700">
            Todas as métricas estão dentro dos padrões esperados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            ✨ Ótimo! Suas métricas de SEO estão estáveis. Continue monitorando.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group alerts by severity
  const grouped = groupAlertsBySeverity(alerts)

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Zap className="h-5 w-5 text-purple-600" />
              Alertas de Anomalias (ML)
            </CardTitle>
            <CardDescription className="text-slate-500">
              {total_alerts} anomalia{total_alerts > 1 ? 's' : ''} detectada{total_alerts > 1 ? 's' : ''} nos últimos 3 dias
            </CardDescription>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2">
            {critical_count > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {critical_count} crítico{critical_count > 1 ? 's' : ''}
              </Badge>
            )}
            {warning_count > 0 && (
              <Badge className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                {warning_count} aviso{warning_count > 1 ? 's' : ''}
              </Badge>
            )}
            {info_count > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                {info_count}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Critical Alerts */}
          {grouped.critical.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Crítico ({grouped.critical.length})
              </h3>
              <div className="space-y-3">
                {grouped.critical.map((alert, index) => (
                  <AlertCard key={`critical-${index}`} alert={alert} />
                ))}
              </div>
            </div>
          )}

          {/* Warning Alerts */}
          {grouped.warning.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Avisos ({grouped.warning.length})
              </h3>
              <div className="space-y-3">
                {grouped.warning.map((alert, index) => (
                  <AlertCard key={`warning-${index}`} alert={alert} />
                ))}
              </div>
            </div>
          )}

          {/* Info Alerts */}
          {grouped.info.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Informação ({grouped.info.length})
              </h3>
              <div className="space-y-3">
                {grouped.info.map((alert, index) => (
                  <AlertCard key={`info-${index}`} alert={alert} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ML Attribution */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-purple-600" />
              <span>Powered by Machine Learning</span>
              <Badge variant="outline" className="text-xs">
                Z-Score + IQR
              </Badge>
            </div>
            <span>
              Atualizado:{' '}
              {new Date(results.processed_at).toLocaleString('pt-BR', {
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
// ALERT CARD
// ============================================================================

function AlertCard({ alert }: { alert: AnomalyAlert }) {
  const colors = getSeverityColor(alert.severity as Severity)
  const isNegativeChange = alert.deviation < 0

  return (
    <div className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-bold ${colors.text}`}>
              {getMetricName(alert.metric)}
            </h4>
            {alert.segment && (
              <div className="flex gap-1">
                {Object.entries(alert.segment).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {value}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-600">
            Detectado em{' '}
            {new Date(alert.detected_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Confidence badge */}
        <Badge variant="outline" className={`${colors.text} text-xs`}>
          {alert.confidence.toFixed(0)}% confiança
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-slate-600">Baseline</p>
          <p className="text-lg font-bold text-slate-900">
            {alert.baseline.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600">Atual</p>
          <p className="text-lg font-bold text-slate-900">
            {alert.current.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600">Desvio</p>
          <div className="flex items-center gap-1">
            {isNegativeChange ? (
              <TrendingDown className={`h-4 w-4 ${colors.icon}`} />
            ) : (
              <TrendingUp className={`h-4 w-4 ${colors.icon}`} />
            )}
            <p className={`text-lg font-bold ${colors.text}`}>
              {formatDeviation(alert.deviation)}
            </p>
          </div>
        </div>
      </div>

      {/* Estimated Impact */}
      {alert.estimated_impact && Object.keys(alert.estimated_impact).length > 0 && (
        <div className="mb-3 p-2 rounded bg-white/50 border border-slate-200">
          <p className="text-xs font-medium text-slate-700 mb-1">Impacto Estimado:</p>
          <div className="space-y-1">
            {Object.entries(alert.estimated_impact).map(([key, value]) => (
              <p key={key} className="text-xs text-slate-600">
                • {formatImpactKey(key)}: {formatImpactValue(key, value)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      <div>
        <p className="text-xs font-medium text-slate-700 mb-2">Ações Recomendadas:</p>
        <ul className="space-y-1">
          {alert.recommended_actions.map((action, index) => (
            <li key={index} className="text-xs text-slate-700 flex items-start gap-1">
              <span className="mt-0.5">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Method badge */}
      <div className="mt-3 pt-3 border-t border-slate-200/50">
        <p className="text-xs text-slate-500">
          Método: <span className="font-medium">{alert.method}</span>
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function formatImpactKey(key: string): string {
  const names: Record<string, string> = {
    cliques_perdidos_dia: 'Cliques perdidos/dia',
    cliques_perdidos_mes: 'Cliques perdidos/mes',
    cliques_ganhos_dia: 'Cliques ganhos/dia',
    impacto_receita_estimado: 'Impacto em receita',
    impressoes_perdidas_dia: 'Impressoes perdidas/dia',
    impressoes_desperdicadas: 'Impressoes desperdicadas',
    cliques_potenciais_perdidos: 'Cliques potenciais perdidos',
    posicoes_perdidas: 'Posicoes perdidas',
    perda_ctr_estimada_pct: 'Perda de CTR estimada',
    perda_ctr_pct: 'Perda de CTR',
  }
  return names[key] || key.replace(/_/g, ' ')
}

function formatImpactValue(key: string, value: number): string {
  if (key.includes('receita')) {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }
  if (key.includes('pct') || key.includes('percent')) {
    return `${value.toFixed(1)}%`
  }
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}
