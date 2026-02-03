'use client'

import { SEOCountryData } from '@/lib/google-search-console'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, TrendingUp, MapPin } from 'lucide-react'

interface SEOCountryTableProps {
  countries: SEOCountryData[]
}

// Country code to flag emoji mapping
const COUNTRY_FLAGS: Record<string, string> = {
  bra: '🇧🇷',
  usa: '🇺🇸',
  prt: '🇵🇹',
  arg: '🇦🇷',
  mex: '🇲🇽',
  chl: '🇨🇱',
  col: '🇨🇴',
  per: '🇵🇪',
  ury: '🇺🇾',
  esp: '🇪🇸',
  gbr: '🇬🇧',
  fra: '🇫🇷',
  deu: '🇩🇪',
  ita: '🇮🇹',
  can: '🇨🇦',
  aus: '🇦🇺',
  jpn: '🇯🇵',
  chn: '🇨🇳',
  ind: '🇮🇳',
  rus: '🇷🇺',
}

function getFlag(countryCode: string): string {
  return COUNTRY_FLAGS[countryCode.toLowerCase()] || '🌐'
}

export function SEOCountryTable({ countries }: SEOCountryTableProps) {
  // Calculate total clicks for percentages
  const totalClicks = countries.reduce((sum, c) => sum + c.clicks, 0)

  // Top country (usually Brazil)
  const topCountry = countries[0]

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Globe className="h-5 w-5 text-blue-600" />
              Breakdown Geográfico
            </CardTitle>
            <CardDescription className="text-slate-500">
              Top 20 países por tráfego orgânico
            </CardDescription>
          </div>

          {topCountry && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
              <span className="text-2xl">{getFlag(topCountry.country)}</span>
              <div className="text-right">
                <p className="text-xs font-medium text-blue-600">Top País</p>
                <p className="text-sm font-bold text-blue-700">
                  {((topCountry.clicks / totalClicks) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid gap-3 mb-4 md:grid-cols-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-medium text-slate-600">Países Ativos</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{countries.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              Com tráfego no período
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs font-medium text-slate-600">CTR Médio Global</p>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {(countries.reduce((sum, c) => sum + c.ctr, 0) / countries.length).toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Média ponderada
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-medium text-slate-600">Posição Média Global</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {(
                countries.reduce((sum, c) => sum + c.position, 0) / countries.length
              ).toFixed(1)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Ranking médio
            </p>
          </div>
        </div>

        {/* Countries Table */}
        <div className="space-y-2">
          {countries.map((country, index) => {
            const percentage = (country.clicks / totalClicks) * 100
            const isTopCountry = index === 0

            return (
              <div
                key={country.country}
                className={`p-4 rounded-lg border transition-all ${
                  isTopCountry
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-sm'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Country Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-xs font-bold text-slate-400 w-5">
                        #{index + 1}
                      </span>
                      <span className="text-2xl">{getFlag(country.country)}</span>
                      <span
                        className={`text-sm font-medium ${
                          isTopCountry ? 'text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        {country.countryName}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 max-w-[200px]">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isTopCountry ? 'bg-blue-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {percentage.toFixed(1)}% do tráfego
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-right">
                      <p className="font-medium text-slate-500">Cliques</p>
                      <p className="text-sm font-bold text-green-600">
                        {country.clicks.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-500">Impressões</p>
                      <p className="text-sm font-bold text-slate-700">
                        {country.impressions.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-500">CTR</p>
                      <p className="text-sm font-bold text-purple-600">
                        {country.ctr.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-500">Posição</p>
                      <p className="text-sm font-bold text-slate-700">
                        {country.position.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Insight Card */}
        {countries.length > 1 && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <p className="text-sm font-bold text-amber-800 mb-2">
              💡 Oportunidade de Expansão Internacional
            </p>
            <p className="text-xs text-amber-700">
              {countries.slice(1, 4).filter(c => c.clicks > 10).length > 0 ? (
                <>
                  Países com potencial de crescimento:{' '}
                  <span className="font-bold">
                    {countries
                      .slice(1, 4)
                      .filter(c => c.clicks > 10)
                      .map(c => c.countryName)
                      .join(', ')}
                  </span>
                  . Considere criar conteúdo localizado ou campanhas específicas para essas regiões.
                </>
              ) : (
                <>
                  O tráfego está altamente concentrado em {topCountry.countryName} (
                  {((topCountry.clicks / totalClicks) * 100).toFixed(0)}%). Considere estratégias
                  de expansão internacional para diversificar fontes de tráfego.
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
