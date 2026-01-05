'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RevenueTrendChartProps {
  data: Array<{
    date: Date
    month: number
    year: number
    mrr: number
    arr: number
  }>
  loading?: boolean
}

export function RevenueTrendChart({ data, loading }: RevenueTrendChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Receita (MRR/ARR)</CardTitle>
          <CardDescription>
            Evolução da receita recorrente mensal e anual
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
          <CardTitle>Tendência de Receita (MRR/ARR)</CardTitle>
          <CardDescription>
            Evolução da receita recorrente mensal e anual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Nenhum snapshot de receita disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  // Formatar dados para o gráfico
  const chartData = data.map((item) => ({
    month: `${item.month.toString().padStart(2, '0')}/${item.year}`,
    mrr: item.mrr,
    arr: item.arr / 12, // Dividir por 12 para mostrar no mesmo eixo que MRR
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Receita (MRR/ARR)</CardTitle>
        <CardDescription>
          Evolução da receita recorrente mensal e anual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
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
              name="MRR"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMrr)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface OrganizationDistributionChartProps {
  data: {
    freeOrganizations: number
    proOrganizations: number
  }
  loading?: boolean
}

export function OrganizationDistributionChart({
  data,
  loading,
}: OrganizationDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Organizações</CardTitle>
          <CardDescription>Free vs PRO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const chartData = [
    { name: 'FREE', value: data.freeOrganizations, color: '#94a3b8' },
    { name: 'PRO', value: data.proOrganizations, color: '#3b82f6' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Organizações</CardTitle>
        <CardDescription>Free vs PRO</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value} (${((entry.value / (data.freeOrganizations + data.proOrganizations)) * 100).toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface NewOrganizationsChartProps {
  data: Array<{
    month: number
    year: number
    newOrganizations: number
  }>
  loading?: boolean
}

export function NewOrganizationsChart({ data, loading }: NewOrganizationsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Novas Organizações</CardTitle>
          <CardDescription>Novas signups por mês</CardDescription>
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
          <CardTitle>Novas Organizações</CardTitle>
          <CardDescription>Novas signups por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    month: `${item.month.toString().padStart(2, '0')}/${item.year}`,
    signups: item.newOrganizations,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novas Organizações</CardTitle>
        <CardDescription>Novas signups por mês</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
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
            <Bar dataKey="signups" name="Novas Organizações" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
