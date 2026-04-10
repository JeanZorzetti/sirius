'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

interface PriorityDatum {
  priority: string
  label: string
  color: string
  count: number
}

interface Props {
  data: PriorityDatum[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0]
    return (
      <div className="rounded-xl border border-border/60 bg-card/90 px-3 py-2 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.payload.color }}
          />
          <span className="text-xs font-medium text-foreground">
            {entry.payload.label}
          </span>
        </div>
        <p className="mt-1 font-mono text-sm font-semibold text-foreground">
          {entry.value} tarefa(s)
        </p>
      </div>
    )
  }
  return null
}

export function TasksByPriorityChart({ data }: Props) {
  const max = data.reduce((m, d) => Math.max(m, d.count), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50',
        'bg-card/40 backdrop-blur-xl p-5 sm:p-6'
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Distribuição por Prioridade
          </h3>
          <p className="text-xs text-muted-foreground">
            Tarefas agrupadas por nível de urgência
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          Nenhuma tarefa para exibir
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => {
            const pct = max > 0 ? (item.count / max) * 100 : 0
            return (
              <motion.div
                key={item.priority}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.18 + i * 0.06 }}
                className="group"
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                    {item.count}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.9,
                      delay: 0.22 + i * 0.06,
                      ease: [0.25, 0.1, 0.25, 1.0],
                    }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                    }}
                  />
                </div>
              </motion.div>
            )
          })}

          {/* Mini bar chart abaixo */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={900}>
                  {data.map((entry) => (
                    <Cell key={entry.priority} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  )
}
