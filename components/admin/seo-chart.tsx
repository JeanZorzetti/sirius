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
} from 'recharts'
import type { SEOHistoryItem } from '@/lib/google-search-console'

interface SEOChartProps {
  data: SEOHistoryItem[]
}

// Format date from YYYY-MM-DD to DD/MM
function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

export function SEOMetricsChart({ data }: SEOChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          label={{
            value: 'Cliques',
            angle: -90,
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#22c55e' },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          label={{
            value: 'Impressões',
            angle: 90,
            position: 'insideRight',
            style: { textAnchor: 'middle', fill: '#3b82f6' },
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
          formatter={(value, name) => {
            const label = name === 'clicks' ? 'Cliques' : 'Impressões'
            const numValue = typeof value === 'number' ? value : 0
            return [numValue.toLocaleString('pt-BR'), label]
          }}
          labelFormatter={(label) => `Data: ${label}`}
        />
        <Legend
          formatter={(value) => (value === 'clicks' ? 'Cliques' : 'Impressões')}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="clicks"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="impressions"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
