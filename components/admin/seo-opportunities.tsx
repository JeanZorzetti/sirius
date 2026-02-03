'use client'

import { KeywordOpportunitiesData } from '@/lib/google-search-console'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Target,
  TrendingUp,
  AlertCircle,
  ArrowUp,
  Sparkles,
  FileText,
} from 'lucide-react'

interface SEOKeywordOpportunitiesProps {
  opportunities: KeywordOpportunitiesData
}

export function SEOKeywordOpportunities({ opportunities }: SEOKeywordOpportunitiesProps) {
  const { page2Keywords, lowCTRKeywords, totalPotential } = opportunities

  const hasOpportunities = page2Keywords.length > 0 || lowCTRKeywords.length > 0

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Target className="h-5 w-5 text-green-600" />
              Oportunidades de Keywords
            </CardTitle>
            <CardDescription className="text-slate-500">
              Quick wins para aumentar tráfego orgânico
            </CardDescription>
          </div>

          {totalPotential > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="text-right">
                <p className="text-xs font-medium text-green-600">Potencial Total</p>
                <p className="text-sm font-bold text-green-700">
                  +{totalPotential.toLocaleString('pt-BR')} cliques/mês
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasOpportunities ? (
          // No opportunities found
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Sparkles className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">
              Nenhuma oportunidade detectada no momento
            </p>
            <p className="text-sm text-slate-500">
              Suas keywords estão bem posicionadas ou não há dados suficientes ainda.
              Continue otimizando e volte em alguns dias!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Page 2 Keywords (Position 11-20) */}
            {page2Keywords.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ArrowUp className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Keywords na Página 2
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
                    {page2Keywords.length} keywords
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-4">
                  Keywords ranqueando entre posição 11-20. Com pequenas otimizações, podem subir para
                  a primeira página e gerar muito mais tráfego.
                </p>

                <div className="space-y-2">
                  {page2Keywords.slice(0, 10).map((keyword, index) => {
                    const gain = (keyword.potentialClicks || 0) - keyword.clicks

                    return (
                      <div
                        key={`page2-${index}`}
                        className="p-4 rounded-lg border-2 border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 hover:border-orange-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-orange-500">
                                #{Math.round(keyword.position)}
                              </span>
                              <p className="text-sm font-medium text-slate-900">
                                {keyword.query}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500">
                              Posição atual: {keyword.position.toFixed(1)} | CTR: {keyword.ctr.toFixed(2)}%
                            </p>
                          </div>

                          <div className="text-right ml-4">
                            <p className="text-xs text-slate-500">Ganho estimado</p>
                            <p className="text-lg font-bold text-green-600">
                              +{gain} cliques/mês
                            </p>
                          </div>
                        </div>

                        {/* Progress bar showing potential */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    ((keyword.clicks / (keyword.potentialClicks || 1)) * 100),
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {keyword.clicks} → {keyword.potentialClicks}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                          <span>{keyword.impressions.toLocaleString('pt-BR')} impressões</span>
                          <span>•</span>
                          <span>{keyword.clicks} cliques atuais</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {page2Keywords.length > 10 && (
                  <p className="text-xs text-slate-500 text-center mt-3">
                    +{page2Keywords.length - 10} keywords adicionais na página 2
                  </p>
                )}
              </div>
            )}

            {/* Low CTR Keywords */}
            {lowCTRKeywords.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Keywords com Baixo CTR
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
                    {lowCTRKeywords.length} keywords
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-4">
                  Keywords com alto volume de impressões mas CTR baixo (&lt;2%). Otimize title tags e meta
                  descriptions para melhorar taxa de cliques.
                </p>

                <div className="space-y-2">
                  {lowCTRKeywords.slice(0, 10).map((keyword, index) => {
                    const gain = (keyword.potentialClicks || 0) - keyword.clicks

                    return (
                      <div
                        key={`low-ctr-${index}`}
                        className="p-4 rounded-lg border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 hover:border-blue-200 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-blue-500">
                                Posição #{Math.round(keyword.position)}
                              </span>
                              <p className="text-sm font-medium text-slate-900">
                                {keyword.query}
                              </p>
                            </div>
                            {keyword.page && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                <FileText className="h-3 w-3" />
                                <span className="truncate max-w-[300px]">{keyword.page}</span>
                              </div>
                            )}
                            <p className="text-xs text-slate-500">
                              CTR atual: {keyword.ctr.toFixed(2)}% (abaixo da média)
                            </p>
                          </div>

                          <div className="text-right ml-4">
                            <p className="text-xs text-slate-500">Se melhorar para 3%</p>
                            <p className="text-lg font-bold text-green-600">
                              +{gain} cliques/mês
                            </p>
                          </div>
                        </div>

                        {/* CTR improvement indicator */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${Math.min((keyword.ctr / 3) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {keyword.ctr.toFixed(2)}% → 3%
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                          <span>{keyword.impressions.toLocaleString('pt-BR')} impressões</span>
                          <span>•</span>
                          <span>{keyword.clicks} cliques</span>
                          <span>•</span>
                          <span className="text-blue-600 font-medium">
                            Snippet precisa de melhoria
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {lowCTRKeywords.length > 10 && (
                  <p className="text-xs text-slate-500 text-center mt-3">
                    +{lowCTRKeywords.length - 10} keywords adicionais com baixo CTR
                  </p>
                )}
              </div>
            )}

            {/* Action Items */}
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <p className="text-sm font-bold text-green-800 mb-3">
                🎯 Plano de Ação Recomendado
              </p>

              {page2Keywords.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-green-700 mb-1">
                    Para Keywords na Página 2:
                  </p>
                  <ul className="text-xs text-green-700 space-y-1 ml-4 list-disc">
                    <li>Adicione links internos apontando para essas páginas</li>
                    <li>Melhore o conteúdo com mais profundidade e palavras-chave relacionadas</li>
                    <li>Otimize headings (H2, H3) com keywords</li>
                    <li>Aumente a autoridade com backlinks externos</li>
                  </ul>
                </div>
              )}

              {lowCTRKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-green-700 mb-1">
                    Para Keywords com Baixo CTR:
                  </p>
                  <ul className="text-xs text-green-700 space-y-1 ml-4 list-disc">
                    <li>Reescreva title tags para serem mais atraentes e incluir call-to-action</li>
                    <li>Otimize meta descriptions com benefícios claros</li>
                    <li>Adicione números, anos, ou palavras de ação nos títulos</li>
                    <li>Teste emojis nos títulos (quando apropriado)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
