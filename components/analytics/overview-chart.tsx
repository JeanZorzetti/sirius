'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-md">
        <p className="mb-1 text-sm font-semibold text-white">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <p className="text-sm font-mono text-zinc-300">
            {Number(payload[0].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {payload[0].payload.count} negócios
        </p>
      </div>
    )
  }
  return null
}

interface OverviewChartProps {
  data: {
    name: string;
    count: number;
    value: number;
  }[];
}

export function OverviewChart({ data }: OverviewChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-dashed border-white/5 bg-white/[0.02]">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />

        <XAxis
          dataKey="name"
          stroke="#71717a"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#a1a1aa' }}
          dy={10}
        />

        <YAxis
          stroke="#71717a"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: any) => `R$${value / 1000}k`}
          tick={{ fill: '#a1a1aa' }}
          dx={-10}
        />

        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />

        <Bar
          dataKey="value"
          fill="url(#barGradient)"
          radius={[6, 6, 0, 0]}
          maxBarSize={60}
          animationDuration={1500}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
