'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Brain,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts'
import {
  PERIOD_CONFIGS,
  calculatePeriodRanges,
  comparePeriods,
  type PeriodRange,
  type PeriodComparisonResult,
} from '@/lib/period-comparison'
import { cn } from '@/lib/utils'

interface PeriodComparatorProps {
  historyData: {
    date: string
    clicks: number
    impressions: number
    position: number
  }[]
}

export function PeriodComparator({ historyData }: PeriodComparatorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodRange>('28d')
  const [matchDayOfWeek, setMatchDayOfWeek] = useState(true)
  const [showForecast, setShowForecast] = useState(true)

  // Calculate comparison result
  const comparisonResult = useMemo<PeriodComparisonResult | null>(() => {
    if (!historyData || historyData.length === 0) return null

    // Parse dates and sort
    const parsedData = historyData
      .map(d => ({
        date: new Date(d.date),
        clicks: d.clicks,
        impressions: d.impressions,
        position: d.position,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Calculate period ranges
    const endDate = parsedData[parsedData.length - 1].date
    const periods = calculatePeriodRanges(endDate, selectedPeriod, matchDayOfWeek)

    // Filter data for each period
    const baseData = parsedData.filter(
      d => d.date >= periods.base.start && d.date <= periods.base.end
    )
    const comparisonData = parsedData.filter(
      d => d.date >= periods.comparison.start && d.date <= periods.comparison.end
    )

    if (baseData.length === 0 || comparisonData.length === 0) return null

    return comparePeriods(baseData, comparisonData, periods)
  }, [historyData, selectedPeriod, matchDayOfWeek])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!comparisonResult) return []

    const basePoints = comparisonResult.periods.base.label.split(' - ')
    const compPoints = comparisonResult.periods.comparison.label.split(' - ')

    return [
      {
        name: 'Periodo Anterior',
        period: compPoints[0] + ' a ' + compPoints[1],
        cliques: Math.round(comparisonResult.metrics.clicks.comparisonMean),
        impressoes: Math.round(comparisonResult.metrics.impressions.comparisonMean),
        ctr: parseFloat(comparisonResult.metrics.ctr.comparisonMean.toFixed(2)),
      },
      {
        name: 'Periodo Atual',
        period: basePoints[0] + ' a ' + basePoints[1],
        cliques: Math.round(comparisonResult.metrics.clicks.baseMean),
        impressoes: Math.round(comparisonResult.metrics.impressions.baseMean),
        ctr: parseFloat(comparisonResult.metrics.ctr.baseMean.toFixed(2)),
      },
    ]
  }, [comparisonResult])

  // Forecast chart data
  const forecastData = useMemo(() => {
    if (!comparisonResult || !showForecast) return []

    return comparisonResult.forecast.map(f => ({
      date: f.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      predito: Math.round(f.predicted),
      minimo: Math.round(f.lowerBound),
      maximo: Math.round(f.upperBound),
    }))
  }, [comparisonResult, showForecast])

  if (!comparisonResult) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Comparador de Periodos ML
          </CardTitle>
          <CardDescription className="text-slate-500">
            Dados insuficientes para comparacao
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { metrics, anomalies, insights, recommendation } = comparisonResult
  const hasAnomalies = anomalies.base.length > 0 || anomalies.comparison.length > 0

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-slate-900">Comparador de Periodos ML</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Brain className="h-3 w-3 mr-1" />
              ML Ativo
            </Badge>
          </div>
          <CardDescription className="text-slate-500">
            Compare periodos com analise estatistica e deteccao de anomalias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodRange)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_CONFIGS.map((config) => (
                    <SelectItem key={config.value} value={config.value}>
                      <div className="flex flex-col">
                        <span>{config.label}</span>
                        <span className="text-xs text-slate-400">{config.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="match-day"
                checked={matchDayOfWeek}
                onCheckedChange={setMatchDayOfWeek}
              />
              <Label htmlFor="match-day" className="text-sm text-slate-600">
                Match day-of-week
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-forecast"
                checked={showForecast}
                onCheckedChange={setShowForecast}
              />
              <Label htmlFor="show-forecast" className="text-sm text-slate-600">
                Mostrar forecast
              </Label>
            </div>
          </div>

          {/* Period Labels */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 text-sm">
            <div className="flex-1 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-blue-600 font-medium">Periodo Atual:</span>
              <span className="ml-2 text-slate-700">{comparisonResult.periods.base.label}</span>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-slate-400 hidden sm:block" />
            </div>
            <div className="flex-1 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600 font-medium">Periodo Anterior:</span>
              <span className="ml-2 text-slate-700">{comparisonResult.periods.comparison.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistical Results */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Cliques"
          metric={metrics.clicks}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Impressoes"
          metric={metrics.impressions}
          icon={BarChart}
          color="blue"
        />
        <StatCard
          title="CTR"
          metric={metrics.ctr}
          icon={CheckCircle2}
          color="purple"
          isPercentage
        />
        <StatCard
          title="Posicao Media"
          metric={metrics.position}
          icon={Minus}
          color="orange"
          inverse // Lower is better for position
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Comparison Bar Chart */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Comparacao de Periodos</CardTitle>
            <CardDescription className="text-slate-500">
              Media diaria de cliques e impressoes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ReBarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                />
                <Bar
                  yAxisId="left"
                  dataKey="cliques"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Cliques"
                />
                <Bar
                  yAxisId="right"
                  dataKey="impressoes"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Impressoes"
                />
              </ReBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Forecast Chart */}
        {showForecast && forecastData.length > 0 && (
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Forecast ML (7 dias)
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Predicao baseada em regressao linear
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                  />
                  <Line
                    type="monotone"
                    dataKey="predito"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                    name="Predito"
                  />
                  <Line
                    type="monotone"
                    dataKey="minimo"
                    stroke="#c4b5fd"
                    strokeDasharray="5 5"
                    dot={false}
                    name="Minimo (95%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="maximo"
                    stroke="#c4b5fd"
                    strokeDasharray="5 5"
                    dot={false}
                    name="Maximo (95%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ML Insights */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-slate-900">Insights do ML</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Insights List */}
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/50"
              >
                <span className="text-lg">{insight.split(' ')[0]}</span>
                <p className="text-sm text-slate-700">{insight.substring(3)}</p>
              </div>
            ))}
          </div>

          {/* Anomalies */}
          {hasAnomalies && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Anomalias Detectadas
                </span>
              </div>
              <div className="space-y-1">
                {anomalies.base.map((a, i) => (
                  <p key={`base-${i}`} className="text-xs text-amber-700">
                    • Periodo atual: {a.date.toLocaleDateString('pt-BR')} - {a.description}
                  </p>
                ))}
                {anomalies.comparison.map((a, i) => (
                  <p key={`comp-${i}`} className="text-xs text-amber-700">
                    • Periodo anterior: {a.date.toLocaleDateString('pt-BR')} - {a.description}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="p-3 rounded-lg bg-white border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-800">
                Recomendacao
              </span>
            </div>
            <p className="text-sm text-slate-600">{recommendation}</p>
          </div>

          {/* Statistical Summary */}
          <div className="pt-3 border-t border-purple-200">
            <p className="text-xs text-slate-500">
              <span className="font-medium">Metodologia:</span> Two-sample t-test | 
              <span className="font-medium"> Nivel de confianca:</span> 95% (p {'<'} 0.05) |
              <span className="font-medium"> Efeito:</span> {metrics.clicks.effectSizeLabel} (d = {metrics.clicks.effectSize.toFixed(2)})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  metric: {
    baseMean: number
    comparisonMean: number
    delta: number
    deltaPercent: number
    pValue: number
    isSignificant: boolean
    confidenceLevel: number
  }
  icon: React.ElementType
  color: 'green' | 'blue' | 'purple' | 'orange'
  isPercentage?: boolean
  inverse?: boolean
}

function StatCard({ title, metric, icon: Icon, color, isPercentage, inverse }: StatCardProps) {
  const isPositive = inverse ? metric.delta < 0 : metric.delta > 0
  const TrendIcon = metric.delta > 0 ? TrendingUp : metric.delta < 0 ? TrendingDown : Minus
  
  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: isPositive ? 'text-green-700' : 'text-red-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: isPositive ? 'text-blue-700' : 'text-slate-700',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      text: isPositive ? 'text-purple-700' : 'text-slate-700',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      text: isPositive ? 'text-orange-700' : 'text-slate-700',
    },
  }[color]

  const formatValue = (val: number) => {
    if (isPercentage) return `${val.toFixed(2)}%`
    return Math.round(val).toLocaleString('pt-BR')
  }

  return (
    <Card className={cn(
      'border-2 shadow-sm transition-all',
      colorClasses.border,
      colorClasses.bg,
      metric.isSignificant && 'ring-2 ring-offset-1',
      metric.isSignificant && isPositive && 'ring-green-400',
      metric.isSignificant && !isPositive && 'ring-red-400'
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', colorClasses.icon)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">
          {formatValue(metric.baseMean)}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <TrendIcon className={cn(
            'h-3 w-3',
            metric.delta > 0 ? 'text-green-600' : metric.delta < 0 ? 'text-red-600' : 'text-slate-400'
          )} />
          <span className={cn('text-xs font-medium', colorClasses.text)}>
            {metric.delta > 0 ? '+' : ''}{metric.deltaPercent.toFixed(1)}%
          </span>
          {metric.isSignificant ? (
            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-0.5" />
              {metric.confidenceLevel.toFixed(0)}%
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600 border-slate-300">
              NS
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          p = {metric.pValue.toFixed(3)}
        </p>
      </CardContent>
    </Card>
  )
}
