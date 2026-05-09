'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link2, X, Plus, ArrowRight, ArrowLeft, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DepTaskLite {
  id: string
  title: string
  priority: string
  status: { id: string; name: string; color: string } | null
  completedAt: string | null
}

interface Dependency {
  id: string
  type: 'BLOCKS' | 'BLOCKED_BY' | 'RELATED'
  fromTask?: DepTaskLite
  toTask?: DepTaskLite
}

interface TaskDependenciesProps {
  taskId: string
  projectId: string
}

const TYPE_LABELS: Record<string, string> = {
  BLOCKS: 'Bloqueia',
  BLOCKED_BY: 'Bloqueada por',
  RELATED: 'Relacionada',
}

export function TaskDependencies({ taskId, projectId }: TaskDependenciesProps) {
  const tCommon = useTranslations('common')
  const [outgoing, setOutgoing] = useState<Dependency[]>([])
  const [incoming, setIncoming] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DepTaskLite[]>([])
  const [selectedType, setSelectedType] = useState<'BLOCKS' | 'BLOCKED_BY' | 'RELATED'>('BLOCKS')

  useEffect(() => {
    load()
  }, [taskId])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`)
      if (res.ok) {
        const data = await res.json()
        setOutgoing(data.outgoing || [])
        setIncoming(data.incoming || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const search = async (q: string) => {
    setSearchQuery(q)
    if (!q.trim() || q.length < 2) {
      setSearchResults([])
      return
    }
    try {
      const res = await fetch(
        `/api/tasks?projectId=${projectId}&search=${encodeURIComponent(q)}&limit=5`
      )
      if (res.ok) {
        const data = await res.json()
        const tasks = Array.isArray(data) ? data : data.tasks || []
        setSearchResults(tasks.filter((t: DepTaskLite) => t.id !== taskId).slice(0, 5))
      }
    } catch {
      // ignore
    }
  }

  const addDependency = async (toTaskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toTaskId, type: selectedType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'fail')
      }
      toast.success(tCommon('toasts.created'))
      setAdding(false)
      setSearchQuery('')
      setSearchResults([])
      load()
    } catch (e: any) {
      toast.error(e.message || tCommon('toasts.failed'))
    }
  }

  const removeDependency = async (depId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies/${depId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('fail')
      load()
    } catch {
      toast.error(tCommon('toasts.failedDelete'))
    }
  }

  const renderDep = (dep: Dependency, direction: 'out' | 'in') => {
    const task = direction === 'out' ? dep.toTask : dep.fromTask
    if (!task) return null
    const Arrow = direction === 'out' ? ArrowRight : ArrowLeft
    return (
      <li
        key={dep.id}
        className="group flex items-center gap-2 rounded-lg border border-border/30 bg-card/30 px-2.5 py-1.5"
      >
        <Arrow className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="text-[10px] font-medium text-muted-foreground">
          {TYPE_LABELS[dep.type]}
        </span>
        {task.status && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: task.status.color }}
          />
        )}
        <span
          className={cn(
            'flex-1 truncate text-xs',
            task.completedAt && 'text-muted-foreground line-through'
          )}
        >
          {task.title}
        </span>
        <button
          onClick={() => removeDependency(dep.id)}
          className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      </li>
    )
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground">{tCommon('buttons.loading')}</div>
  }

  const hasAny = outgoing.length > 0 || incoming.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Dependências</h3>
        </div>
        {!adding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" />
            {tCommon('buttons.add')}
          </Button>
        )}
      </div>

      {adding && (
        <div className="space-y-2 rounded-lg border border-border/40 bg-card/30 p-2.5">
          <div className="flex items-center gap-2">
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BLOCKS">Bloqueia</SelectItem>
                <SelectItem value="BLOCKED_BY">Bloqueada por</SelectItem>
                <SelectItem value="RELATED">Relacionada</SelectItem>
              </SelectContent>
            </Select>
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => search(e.target.value)}
              placeholder="Buscar tarefa..."
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => {
                setAdding(false)
                setSearchQuery('')
                setSearchResults([])
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <ul className="space-y-1">
              {searchResults.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => addDependency(t.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    {t.status && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: t.status.color }}
                      />
                    )}
                    <span className="flex-1 truncate">{t.title}</span>
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!hasAny && !adding ? (
        <div className="rounded-lg border border-dashed border-border/30 py-4 text-center text-xs text-muted-foreground">
          Nenhuma dependência
        </div>
      ) : (
        <div className="space-y-3">
          {outgoing.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                Saindo
              </span>
              <ul className="mt-1 space-y-1">
                {outgoing.map((d) => renderDep(d, 'out'))}
              </ul>
            </div>
          )}
          {incoming.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                Entrando
              </span>
              <ul className="mt-1 space-y-1">
                {incoming.map((d) => renderDep(d, 'in'))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
