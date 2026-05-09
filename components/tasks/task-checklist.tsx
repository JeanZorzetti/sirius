'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: string
  title: string
  completed: boolean
  completedAt: string | null
  order: number
}

interface Checklist {
  id: string
  title: string
  order: number
  items: ChecklistItem[]
}

interface TaskChecklistProps {
  taskId: string
}

export function TaskChecklist({ taskId }: TaskChecklistProps) {
  const tCommon = useTranslations('common')
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [newListTitle, setNewListTitle] = useState('')
  const [addingList, setAddingList] = useState(false)
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
  }, [taskId])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`)
      if (res.ok) setChecklists(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const createChecklist = async () => {
    const title = newListTitle.trim()
    if (!title) return
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) throw new Error('fail')
      setNewListTitle('')
      setAddingList(false)
      load()
    } catch {
      toast.error('Erro ao criar checklist')
    }
  }

  const toggleItem = async (itemId: string, checklistId: string) => {
    // Optimistic update
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((it) =>
                it.id === itemId ? { ...it, completed: !it.completed } : it
              ),
            }
          : cl
      )
    )

    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', itemId }),
      })
      if (!res.ok) throw new Error('fail')
    } catch {
      toast.error('Erro ao atualizar item')
      load()
    }
  }

  const addItem = async (checklistId: string) => {
    const title = (newItemTitles[checklistId] || '').trim()
    if (!title) return
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addItem', checklistId, title }),
      })
      if (!res.ok) throw new Error('fail')
      setNewItemTitles((prev) => ({ ...prev, [checklistId]: '' }))
      load()
    } catch {
      toast.error('Erro ao adicionar item')
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteItem', itemId }),
      })
      if (!res.ok) throw new Error('fail')
      load()
    } catch {
      toast.error('Erro ao remover item')
    }
  }

  const deleteChecklist = async (checklistId: string) => {
    if (!confirm('Remover este checklist?')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteChecklist', checklistId }),
      })
      if (!res.ok) throw new Error('fail')
      load()
    } catch {
      toast.error('Erro ao remover checklist')
    }
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Checklists</h3>
        </div>
        {!addingList && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs"
            onClick={() => setAddingList(true)}
          >
            <Plus className="h-3 w-3" />
            Novo checklist
          </Button>
        )}
      </div>

      {addingList && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createChecklist()
              if (e.key === 'Escape') {
                setAddingList(false)
                setNewListTitle('')
              }
            }}
            placeholder="Título do checklist"
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={createChecklist} className="h-8">
            Criar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              setAddingList(false)
              setNewListTitle('')
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {checklists.length === 0 && !addingList ? (
        <div className="rounded-lg border border-dashed border-border/30 py-4 text-center text-xs text-muted-foreground">
          Nenhum checklist ainda
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((cl) => {
            const done = cl.items.filter((i) => i.completed).length
            const total = cl.items.length
            const pct = total === 0 ? 0 : Math.round((done / total) * 100)
            return (
              <div key={cl.id} className="rounded-lg border border-border/40 bg-card/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-foreground">{cl.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                      {done}/{total}
                    </span>
                    <button
                      onClick={() => deleteChecklist(cl.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Items */}
                <ul className="mt-3 space-y-1.5">
                  {cl.items.map((item) => (
                    <li key={item.id} className="group flex items-center gap-2">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItem(item.id, cl.id)}
                        className="h-3.5 w-3.5"
                      />
                      <span
                        className={cn(
                          'flex-1 text-xs',
                          item.completed
                            ? 'text-muted-foreground line-through'
                            : 'text-foreground'
                        )}
                      >
                        {item.title}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Add item inline */}
                <div className="mt-2 flex items-center gap-1">
                  <Input
                    value={newItemTitles[cl.id] || ''}
                    onChange={(e) =>
                      setNewItemTitles((prev) => ({ ...prev, [cl.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addItem(cl.id)
                    }}
                    placeholder="Adicionar item..."
                    className="h-7 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => addItem(cl.id)}
                    disabled={!(newItemTitles[cl.id] || '').trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
