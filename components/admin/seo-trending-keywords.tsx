'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Flame,
  TrendingUp,
  ExternalLink,
  Sparkles,
  Target,
  Zap,
  FileText,
} from 'lucide-react'
import type { RelatedQueriesData, TrendingSearchesData } from '@/lib/google-trends'

interface SEOTrendingKeywordsProps {
  relatedQueries: RelatedQueriesData[]
  trendingSearches?: TrendingSearchesData | null
}

export function SEOTrendingKeywords({ relatedQueries, trendingSearches }: SEOTrendingKeywordsProps) {
  const hasRelatedQueries = relatedQueries && relatedQueries.length > 0
  const hasTrendingSearches = trendingSearches && trendingSearches.trending.length > 0

  if (!hasRelatedQueries && !hasTrendingSearches) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Flame className="h-5 w-5 text-orange-600" />
            Keywords em Alta
          </CardTitle>
          <CardDescription className="text-slate-500">
            Queries relacionadas e trending searches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Sparkles className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">Nenhum dado disponível</p>
            <p className="text-sm text-slate-500">
              Configure keywords para ver queries relacionadas e trending searches
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Related Queries */}
      {hasRelatedQueries && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Target className="h-5 w-5 text-blue-600" />
              Queries Relacionadas
            </CardTitle>
            <CardDescription className="text-slate-500">
              Top queries e queries em crescimento relacionadas às suas keywords
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {relatedQueries.map((queryData) => (
                <div key={queryData.keyword} className="space-y-4">
                  {/* Keyword Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <FileText className="h-4 w-4 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-900">{queryData.keyword}</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Queries */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-bold text-blue-800">Top Queries</h4>
                      </div>

                      <div className="space-y-2">
                        {queryData.top.slice(0, 5).map((query, index) => (
                          <div
                            key={query.query}
                            className="flex items-center justify-between p-2 rounded bg-white/50"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xs font-bold text-blue-400 w-5">
                                #{index + 1}
                              </span>
                              <a
                                href={query.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-700 hover:text-blue-600 flex items-center gap-1 truncate"
                              >
                                {query.query}
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>
                            <span className="text-xs font-medium text-blue-600 ml-2">
                              {query.formattedValue}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-blue-600 mt-3">
                        💡 Queries mais pesquisadas relacionadas
                      </p>
                    </div>

                    {/* Rising Queries */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame className="h-4 w-4 text-orange-600" />
                        <h4 className="text-sm font-bold text-orange-800">Rising Queries</h4>
                      </div>

                      <div className="space-y-2">
                        {queryData.rising.slice(0, 5).map((query, index) => (
                          <div
                            key={query.query}
                            className="flex items-center justify-between p-2 rounded bg-white/50"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <Zap className="h-3 w-3 text-orange-500 flex-shrink-0" />
                              <a
                                href={query.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-700 hover:text-orange-600 flex items-center gap-1 truncate"
                              >
                                {query.query}
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </div>
                            <span className="text-xs font-bold text-orange-600 ml-2">
                              {query.formattedValue}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-orange-600 mt-3">
                        🔥 Queries com maior crescimento - oportunidade!
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Searches */}
      {hasTrendingSearches && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Flame className="h-5 w-5 text-orange-600" />
                  Trending Searches
                </CardTitle>
                <CardDescription className="text-slate-500">
                  O que está sendo muito buscado agora no {trendingSearches.country === 'BR' ? 'Brasil' : trendingSearches.country}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Atualizado em</p>
                <p className="text-sm font-medium text-slate-700">
                  {new Date(trendingSearches.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {trendingSearches.trending.map((trending, index) => (
                <div
                  key={trending.title}
                  className="p-4 rounded-lg border-2 border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 hover:border-orange-200 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-orange-500">#{index + 1}</span>
                        <h3 className="text-sm font-bold text-slate-900">{trending.title}</h3>
                      </div>
                      <p className="text-xs text-orange-600 font-medium">
                        {trending.formattedTraffic}
                      </p>
                    </div>
                  </div>

                  {/* Related Queries */}
                  {trending.relatedQueries.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <p className="text-xs font-medium text-slate-600 mb-2">
                        Queries relacionadas:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {trending.relatedQueries.map((query) => (
                          <span
                            key={query}
                            className="px-2 py-1 text-xs bg-white/70 text-slate-700 rounded border border-orange-200"
                          >
                            {query}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Opportunities */}
      {hasRelatedQueries && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Sparkles className="h-5 w-5 text-green-600" />
              Oportunidades de Conteúdo
            </CardTitle>
            <CardDescription className="text-green-700">
              Sugestões baseadas em queries em alta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedQueries.map((queryData) => {
                const topRising = queryData.rising.slice(0, 3)

                return (
                  <div
                    key={queryData.keyword}
                    className="p-4 rounded-lg bg-white border border-green-200"
                  >
                    <h4 className="text-sm font-bold text-slate-900 mb-2">
                      Para "{queryData.keyword}":
                    </h4>
                    <ul className="space-y-2">
                      {topRising.map((query) => (
                        <li key={query.query} className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-slate-700">
                              Criar conteúdo sobre:{' '}
                              <span className="font-medium text-green-700">{query.query}</span>
                            </p>
                            <p className="text-xs text-slate-500">
                              Crescimento de {query.formattedValue} - alta demanda
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 p-3 rounded bg-green-100 border border-green-300">
              <p className="text-xs font-bold text-green-800 mb-1">
                💡 Dica de Estratégia
              </p>
              <p className="text-xs text-green-700">
                Priorize criar conteúdo para rising queries antes que a concorrência perceba.
                Essas keywords têm alta demanda e baixa competição agora.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
