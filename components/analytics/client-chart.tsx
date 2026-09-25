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
    const company: string | undefined = payload[0]?.payload?.company
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-md max-w-[220px]">
        <p className="text-sm font-semibold text-white leading-tight">{label}</p>
        {company && (
          <p className="text-xs text-zinc-500 mt-0.5 mb-2">{company}</p>
        )}
        {!company && <div className="mb-2" />}
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            {entry.dataKey === 'value' ? (
              <p className="text-sm font-mono text-zinc-300">
                {Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            ) : (
              <p className="text-sm text-zinc-300">{entry.value} negócio(s)</p>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface ClientChartProps {
  data: {
    name: string;
    value: number;
    count: number;
    company?: string;
  }[];
}

export function ClientChart({ data }: ClientChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-xl border border-dashed border-white/5 bg-white/[0.02]">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <p>Nenhum negócio com cliente associado</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={data} margin={{ top: 20, right: 40, bottom: 60, left: 10 }}>
        <defs>
          <linearGradient id="clientBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-amber-500)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--color-amber-600)" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />

        <XAxis
          dataKey="name"
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', textAnchor: 'end' }}
          angle={-35}
          dy={6}
          dx={-4}
          interval={0}
          tickFormatter={(v: string) => v.length > 20 ? `${v.slice(0, 20)}…` : v}
        />

        <YAxis
          yAxisId="value"
          orientation="left"
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          tick={{ fill: 'var(--muted-foreground)' }}
          width={55}
        />

        <YAxis
          yAxisId="count"
          orientation="right"
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tick={{ fill: 'var(--muted-foreground)' }}
          width={30}
        />

        <Tooltip cursor={{ fill: 'var(--muted)' }} content={<CustomTooltip />} />

        <Legend
          formatter={(value) => value === 'value' ? 'Valor (R$)' : 'Qtd. Negócios'}
          wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)', paddingTop: 12 }}
        />

        <Bar
          yAxisId="value"
          dataKey="value"
          fill="url(#clientBarGradient)"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
          animationDuration={1200}
          name="value"
        />

        <Line
          yAxisId="count"
          type="monotone"
          dataKey="count"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--chart-1)', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          animationDuration={1200}
          name="count"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
