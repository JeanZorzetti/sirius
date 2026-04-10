'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HeatmapDatum {
  date: string // yyyy-mm-dd
  count: number
}

interface Props {
  data: HeatmapDatum[]
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getIntensity(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || max === 0) return 0
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

const intensityClasses: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-muted/40',
  1: 'bg-emerald-500/20',
  2: 'bg-emerald-500/45',
  3: 'bg-emerald-500/70',
  4: 'bg-emerald-500',
}

export function ActivityHeatmap({ data }: Props) {
  const { weeks, months, maxCount } = useMemo(() => {
    const countMap = new Map(data.map((d) => [d.date, d.count]))
    const max = data.reduce((m, d) => Math.max(m, d.count), 0)

    // Gera 53 semanas a partir de hoje para trás (domingo a sábado)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Primeiro domingo antes de 52 semanas atrás
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 52 * 7 - today.getDay())

    const weeks: Array<Array<{ date: string; count: number; isFuture: boolean }>> = []
    let monthLabels: Array<{ label: string; col: number }> = []
    let lastMonth = -1

    for (let w = 0; w < 53; w++) {
      const week: Array<{ date: string; count: number; isFuture: boolean }> = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + w * 7 + d)
        const iso = date.toISOString().slice(0, 10)
        const isFuture = date > today
        week.push({ date: iso, count: countMap.get(iso) ?? 0, isFuture })

        // Marca início de mês
        if (!isFuture && d === 0 && date.getMonth() !== lastMonth) {
          lastMonth = date.getMonth()
          monthLabels.push({ label: MONTHS[lastMonth], col: w })
        }
      }
      weeks.push(week)
    }

    return { weeks, months: monthLabels, maxCount: max }
  }, [data])

  const totalCompleted = data.reduce((s, d) => s + d.count, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50',
        'bg-card/40 backdrop-blur-xl p-5 sm:p-6'
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Atividade do Ano
          </h3>
          <p className="text-xs text-muted-foreground">
            {totalCompleted} tarefa{totalCompleted !== 1 ? 's' : ''} concluída{totalCompleted !== 1 ? 's' : ''} nos últimos 12 meses
          </p>
        </div>
        {/* Legenda */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-[10px] text-muted-foreground">Menos</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <div
              key={level}
              className={cn('h-3 w-3 rounded-sm', intensityClasses[level])}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">Mais</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Labels de mês */}
          <div className="relative mb-1 ml-8 flex" style={{ gap: 0 }}>
            {months.map((m) => (
              <div
                key={`${m.label}-${m.col}`}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: `${(m.col / 53) * 100}%` }}
              >
                {m.label}
              </div>
            ))}
            <div className="h-4" /> {/* spacer */}
          </div>

          {/* Grid: weekdays labels + cells */}
          <div className="flex gap-0.5">
            {/* Weekday labels */}
            <div className="flex flex-col gap-0.5 pr-1.5">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    'flex h-3 items-center text-[9px] text-muted-foreground/60',
                    i % 2 === 0 ? 'opacity-0' : '' // só mostra dias alternados
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Semanas */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day) => {
                  const intensity = day.isFuture ? 0 : getIntensity(day.count, maxCount)
                  return (
                    <div
                      key={day.date}
                      title={
                        day.isFuture
                          ? ''
                          : `${day.date}: ${day.count} tarefa${day.count !== 1 ? 's' : ''}`
                      }
                      className={cn(
                        'h-3 w-3 rounded-sm transition-all duration-150',
                        intensityClasses[intensity],
                        !day.isFuture && 'cursor-default hover:ring-1 hover:ring-emerald-500/50 hover:ring-offset-1 hover:ring-offset-background'
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
