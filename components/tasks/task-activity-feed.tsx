'use client'

import { useState, useEffect } from 'react'
import { Activity, UserCheck, Flag, Calendar, CheckCircle2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskActivityItem {
  id: string
  type: string
  description: string
  metadata: Record<string, any> | null
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
}

interface TaskActivityFeedProps {
  taskId: string
}

const ACTIVITY_ICONS: Record<string, typeof Pencil> = {
  STATUS_CHANGED: Flag,
  ASSIGNED: UserCheck,
  PRIORITY_CHANGED: Flag,
  DUE_DATE_CHANGED: Calendar,
  COMPLETED: CheckCircle2,
  CREATED: Pencil,
  UPDATED: Pencil,
  COMMENTED: Activity,
}

const ACTIVITY_COLORS: Record<string, string> = {
  STATUS_CHANGED: 'text-blue-500 bg-blue-500/10',
  ASSIGNED: 'text-indigo-500 bg-indigo-500/10',
  PRIORITY_CHANGED: 'text-amber-500 bg-amber-500/10',
  DUE_DATE_CHANGED: 'text-purple-500 bg-purple-500/10',
  COMPLETED: 'text-emerald-500 bg-emerald-500/10',
  CREATED: 'text-zinc-500 bg-zinc-500/10',
  UPDATED: 'text-zinc-500 bg-zinc-500/10',
  COMMENTED: 'text-sky-500 bg-sky-500/10',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function TaskActivityFeed({ taskId }: TaskActivityFeedProps) {
  const [activities, setActivities] = useState<TaskActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/tasks/${taskId}/activities`)
        if (res.ok) {
          const data = await res.json()
          setActivities(data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [taskId])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Histórico</h3>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground">Carregando...</div>
      ) : activities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/30 py-4 text-center text-xs text-muted-foreground">
          Nenhuma atividade ainda
        </div>
      ) : (
        <ol className="relative space-y-3 before:absolute before:left-3.5 before:top-1 before:bottom-1 before:w-px before:bg-border/40">
          {activities.map((a) => {
            const Icon = ACTIVITY_ICONS[a.type] || Activity
            const color = ACTIVITY_COLORS[a.type] || 'text-zinc-500 bg-zinc-500/10'
            return (
              <li key={a.id} className="relative flex gap-3 pl-0">
                <div className={cn('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-background', color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-xs text-foreground leading-relaxed">
                    {a.user && (
                      <span className="font-semibold">{a.user.name || a.user.email} </span>
                    )}
                    <span className="text-muted-foreground">{a.description}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(a.createdAt)}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
