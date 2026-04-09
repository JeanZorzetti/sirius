'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssigneeDatum {
  userId: string
  name: string
  email: string
  image: string | null
  count: number
}

interface Props {
  data: AssigneeDatum[]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function ProductivityByUser({ data }: Props) {
  const max = data.reduce((m, d) => Math.max(m, d.count), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50',
        'bg-card/40 backdrop-blur-xl p-5 sm:p-6'
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/20">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Carga por Responsável
          </h3>
          <p className="text-xs text-muted-foreground">
            Top {data.length} com mais tarefas
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
          Nenhuma tarefa atribuída
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((user, i) => {
            const pct = max > 0 ? (user.count / max) * 100 : 0
            return (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
                className="group"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/50">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.image}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {getInitials(user.name)}
                      </span>
                    )}
                  </div>

                  {/* Nome + bar */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-medium text-foreground">
                        {user.name}
                      </p>
                      <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                        {user.count}
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 0.8,
                          delay: 0.3 + i * 0.04,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        }}
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/60 to-primary"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
