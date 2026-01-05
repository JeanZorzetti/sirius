'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PipelineTrendChartProps {
  data: Array<{
    date: Date
    totalDeals: number
    totalValue: number
    dealsCreated: number
    dealsClosed: number
  }>
  loading?: boolean
}

export function PipelineTrendChart({ data, loading }: PipelineTrendChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência do Pipeline</CardTitle>
          <CardDescription>
            Evolução de deals e valor total ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência do Pipeline</CardTitle>
          <CardDescription>
            Evolução de deals e valor total ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    )
  }

  // Formatar dados para o gráfico
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
    deals: item.totalDeals,
    valor: item.totalValue,
    criados: item.dealsCreated,
    fechados: item.dealsClosed,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência do Pipeline</CardTitle>
        <CardDescription>
          Evolução de deals e valor total ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="deals"
              name="Total de Deals"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line
              type="monotone"
              dataKey="criados"
              name="Criados"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e' }}
            />
            <Line
              type="monotone"
              dataKey="fechados"
              name="Fechados"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
