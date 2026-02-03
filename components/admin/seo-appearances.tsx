'use client'

import { SearchAppearanceData } from '@/lib/google-search-console'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Video, Smartphone, Eye, Zap, TrendingUp, Lightbulb } from 'lucide-react'

interface SEOSearchAppearancesProps {
  appearances: SearchAppearanceData[]
}

// Icon mapping for different appearance types
const APPEARANCE_ICONS: Record<string, any> = {
  'AMP_BLUE_LINK': Zap,
  'AMP_TOP_STORIES': Zap,
  'RICHCARD': Sparkles,
  'VIDEO': Video,
  'DISCOVERY': Eye,
  'WEB_LIGHT_RESULT': Smartphone,
  'ANDROID_APP': Smartphone,
  'RECIPE': Sparkles,
  'JOB_LISTING': Sparkles,
  'SPECIAL_ANNOUNCEMENT': TrendingUp,
}

// Color schemes for different types
const APPEARANCE_COLORS: Record<string, {
  bg: string
  border: string
  text: string
  icon: string
}> = {
  'VIDEO': {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
  },
  'RICHCARD': {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-600',
  },
  'AMP_BLUE_LINK': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
  },
  'DISCOVERY': {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
  },
  'default': {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-700',
    icon: 'text-slate-600',
  },
}

function getAppearanceConfig(type: string) {
  return {
    icon: APPEARANCE_ICONS[type] || Sparkles,
    colors: APPEARANCE_COLORS[type] || APPEARANCE_COLORS.default,
  }
}

export function SEOSearchAppearances({ appearances }: SEOSearchAppearancesProps) {
  const hasRichResults = appearances.length > 0

  // Calculate total from all appearances
  const totals = appearances.reduce(
    (acc, app) => ({
      clicks: acc.clicks + app.clicks,
      impressions: acc.impressions + app.impressions,
    }),
    { clicks: 0, impressions: 0 }
  )

  const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Search Appearances & Rich Results
            </CardTitle>
            <CardDescription className="text-slate-500">
              Como suas páginas aparecem nos resultados do Google
            </CardDescription>
          </div>

          {hasRichResults && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <div className="text-right">
                <p className="text-xs font-medium text-purple-600">Rich Results Ativos</p>
                <p className="text-sm font-bold text-purple-700">{appearances.length}</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasRichResults ? (
          // No rich results found
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Lightbulb className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">
              Nenhum Rich Result detectado
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Você ainda não tem páginas aparecendo com rich results (vídeos, rich cards, AMP, etc.) no Google.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-sm font-bold text-blue-800 mb-2">💡 Como adicionar Rich Results:</p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>Adicione structured data (schema.org) nas suas páginas</li>
                <li>Implemente VideoObject para vídeos</li>
                <li>Use Article schema para posts de blog</li>
                <li>Adicione FAQ schema para perguntas frequentes</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-3 mb-4 md:grid-cols-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-medium text-slate-600">Tipos de Aparência</p>
                </div>
                <p className="text-2xl font-bold text-purple-700">{appearances.length}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Rich results ativos
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-medium text-slate-600">Impressões Totais</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {totals.impressions.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Via rich results
                </p>
              </div>

              <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-medium text-slate-600">CTR Médio</p>
                </div>
                <p className="text-2xl font-bold text-green-700">{avgCTR.toFixed(2)}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  De rich results
                </p>
              </div>
            </div>

            {/* Appearances List */}
            <div className="space-y-3">
              {appearances.map((appearance, index) => {
                const config = getAppearanceConfig(appearance.type)
                const Icon = config.icon
                const colors = config.colors

                return (
                  <div
                    key={appearance.type}
                    className={`p-4 rounded-lg border-2 ${colors.border} ${colors.bg}`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon className={`h-5 w-5 ${colors.icon}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${colors.text}`}>
                            {appearance.typeName}
                          </p>
                          <p className="text-xs text-slate-500">{appearance.type}</p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Impressões</p>
                        <p className="text-sm font-bold text-slate-900">
                          {appearance.impressions.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Cliques</p>
                        <p className="text-sm font-bold text-green-600">
                          {appearance.clicks.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">CTR</p>
                        <p className="text-sm font-bold text-purple-600">
                          {appearance.ctr.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Posição</p>
                        <p className="text-sm font-bold text-slate-700">
                          {appearance.position.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Top Queries */}
                    {appearance.topQueries.length > 0 && (
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">
                          Top Queries neste formato:
                        </p>
                        <div className="space-y-1">
                          {appearance.topQueries.slice(0, 3).map((query, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-white/50 px-2 py-1 rounded"
                            >
                              <span className="text-slate-700 truncate max-w-[200px]">
                                {query.query}
                              </span>
                              <span className="text-green-600 font-medium">
                                {query.clicks} cliques
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Insight Card */}
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <p className="text-sm font-bold text-amber-800 mb-2">
                💡 Oportunidade de Otimização
              </p>
              <p className="text-xs text-amber-700">
                Rich results geralmente têm CTR 2-3x maior que resultados normais. Considere adicionar
                structured data (schema.org) em mais páginas para aumentar visibilidade e cliques.
              </p>
              {appearances.length < 3 && (
                <p className="text-xs text-amber-600 mt-2">
                  <span className="font-medium">Dica:</span> Você pode adicionar mais tipos de rich results como
                  VideoObject, FAQ, HowTo, Product, Review, etc.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
