'use client'

import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

interface StatusDatum {
  statusId: string
  name: string
  color: string
  count: number
  type: string
}

interface Props {
  data: StatusDatum[]
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
            {entry.payload.name}
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

export function TasksByStatusChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50',
        'bg-card/40 backdrop-blur-xl p-5 sm:p-6'
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Distribuição por Status
          </h3>
          <p className="text-xs text-muted-foreground">
            {total} tarefa(s) no total
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          Nenhuma tarefa para exibir
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              stroke="none"
              animationDuration={900}
            >
              {data.map((entry) => (
                <Cell key={entry.statusId} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{
                fontSize: 11,
                paddingTop: 12,
                color: 'hsl(var(--muted-foreground))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}
