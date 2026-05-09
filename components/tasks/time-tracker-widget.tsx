'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useRef } from 'react'
import { Play, Square, Clock, Trash2 } from 'lucide-react'
import { cn, formatTimeBR } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface TimeEntry {
  id: string
  description: string | null
  startTime: string
  endTime: string | null
  durationMs: number
  billable: boolean
  user: { id: string; name: string | null; email: string }
}

interface TimeTrackerWidgetProps {
  taskId: string
  locked?: boolean
}

function formatDuration(ms: number): string {
  if (ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

const formatTime = formatTimeBR

export function TimeTrackerWidget({ taskId, locked = false }: TimeTrackerWidgetProps) {
  const tCommon = useTranslations('common')
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<{ startTime: number; description: string } | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [description, setDescription] = useState('')
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    if (locked) return
    loadEntries()
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current)
    }
  }, [taskId, locked])

  useEffect(() => {
    if (running) {
      tickRef.current = window.setInterval(() => {
        setElapsed(Date.now() - running.startTime)
      }, 1000)
      return () => {
        if (tickRef.current !== null) window.clearInterval(tickRef.current)
      }
    }
  }, [running])

  const loadEntries = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/time-entries`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const startTimer = () => {
    setRunning({ startTime: Date.now(), description })
    setElapsed(0)
  }

  const stopTimer = async () => {
    if (!running) return
    const start = new Date(running.startTime).toISOString()
    const end = new Date().toISOString()
    const duration = Date.now() - running.startTime

    try {
      const res = await fetch(`/api/tasks/${taskId}/time-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: running.description || null,
          startTime: start,
          endTime: end,
          durationMs: duration,
        }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Erro ao salvar')
      }
      toast.success('Entrada registrada')
      setRunning(null)
      setDescription('')
      setElapsed(0)
      loadEntries()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Excluir esta entrada?')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}/time-entries/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Entrada excluída')
      loadEntries()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const totalMs = entries.reduce((sum, e) => sum + e.durationMs, 0)

  if (locked) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <h3 className="mt-2 text-sm font-semibold">Time Tracking</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Disponível no plano PRO ou superior.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Tempo registrado</h3>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          Total: {formatDuration(totalMs)}
        </span>
      </div>

      {/* Timer */}
      <div className="rounded-xl border border-border/50 bg-card p-3">
        {running ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {formatDuration(elapsed)}
              </div>
              {running.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {running.description}
                </div>
              )}
            </div>
            <Button onClick={stopTimer} size="sm" variant="destructive" className="gap-1">
              <Square className="h-3 w-3" />
              Parar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que você está fazendo?"
              className="h-8 text-xs flex-1"
            />
            <Button onClick={startTimer} size="sm" className="gap-1">
              <Play className="h-3 w-3" />
              Iniciar
            </Button>
          </div>
        )}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="text-xs text-muted-foreground">Carregando...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/30 py-4 text-center text-xs text-muted-foreground">
          Nenhuma entrada ainda
        </div>
      ) : (
        <ul className="divide-y divide-border/30 rounded-xl border border-border/50 bg-card">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="group flex items-center gap-3 px-3 py-2 text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="truncate text-foreground">
                  {entry.description || 'Sem descrição'}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {entry.user.name || entry.user.email} ·{' '}
                  {formatTime(entry.startTime)}
                  {entry.endTime && ` — ${formatTime(entry.endTime)}`}
                </div>
              </div>
              <span className="font-mono text-muted-foreground tabular-nums">
                {formatDuration(entry.durationMs)}
              </span>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-opacity"
                aria-label={tCommon('buttons.delete')}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
