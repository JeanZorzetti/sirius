'use client'

/**
 * ✅ FASE 13.1: Gráfico Top 5 Motivos de Perda (Client Component)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface TopReason {
  name: string
  count: number
  percentage: number
}

interface LostDealsChartsProps {
  topReasons: TopReason[]
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16']

export function LostDealsCharts({ topReasons }: LostDealsChartsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top {topReasons.length} Motivos de Perda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topReasons} layout="vertical" margin={{ left: 8, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, _name, props) => [
                  `${value ?? 0} negócios (${(props.payload as any)?.percentage ?? 0}%)`,
                  'Perdidos',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {topReasons.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda com percentuais */}
        <div className="mt-4 space-y-2">
          {topReasons.map((reason, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate text-muted-foreground">{reason.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="font-medium">{reason.count}</span>
                <span className="text-muted-foreground w-10 text-right">{reason.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
