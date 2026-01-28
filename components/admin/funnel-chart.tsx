'use client'

import { FunnelMetrics } from '@/lib/analytics/funnel-service'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

interface FunnelChartProps {
  metrics: FunnelMetrics
}

export function FunnelChart({ metrics }: FunnelChartProps) {
  // Preparar dados para o gráfico
  const chartData = [
    {
      name: 'Impressões',
      value: metrics.stages.impressions.value,
      conversionRate: null,
      color: '#3B82F6', // blue-500
    },
    {
      name: 'Cliques',
      value: metrics.stages.clicks.value,
      conversionRate: metrics.stages.clicks.conversionRate,
      dropOffRate: metrics.stages.clicks.dropOffRate,
      color: '#6366F1', // indigo-500
    },
    {
      name: 'Cadastros',
      value: metrics.stages.signups.value,
      conversionRate: metrics.stages.signups.conversionRate,
      dropOffRate: metrics.stages.signups.dropOffRate,
      color: '#8B5CF6', // violet-500
    },
    {
      name: 'Ativados',
      value: metrics.stages.activated.value,
      conversionRate: metrics.stages.activated.conversionRate,
      dropOffRate: metrics.stages.activated.dropOffRate,
      color: '#A855F7', // purple-500
    },
    {
      name: 'Engajados',
      value: metrics.stages.hitLimit.value,
      conversionRate: metrics.stages.hitLimit.conversionRate,
      dropOffRate: metrics.stages.hitLimit.dropOffRate,
      color: '#D946EF', // fuchsia-500
    },
    {
      name: 'Pagantes',
      value: metrics.stages.customers.value,
      conversionRate: metrics.stages.customers.conversionRate,
      dropOffRate: metrics.stages.customers.dropOffRate,
      color: '#10B981', // green-500
    },
  ]

  // Encontrar o maior drop-off (bottleneck)
  const bottleneckIndex = chartData.reduce((maxIdx, item, idx, arr) => {
    if (idx === 0) return maxIdx
    return (item.dropOffRate || 0) > (arr[maxIdx].dropOffRate || 0) ? idx : maxIdx
  }, 1)

  return (
    <div className="space-y-6">
      {/* Gráfico de barras horizontais */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 80, left: 120, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
            }
          />
          <YAxis type="category" dataKey="name" width={100} />
          <Tooltip
            content={({ payload }) => {
              if (!payload || !payload.length) return null
              const data = payload[0].payload
              return (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
                  <p className="font-semibold mb-2">{data.name}</p>
                  <p className="text-2xl font-bold mb-2">
                    {data.value.toLocaleString('pt-BR')}
                  </p>
                  {data.conversionRate !== null && (
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        Conversão: {data.conversionRate.toFixed(2)}%
                      </p>
                      <p className="flex items-center gap-2 text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        Perdido: {data.dropOffRate?.toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>
              )
            }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={index === bottleneckIndex ? 0.6 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legenda com métricas detalhadas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {chartData.map((stage, index) => {
          const isBottleneck = index === bottleneckIndex
          return (
            <div
              key={stage.name}
              className={`p-4 rounded-lg border ${
                isBottleneck
                  ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'
                  : 'bg-gray-50 dark:bg-gray-900'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {stage.name}
                </p>
                {isBottleneck && <AlertTriangle className="h-3 w-3 text-red-500" />}
              </div>
              <p className="text-xl font-bold mb-1">
                {stage.value.toLocaleString('pt-BR')}
              </p>
              {stage.conversionRate !== null && stage.conversionRate !== undefined && (
                <p className="text-xs text-gray-500">
                  {stage.conversionRate.toFixed(1)}% converteram
                </p>
              )}
              {isBottleneck && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
                  Gargalo
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Conversão global */}
      <div className="flex items-center justify-center p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-lg border">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Conversão Global (Impressão → Pagante)
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {metrics.globalConversion.toFixed(3)}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Benchmark SaaS B2B: ~0.05% - 0.1%
          </p>
        </div>
      </div>
    </div>
  )
}
