'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

const COLORS = [
  'var(--chart-1)', 'var(--chart-5)', 'var(--chart-4)', 'var(--chart-3)',
  'var(--chart-1)', 'var(--chart-5)', 'var(--chart-4)', 'var(--foreground)',
  'var(--foreground)', 'var(--muted)',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const { count, company } = payload[0].payload;
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-md max-w-[220px]">
        <p className="text-sm font-semibold text-white leading-tight">{label}</p>
        {company && <p className="text-xs text-zinc-500 mt-0.5 mb-2">{company}</p>}
        {!company && <div className="mb-2" />}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
          <p className="text-sm font-mono text-zinc-300">
            {Number(payload[0].value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <p className="text-xs text-zinc-500 mt-1">{count} negócio(s) ativo(s)</p>
      </div>
    );
  }
  return null;
};

interface EstimatedValueChartProps {
  data: {
    name: string;
    value: number;
    count: number;
    company?: string;
  }[];
}

export function EstimatedValueChart({ data }: EstimatedValueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-xl border border-dashed border-white/5 bg-white/[0.02]">
        <p className="text-zinc-500 text-sm">Nenhum negócio ativo com cliente associado</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 60, left: 10 }}>
        <defs>
          {data.map((_, i) => (
            <linearGradient key={i} id={`estGrad${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
              <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.5} />
            </linearGradient>
          ))}
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
          tickFormatter={(v: string) => v.length > 18 ? `${v.slice(0, 18)}…` : v}
        />

        <YAxis
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          tick={{ fill: 'var(--muted-foreground)' }}
          width={55}
        />

        <Tooltip cursor={{ fill: 'var(--muted)' }} content={<CustomTooltip />} />

        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52} animationDuration={1200}>
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#estGrad${i})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
