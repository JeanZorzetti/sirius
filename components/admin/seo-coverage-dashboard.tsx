'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  FileSearch,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import type { CoverageSummary } from '@/lib/url-inspection'

interface SEOCoverageDashboardProps {
  summary: CoverageSummary | null
}

export function SEOCoverageDashboard({ summary }: SEOCoverageDashboardProps) {
  if (!summary) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <FileSearch className="h-5 w-5 text-blue-600" />
            Cobertura de Indexação
          </CardTitle>
          <CardDescription className="text-slate-500">
            Status de indexação das suas páginas no Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <FileSearch className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">Nenhum dado de cobertura disponível</p>
            <p className="text-sm text-slate-500">
              Execute a inspeção de URLs para visualizar o status de indexação
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Determinar status geral baseado na porcentagem de erros
  const getOverallStatus = () => {
    if (summary.errorRate === 0 && summary.indexedPercentage >= 90) {
      return { status: 'excellent', label: 'Excelente', color: 'green' }
    } else if (summary.errorRate < 10 && summary.indexedPercentage >= 70) {
      return { status: 'good', label: 'Bom', color: 'blue' }
    } else if (summary.errorRate < 25) {
      return { status: 'needs-improvement', label: 'Precisa Atenção', color: 'yellow' }
    } else {
      return { status: 'critical', label: 'Crítico', color: 'red' }
    }
  }

  const overallStatus = getOverallStatus()

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <FileSearch className="h-5 w-5 text-blue-600" />
              Cobertura de Indexação
            </CardTitle>
            <CardDescription className="text-slate-500">
              Status de indexação das suas páginas no Google
            </CardDescription>
          </div>

          {/* Overall Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${
              overallStatus.color === 'green'
                ? 'bg-green-50 border-green-200'
                : overallStatus.color === 'blue'
                ? 'bg-blue-50 border-blue-200'
                : overallStatus.color === 'yellow'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {overallStatus.color === 'green' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : overallStatus.color === 'red' ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <div className="text-right">
              <p
                className={`text-xs font-medium ${
                  overallStatus.color === 'green'
                    ? 'text-green-600'
                    : overallStatus.color === 'blue'
                    ? 'text-blue-600'
                    : overallStatus.color === 'yellow'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {overallStatus.label}
              </p>
              <p
                className={`text-sm font-bold ${
                  overallStatus.color === 'green'
                    ? 'text-green-700'
                    : overallStatus.color === 'blue'
                    ? 'text-blue-700'
                    : overallStatus.color === 'yellow'
                    ? 'text-yellow-700'
                    : 'text-red-700'
                }`}
              >
                Cobertura
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Stats Grid */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          {/* Total Pages */}
          <div className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">Total de Páginas</span>
              <FileSearch className="h-4 w-4 text-slate-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{summary.totalPages}</p>
            <p className="text-xs text-slate-500 mt-1">Páginas inspecionadas</p>
          </div>

          {/* Indexed */}
          <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-700">Indexadas</span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-700">{summary.indexed}</p>
            <p className="text-xs text-green-600 mt-1">{summary.indexedPercentage}% do total</p>
          </div>

          {/* Excluded */}
          <div className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-yellow-700">Excluídas</span>
              <MinusCircle className="h-4 w-4 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-700">{summary.excluded}</p>
            <p className="text-xs text-yellow-600 mt-1">
              {summary.totalPages > 0
                ? Math.round((summary.excluded / summary.totalPages) * 100)
                : 0}
              % do total
            </p>
          </div>

          {/* Errors */}
          <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-red-700">Com Erro</span>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-700">{summary.errors}</p>
            <p className="text-xs text-red-600 mt-1">{summary.errorRate}% do total</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4 mb-6">
          {/* Indexed Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Taxa de Indexação</span>
              <span className="text-sm font-bold text-green-600">{summary.indexedPercentage}%</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${summary.indexedPercentage}%` }}
              />
            </div>
          </div>

          {/* Error Rate Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-700">Taxa de Erro</span>
              <span className="text-sm font-bold text-red-600">{summary.errorRate}%</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all"
                style={{ width: `${summary.errorRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Good Performance */}
          {summary.indexedPercentage >= 90 && summary.errorRate < 5 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-sm font-bold text-green-800">Cobertura Excelente</p>
              </div>
              <p className="text-xs text-green-700">
                Sua taxa de indexação está ótima! Continue monitorando para manter esse padrão.
              </p>
            </div>
          )}

          {/* Needs Improvement */}
          {(summary.indexedPercentage < 70 || summary.errorRate >= 10) && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-bold text-yellow-800">Ação Necessária</p>
              </div>
              <p className="text-xs text-yellow-700">
                {summary.errorRate >= 10 &&
                  `${summary.errors} página${summary.errors > 1 ? 's' : ''} com erro${summary.errors > 1 ? 's' : ''} de indexação. `}
                {summary.indexedPercentage < 70 && 'Taxa de indexação abaixo do ideal. '}
                Revise os erros abaixo.
              </p>
            </div>
          )}

          {/* Critical Issues */}
          {summary.errorRate >= 25 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-pink-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-bold text-red-800">Situação Crítica</p>
              </div>
              <p className="text-xs text-red-700">
                Mais de 25% das páginas apresentam erros. Isso pode impactar severamente seu SEO.
                Corrija os erros urgentemente!
              </p>
            </div>
          )}

          {/* Excluded Pages Info */}
          {summary.excluded > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <MinusCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-bold text-blue-800">Páginas Excluídas</p>
              </div>
              <p className="text-xs text-blue-700">
                {summary.excluded} página{summary.excluded > 1 ? 's' : ''} excluída
                {summary.excluded > 1 ? 's' : ''} (bloqueadas por robots.txt, noindex, etc). Verifique
                se isso é intencional.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
