'use client';

import {
  Bar,
  Line,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-md">
        <p className="mb-2 text-sm font-semibold text-white">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.dataKey === 'count' ? (
              <p className="text-sm text-zinc-300">{entry.value} negócio(s)</p>
            ) : (
              <p className="text-sm font-mono text-zinc-300">
                {Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface MonthlyChartProps {
  data: {
    label: string;
    value: number;
    count: number;
    closingsValue?: number;
  }[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-xl border border-dashed border-white/5 bg-white/[0.02]">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const hasClosings = data.some(d => (d.closingsValue ?? 0) > 0)

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="monthlyBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient id="closingsBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />

        <XAxis
          dataKey="label"
          stroke="#71717a"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#71717a' }}
          dy={10}
        />

        <YAxis
          yAxisId="value"
          orientation="left"
          stroke="#71717a"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          tick={{ fill: '#71717a' }}
          width={50}
        />

        <YAxis
          yAxisId="count"
          orientation="right"
          stroke="#71717a"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fill: '#71717a' }}
          width={30}
        />

        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />

        <Legend
          formatter={(value) => {
            if (value === 'value') return 'Pipeline (R$)'
            if (value === 'closingsValue') return 'Receita Real (R$)'
            return 'Qtd. Negócios'
          }}
          wrapperStyle={{ fontSize: 12, color: '#71717a', paddingTop: 12 }}
        />

        <Bar
          yAxisId="value"
          dataKey="value"
          fill="url(#monthlyBarGradient)"
          radius={[6, 6, 0, 0]}
          maxBarSize={hasClosings ? 32 : 48}
          animationDuration={1200}
          name="value"
        />

        {hasClosings && (
          <Bar
            yAxisId="value"
            dataKey="closingsValue"
            fill="url(#closingsBarGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            animationDuration={1200}
            name="closingsValue"
          />
        )}

        <Line
          yAxisId="count"
          type="monotone"
          dataKey="count"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          animationDuration={1200}
          name="count"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
