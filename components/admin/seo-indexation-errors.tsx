'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  XCircle,
  FileX,
  Smartphone,
  Code,
  Zap,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import type { InspectionError } from '@/lib/url-inspection'

interface SEOIndexationErrorsProps {
  errors: InspectionError[]
}

const categoryConfig = {
  indexing: {
    icon: FileX,
    label: 'Indexação',
    color: 'red',
  },
  mobile: {
    icon: Smartphone,
    label: 'Mobile Usability',
    color: 'orange',
  },
  rich_results: {
    icon: Code,
    label: 'Rich Results',
    color: 'purple',
  },
  amp: {
    icon: Zap,
    label: 'AMP',
    color: 'blue',
  },
  fetch: {
    icon: XCircle,
    label: 'Fetch Error',
    color: 'red',
  },
}

export function SEOIndexationErrors({ errors }: SEOIndexationErrorsProps) {
  if (!errors || errors.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <AlertTriangle className="h-5 w-5 text-green-600" />
            Erros de Indexação
          </CardTitle>
          <CardDescription className="text-slate-500">
            Problemas encontrados durante a inspeção de URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border-2 border-dashed border-green-200 rounded-lg bg-green-50">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
            <p className="text-green-800 font-bold mb-2">Nenhum erro encontrado!</p>
            <p className="text-sm text-green-700">
              Todas as páginas inspecionadas estão sem problemas de indexação.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Agrupar erros por categoria
  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.category]) {
      acc[error.category] = []
    }
    acc[error.category].push(error)
    return acc
  }, {} as Record<string, InspectionError[]>)

  // Contar erros por severidade
  const errorCount = errors.filter((e) => e.severity === 'ERROR').length
  const warningCount = errors.filter((e) => e.severity === 'WARNING').length

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Erros de Indexação
            </CardTitle>
            <CardDescription className="text-slate-500">
              {errors.length} problema{errors.length > 1 ? 's' : ''} encontrado
              {errors.length > 1 ? 's' : ''} • {errorCount} erro{errorCount !== 1 ? 's' : ''} •{' '}
              {warningCount} aviso{warningCount !== 1 ? 's' : ''}
            </CardDescription>
          </div>

          {/* Summary Badge */}
          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 border border-red-200">
                <XCircle className="h-3 w-3 text-red-600" />
                <span className="text-xs font-medium text-red-700">{errorCount}</span>
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">{warningCount}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedErrors).map(([category, categoryErrors]) => {
            const config = categoryConfig[category as keyof typeof categoryConfig]
            const Icon = config.icon

            return (
              <div key={category}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-4 w-4 text-${config.color}-600`} />
                  <h3 className="text-sm font-bold text-slate-900">
                    {config.label} ({categoryErrors.length})
                  </h3>
                </div>

                {/* Error List */}
                <div className="space-y-2">
                  {categoryErrors.map((error, index) => (
                    <div
                      key={`${error.url}-${index}`}
                      className={`p-3 rounded-lg border ${
                        error.severity === 'ERROR'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      {/* Error Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {error.severity === 'ERROR' ? (
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium ${
                                error.severity === 'ERROR' ? 'text-red-800' : 'text-yellow-800'
                              } truncate`}
                              title={error.url}
                            >
                              {error.url.replace(/^https?:\/\/[^/]+/, '')}
                            </p>
                            <p
                              className={`text-xs ${
                                error.severity === 'ERROR' ? 'text-red-600' : 'text-yellow-600'
                              }`}
                            >
                              {error.error}
                            </p>
                          </div>
                        </div>

                        {/* Open URL */}
                        <a
                          href={error.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`ml-2 p-1 rounded hover:bg-white transition-colors ${
                            error.severity === 'ERROR'
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-yellow-600 hover:text-yellow-700'
                          }`}
                          title="Abrir URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>

                      {/* Error Message */}
                      <p
                        className={`text-xs ${
                          error.severity === 'ERROR' ? 'text-red-700' : 'text-yellow-700'
                        } mb-2`}
                      >
                        {error.message}
                      </p>

                      {/* Last Crawl */}
                      {error.lastCrawl && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Último crawl:{' '}
                            {new Date(error.lastCrawl).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Recommendations */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <p className="text-sm font-bold text-blue-800 mb-2">💡 Como corrigir erros comuns</p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
            <li>
              <span className="font-medium">Bloqueado por robots.txt:</span> Verifique se a URL não
              está bloqueada indevidamente
            </li>
            <li>
              <span className="font-medium">Noindex detectado:</span> Remova meta tags noindex de
              páginas que devem ser indexadas
            </li>
            <li>
              <span className="font-medium">404/Soft 404:</span> Corrija links quebrados ou
              implemente redirects 301
            </li>
            <li>
              <span className="font-medium">Mobile Usability:</span> Ajuste viewport, tamanho de
              fonte e espaçamento de elementos
            </li>
            <li>
              <span className="font-medium">Rich Results:</span> Valide structured data com o Rich
              Results Test
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
