'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, X, CheckSquare, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { cn, dateInputToISO } from '@/lib/utils'
import type { TaskStatusLite } from './task-types'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  statuses: TaskStatusLite[]
  defaultStatusId?: string
  defaultDueDate?: string
  isAdmin?: boolean
  onCreated?: () => void
}

type Priority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type Visibility = 'PUBLIC' | 'PRIVATE' | 'ADMINS_ONLY'

interface OrgMember {
  id: string
  name: string | null
  email: string
  orgRole: string
}

interface ChecklistItemDraft {
  id: string
  title: string
  completed: boolean
}

interface ChecklistDraft {
  id: string
  title: string
  items: ChecklistItemDraft[]
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
  statuses,
  defaultStatusId,
  defaultDueDate,
  isAdmin = false,
  onCreated,
}: CreateTaskDialogProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.tasks')
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [statusId, setStatusId] = useState<string>(defaultStatusId || statuses[0]?.id || '')
  const [priority, setPriority] = useState<Priority>('NONE')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState<string>('none')
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')
  const [members, setMembers] = useState<OrgMember[]>([])
  const [checklists, setChecklists] = useState<ChecklistDraft[]>([])
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [addingChecklist, setAddingChecklist] = useState(false)
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/org/members')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMembers(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setStatusId(defaultStatusId || statuses[0]?.id || '')
      setPriority('NONE')
      setDueDate(defaultDueDate || '')
      setAssigneeId('none')
      setVisibility('PUBLIC')
      setChecklists([])
      setNewChecklistTitle('')
      setAddingChecklist(false)
      setNewItemTitles({})
    }
  }, [open, defaultStatusId, defaultDueDate, statuses])

  const addChecklist = () => {
    const t = newChecklistTitle.trim()
    if (!t) return
    setChecklists((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: t, items: [] },
    ])
    setNewChecklistTitle('')
    setAddingChecklist(false)
  }

  const removeChecklist = (id: string) => {
    setChecklists((prev) => prev.filter((cl) => cl.id !== id))
  }

  const addChecklistItem = (checklistId: string) => {
    const t = (newItemTitles[checklistId] || '').trim()
    if (!t) return
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: [...cl.items, { id: crypto.randomUUID(), title: t, completed: false }] }
          : cl
      )
    )
    setNewItemTitles((prev) => ({ ...prev, [checklistId]: '' }))
  }

  const removeChecklistItem = (checklistId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.filter((it) => it.id !== itemId) }
          : cl
      )
    )
  }

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error(tCommon('toasts.failed'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          statusId,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          dueDate: dueDate ? dateInputToISO(dueDate) : null,
          assigneeId: assigneeId === 'none' ? null : assigneeId,
          visibility,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Erro ao criar tarefa')
      }

      const task = await res.json()

      if (checklists.length > 0) {
        await Promise.all(
          checklists.map((cl) =>
            fetch(`/api/tasks/${task.id}/checklists`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: cl.title,
                items: cl.items.map((it) => ({ title: it.title })),
              }),
            })
          )
        )
      }

      toast.success(t('createSuccess'))
      onOpenChange(false)
      onCreated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tCommon('toasts.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('createTask')}</DialogTitle>
            <DialogDescription>
              Crie uma tarefa e atribua a um status, prioridade e prazo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Revisar proposta comercial"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes, contexto ou requisitos..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Nenhuma</SelectItem>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">Prazo</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Responsável */}
            {members.length > 0 && (
              <div className="grid gap-2">
                <Label>Responsável</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary uppercase">
                            {(m.name || m.email).charAt(0)}
                          </div>
                          <span>{m.name || m.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Visibilidade — só admin vê */}
            {isAdmin && (
              <div className="grid gap-2">
                <Label>Visibilidade</Label>
                <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Pública — todos os membros</SelectItem>
                    <SelectItem value="PRIVATE">Privada — só criador e responsável</SelectItem>
                    <SelectItem value="ADMINS_ONLY">Apenas admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Checklists */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  Checklists
                </Label>
                {!addingChecklist && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => setAddingChecklist(true)}
                  >
                    <Plus className="h-3 w-3" />
                    {tCommon('buttons.add')}
                  </Button>
                )}
              </div>

              {addingChecklist && (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addChecklist() }
                      if (e.key === 'Escape') { setAddingChecklist(false); setNewChecklistTitle('') }
                    }}
                    placeholder="Nome do checklist"
                    className="h-8 text-sm"
                  />
                  <Button type="button" size="sm" className="h-8 shrink-0" onClick={addChecklist}>
                    {tCommon('buttons.create')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 p-0"
                    onClick={() => { setAddingChecklist(false); setNewChecklistTitle('') }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {checklists.length > 0 && (
                <div className="space-y-3">
                  {checklists.map((cl) => {
                    const done = cl.items.filter((i) => i.completed).length
                    const total = cl.items.length
                    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
                    const allDone = total > 0 && done === total
                    return (
                      <div key={cl.id} className="rounded-lg border border-border/40 bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn('text-xs font-semibold transition-colors', allDone && 'text-emerald-500')}>
                            {cl.title}
                          </span>
                          <div className="flex items-center gap-2">
                            {total > 0 && (
                              <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                                {done}/{total}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeChecklist(cl.id)}
                              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {total > 0 && (
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full transition-all duration-300',
                                allDone ? 'bg-emerald-500' : 'bg-primary'
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}

                        {cl.items.length > 0 && (
                          <ul className="mt-2.5 space-y-1.5">
                            {cl.items.map((item) => (
                              <li key={item.id} className="group flex items-center gap-2">
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => toggleChecklistItem(cl.id, item.id)}
                                  className={cn(
                                    'h-3.5 w-3.5 transition-colors',
                                    item.completed && 'border-emerald-500 data-[state=checked]:bg-emerald-500'
                                  )}
                                />
                                <span
                                  className={cn(
                                    'flex-1 text-xs transition-colors',
                                    item.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                                  )}
                                >
                                  {item.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeChecklistItem(cl.id, item.id)}
                                  className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-2 flex items-center gap-1">
                          <Input
                            value={newItemTitles[cl.id] || ''}
                            onChange={(e) =>
                              setNewItemTitles((prev) => ({ ...prev, [cl.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(cl.id) }
                            }}
                            placeholder="Adicionar item..."
                            className="h-7 text-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 p-0"
                            onClick={() => addChecklistItem(cl.id)}
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
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createTask')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
