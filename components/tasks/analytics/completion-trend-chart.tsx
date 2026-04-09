'use client'

import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

interface TrendDatum {
  date: string // ISO yyyy-mm-dd
  created: number
  completed: number
}

interface Props {
  data: TrendDatum[]
  rangeDays: number
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/90 px-3 py-2 shadow-xl backdrop-blur-md">
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
          {formatDate(label)}
        </p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-foreground">
              {entry.dataKey === 'completed' ? 'Concluídas' : 'Criadas'}:{' '}
              <span className="font-mono font-semibold">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function CompletionTrendChart({ data, rangeDays }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50',
        'bg-card/40 backdrop-blur-xl p-5 sm:p-6'
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Tendência de Produtividade
          </h3>
          <p className="text-xs text-muted-foreground">
            Últimos {rangeDays} dias · Criadas vs Concluídas
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          Sem dados no período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.3}
            />

            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={30}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />

            <Legend
              formatter={(value) =>
                value === 'completed' ? 'Concluídas' : 'Criadas'
              }
              wrapperStyle={{ fontSize: 11, paddingTop: 8, color: 'hsl(var(--muted-foreground))' }}
              iconType="circle"
            />

            <Area
              type="monotone"
              dataKey="created"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#createdGradient)"
              animationDuration={1000}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#completedGradient)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
