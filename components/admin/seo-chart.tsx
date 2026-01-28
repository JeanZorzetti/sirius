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
          tick={{ fontSize: 11, fill: '#64748b' }}
          interval="preserveStartEnd"
          tickLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={{ stroke: '#e2e8f0' }}
          label={{
            value: 'Cliques',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#22c55e', fontSize: 12 },
          }}
        />
        {data.some((d) => d.impressions !== undefined) && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={{ stroke: '#e2e8f0' }}
            label={{
              value: 'Impressoes',
              angle: 90,
              position: 'insideRight',
              style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 12 },
            }}
          />
        )}

        {/* Reference line to mark where forecast starts */}
        {showForecast && forecastStartIndex > 0 && (
          <ReferenceLine
            x={data[forecastStartIndex - 1]?.formattedDate}
            yAxisId="left"
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{
              value: 'Hoje',
              position: 'top',
              fill: '#64748b',
              fontSize: 10,
            }}
          />
        )}

        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            borderColor: '#e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ color: '#1e293b', fontWeight: 500 }}
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
          stroke="#22c55e"
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
            stroke="#3b82f6"
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
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: '#94a3b8' }}
              connectNulls={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="predictedClicksFromEfficiency"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b' }}
              connectNulls={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="predictedImpressions"
              stroke="#60a5fa"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: '#60a5fa' }}
              connectNulls={false}
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
