'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaskPriority } from '@prisma/client'

interface OverdueTask {
  id: string
  title: string
  dueDate: string | null
  priority: TaskPriority
  projectId: string
  assignee: { id: string; name: string | null; email: string } | null
  project: { id: string; name: string; color: string } | null
  status: { id: string; name: string; color: string } | null
}

interface Props {
  data: OverdueTask[]
  locale: string
}

const priorityLabels: Record<TaskPriority, { label: string; color: string }> = {
  NONE: { label: 'Nenhuma', color: 'text-muted-foreground' },
  LOW: { label: 'Baixa', color: 'text-sky-500' },
  MEDIUM: { label: 'Média', color: 'text-amber-500' },
  HIGH: { label: 'Alta', color: 'text-orange-500' },
  URGENT: { label: 'Urgente', color: 'text-rose-500' },
}

function daysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0
  const now = new Date()
  const due = new Date(dueDate)
  const diff = now.getTime() - due.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function OverdueTasksList({ data, locale }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-rose-500/20',
        'bg-card/40 backdrop-blur-xl p-5 sm:p-6',
        'ring-1 ring-inset ring-rose-500/10'
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 ring-1 ring-inset ring-rose-500/20">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
        </div>
        <div>
          <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Tarefas Atrasadas
          </h3>
          <p className="text-xs text-muted-foreground">
            {data.length === 0
              ? 'Tudo em dia 🎉'
              : `${data.length} tarefa(s) precisam de atenção`}
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
          Nenhuma tarefa atrasada
        </div>
      ) : (
        <div className="space-y-1.5">
          {data.map((task, i) => {
            const days = daysOverdue(task.dueDate)
            const priority = priorityLabels[task.priority]
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + i * 0.03 }}
              >
                <Link
                  href={`/${locale}/dashboard/tasks/task/${task.id}`}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5',
                    'border border-transparent transition-all duration-200',
                    'hover:border-border/60 hover:bg-muted/40'
                  )}
                >
                  {/* Priority dot */}
                  <div
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      task.priority === 'URGENT' && 'bg-rose-500',
                      task.priority === 'HIGH' && 'bg-orange-500',
                      task.priority === 'MEDIUM' && 'bg-amber-500',
                      task.priority === 'LOW' && 'bg-sky-500',
                      task.priority === 'NONE' && 'bg-muted-foreground/40'
                    )}
                  />

                  {/* Title + project */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {task.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {task.project && (
                        <>
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <span className="truncate">{task.project.name}</span>
                          <span>·</span>
                        </>
                      )}
                      <span className="font-medium text-rose-500">
                        {days === 0 ? 'vence hoje' : `${days}d atrás`}
                      </span>
                      {priority.label !== 'Nenhuma' && (
                        <>
                          <span>·</span>
                          <span className={priority.color}>{priority.label}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Assignee initial */}
                  {task.assignee?.name && (
                    <div className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-1 ring-border/50 sm:flex">
                      {task.assignee.name
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}

                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
