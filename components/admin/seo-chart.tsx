'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface ChartDataPoint {
  date: string
  formattedDate: string
  clicks?: number
  impressions?: number
  predictedClicks?: number
  predictedImpressions?: number
  predictedClicksFromEfficiency?: number
}

interface SEOChartProps {
  data: ChartDataPoint[]
  showForecast?: boolean
}

export function SEOMetricsChart({ data, showForecast = false }: SEOChartProps) {
  // Find the index where forecast starts (first point with only predictedClicks)
  const forecastStartIndex = data.findIndex(
    (item) => item.clicks === undefined && item.predictedClicks !== undefined
  )

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          interval="preserveStartEnd"
          tickLine={{ stroke: 'var(--muted)' }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          tickLine={{ stroke: 'var(--muted)' }}
          label={{
            value: 'Cliques',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: 'var(--color-green-500)', fontSize: 12 },
          }}
        />
        {data.some((d) => d.impressions !== undefined) && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickLine={{ stroke: 'var(--muted)' }}
            label={{
              value: 'Impressoes',
              angle: 90,
              position: 'insideRight',
              style: { textAnchor: 'middle', fill: 'var(--chart-1)', fontSize: 12 },
            }}
          />
        )}

        {/* Reference line to mark where forecast starts */}
        {showForecast && forecastStartIndex > 0 && (
          <ReferenceLine
            x={data[forecastStartIndex - 1]?.formattedDate}
            yAxisId="left"
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            label={{
              value: 'Hoje',
              position: 'top',
              fill: 'var(--muted-foreground)',
              fontSize: 10,
            }}
          />
        )}

        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            borderColor: 'var(--muted)',
            borderRadius: '8px',
            boxShadow: 'none',
          }}
          labelStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
          formatter={(value, name) => {
            let label: string
            switch (name) {
              case 'clicks':
                label = 'Cliques (Real)'
                break
              case 'impressions':
                label = 'Impressoes (Real)'
                break
              case 'predictedClicks':
                label = 'Cliques (Previsao Direta)'
                break
              case 'predictedImpressions':
                label = 'Impressoes (Previsao)'
                break
              case 'predictedClicksFromEfficiency':
                label = 'Cliques (via Eficiencia)'
                break
              default:
                label = String(name)
            }
            const numValue = typeof value === 'number' ? value : 0
            return [numValue.toLocaleString('pt-BR'), label]
          }}
          labelFormatter={(label) => `Data: ${label}`}
        />
        <Legend
          formatter={(value) => {
            switch (value) {
              case 'clicks':
                return 'Cliques (Real)'
              case 'impressions':
                return 'Impressoes (Real)'
              case 'predictedClicks':
                return 'Cliques ML Direta'
              case 'predictedImpressions':
                return 'Impressoes (Previsao IA)'
              case 'predictedClicksFromEfficiency':
                return 'Cliques via Eficiencia'
              default:
                return value
            }
          }}
        />

        {/* Historical clicks line */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="clicks"
          stroke="var(--color-green-500)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          connectNulls={false}
        />

        {/* Historical impressions line */}
        {data.some((d) => d.impressions !== undefined) && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="impressions"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        )}

        {/* Forecast lines (dashed) */}
        {showForecast && (
          <>
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="predictedClicks"
              stroke="var(--muted-foreground)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--muted-foreground)' }}
              connectNulls={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="predictedClicksFromEfficiency"
              stroke="var(--color-amber-500)"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-amber-500)' }}
              connectNulls={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="predictedImpressions"
              stroke="var(--chart-5)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--chart-5)' }}
              connectNulls={false}
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
