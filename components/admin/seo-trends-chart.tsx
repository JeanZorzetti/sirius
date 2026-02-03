'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Lightbulb,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { InterestOverTimeData } from '@/lib/google-trends'

interface SEOTrendsChartProps {
  trendsData: InterestOverTimeData[]
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
]

function getTrendIcon(trend: 'rising' | 'falling' | 'stable') {
  switch (trend) {
    case 'rising':
      return TrendingUp
    case 'falling':
      return TrendingDown
    default:
      return Minus
  }
}

function getTrendColor(trend: 'rising' | 'falling' | 'stable'): string {
  switch (trend) {
    case 'rising':
      return 'text-green-600'
    case 'falling':
      return 'text-red-600'
    default:
      return 'text-slate-600'
  }
}

function getTrendBgColor(trend: 'rising' | 'falling' | 'stable'): string {
  switch (trend) {
    case 'rising':
      return 'bg-green-50 border-green-200'
    case 'falling':
      return 'bg-red-50 border-red-200'
    default:
      return 'bg-slate-50 border-slate-200'
  }
}

function getTrendLabel(trend: 'rising' | 'falling' | 'stable'): string {
  switch (trend) {
    case 'rising':
      return 'Em Alta'
    case 'falling':
      return 'Em Queda'
    default:
      return 'Estável'
  }
}

export function SEOTrendsChart({ trendsData }: SEOTrendsChartProps) {
  if (!trendsData || trendsData.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Tendências de Busca
          </CardTitle>
          <CardDescription className="text-slate-500">
            Interesse ao longo do tempo via Google Trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Lightbulb className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-700 font-medium mb-2">Nenhuma keyword configurada</p>
            <p className="text-sm text-slate-500">
              Configure keywords para monitorar tendências de busca
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Combinar dados de múltiplas keywords em um único dataset
  const combinedData = trendsData[0].data.map((point, index) => {
    const dataPoint: any = {
      time: point.formattedTime,
      fullTime: point.time,
    }

    trendsData.forEach((trend) => {
      dataPoint[trend.keyword] = trend.data[index]?.value || 0
    })

    return dataPoint
  })

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Tendências de Busca
        </CardTitle>
        <CardDescription className="text-slate-500">
          Interesse ao longo do tempo (últimos 12 meses) • Dados: Google Trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Keywords Summary Cards */}
        <div className="grid gap-3 mb-6 md:grid-cols-2 lg:grid-cols-3">
          {trendsData.map((trend, index) => {
            const TrendIcon = getTrendIcon(trend.trend)
            const trendColor = getTrendColor(trend.trend)
            const trendBg = getTrendBgColor(trend.trend)

            return (
              <div
                key={trend.keyword}
                className={`p-4 rounded-lg border-2 ${trendBg}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                      {trend.keyword}
                    </span>
                  </div>
                  <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <p className="text-xs text-slate-500">Média</p>
                    <p className="text-lg font-bold text-slate-900">{trend.averageInterest}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pico</p>
                    <p className="text-lg font-bold text-blue-600">{trend.peakValue}</p>
                  </div>
                </div>

                {/* Trend Label */}
                <div className={`text-xs font-medium ${trendColor}`}>
                  {getTrendLabel(trend.trend)}
                </div>

                {/* Peak Date */}
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>Pico em {new Date(trend.peakDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Line Chart */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
                label={{
                  value: 'Interesse (0-100)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#64748b' }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {trendsData.map((trend, index) => (
                <Line
                  key={trend.keyword}
                  type="monotone"
                  dataKey={trend.keyword}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights & Recommendations */}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {/* Rising Keywords */}
          {trendsData.filter(t => t.trend === 'rising').length > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-sm font-bold text-green-800">Keywords em Alta</p>
              </div>
              <ul className="space-y-1">
                {trendsData
                  .filter(t => t.trend === 'rising')
                  .map(t => (
                    <li key={t.keyword} className="text-xs text-green-700">
                      <span className="font-medium">{t.keyword}</span> - Crescimento detectado
                    </li>
                  ))}
              </ul>
              <p className="text-xs text-green-600 mt-2">
                💡 Priorize conteúdo para essas keywords
              </p>
            </div>
          )}

          {/* Falling Keywords */}
          {trendsData.filter(t => t.trend === 'falling').length > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-bold text-orange-800">Keywords em Queda</p>
              </div>
              <ul className="space-y-1">
                {trendsData
                  .filter(t => t.trend === 'falling')
                  .map(t => (
                    <li key={t.keyword} className="text-xs text-orange-700">
                      <span className="font-medium">{t.keyword}</span> - Interesse diminuindo
                    </li>
                  ))}
              </ul>
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Considere diversificar ou atualizar conteúdo
              </p>
            </div>
          )}

          {/* Stable Keywords */}
          {trendsData.filter(t => t.trend === 'stable').length > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-bold text-blue-800">Keywords Estáveis</p>
              </div>
              <ul className="space-y-1">
                {trendsData
                  .filter(t => t.trend === 'stable')
                  .map(t => (
                    <li key={t.keyword} className="text-xs text-blue-700">
                      <span className="font-medium">{t.keyword}</span> - Demanda consistente
                    </li>
                  ))}
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                ✅ Continue otimizando para manter posições
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
