'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ForecastChartProps {
  data: {
    currentMrr: number
    forecastNext30d: number | null
    forecastNext60d: number | null
    forecastNext90d: number | null
  } | null
  loading?: boolean
}

export function ForecastChart({ data, loading }: ForecastChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Receita</CardTitle>
          <CardDescription>
            Forecast de MRR para os próximos 30, 60 e 90 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!data || (!data.forecastNext30d && !data.forecastNext60d && !data.forecastNext90d)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Receita</CardTitle>
          <CardDescription>
            Forecast de MRR para os próximos 30, 60 e 90 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Previsão indisponível. Execute o cron job mensal para gerar forecasts.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Criar dados do gráfico com atual + previsões
  const chartData = [
    {
      period: 'Atual',
      type: 'actual',
      mrr: data.currentMrr,
      forecast: null,
    },
    {
      period: '+30 dias',
      type: 'forecast',
      mrr: null,
      forecast: data.forecastNext30d || data.currentMrr,
    },
    {
      period: '+60 dias',
      type: 'forecast',
      mrr: null,
      forecast: data.forecastNext60d || data.currentMrr,
    },
    {
      period: '+90 dias',
      type: 'forecast',
      mrr: null,
      forecast: data.forecastNext90d || data.currentMrr,
    },
  ]

  // Calcular crescimento previsto
  const growth30d = data.forecastNext30d
    ? ((data.forecastNext30d - data.currentMrr) / data.currentMrr) * 100
    : 0
  const growth90d = data.forecastNext90d
    ? ((data.forecastNext90d - data.currentMrr) / data.currentMrr) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previsão de Receita</CardTitle>
        <CardDescription>
          Forecast de MRR para os próximos 30, 60 e 90 dias
          {growth90d !== 0 && (
            <span
              className={
                growth90d > 0
                  ? 'ml-2 text-green-600 dark:text-green-400'
                  : 'ml-2 text-red-600 dark:text-red-400'
              }
            >
              ({growth90d > 0 ? '+' : ''}
              {growth90d.toFixed(1)}% em 90 dias)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="period"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) =>
                `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number | undefined) =>
                value
                  ? `R$ ${value.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : 'N/A'
              }
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="mrr"
              name="MRR Atual"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorActual)"
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="forecast"
              name="Previsão"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorForecast)"
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Métricas de crescimento */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">30 dias</p>
            <p className="text-lg font-semibold">
              {data.forecastNext30d
                ? `R$ ${data.forecastNext30d.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : 'N/A'}
            </p>
            {growth30d !== 0 && (
              <p
                className={
                  growth30d > 0
                    ? 'text-xs text-green-600 dark:text-green-400'
                    : 'text-xs text-red-600 dark:text-red-400'
                }
              >
                {growth30d > 0 ? '+' : ''}
                {growth30d.toFixed(1)}%
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">60 dias</p>
            <p className="text-lg font-semibold">
              {data.forecastNext60d
                ? `R$ ${data.forecastNext60d.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : 'N/A'}
            </p>
            {data.forecastNext60d && (
              <p
                className={
                  ((data.forecastNext60d - data.currentMrr) / data.currentMrr) * 100 > 0
                    ? 'text-xs text-green-600 dark:text-green-400'
                    : 'text-xs text-red-600 dark:text-red-400'
                }
              >
                {((data.forecastNext60d - data.currentMrr) / data.currentMrr) * 100 > 0
                  ? '+'
                  : ''}
                {(
                  ((data.forecastNext60d - data.currentMrr) / data.currentMrr) *
                  100
                ).toFixed(1)}
                %
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">90 dias</p>
            <p className="text-lg font-semibold">
              {data.forecastNext90d
                ? `R$ ${data.forecastNext90d.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : 'N/A'}
            </p>
            {growth90d !== 0 && (
              <p
                className={
                  growth90d > 0
                    ? 'text-xs text-green-600 dark:text-green-400'
                    : 'text-xs text-red-600 dark:text-red-400'
                }
              >
                {growth90d > 0 ? '+' : ''}
                {growth90d.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
