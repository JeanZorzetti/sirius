'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Loader2, Calendar, User, Flag } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { toast } from 'sonner'
import type { TaskLite, TaskStatusLite } from './task-types'

interface TaskDetailPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: TaskLite | null
  statuses: TaskStatusLite[]
  onUpdated?: () => void
  onDeleted?: () => void
}

type Priority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export function TaskDetailPanel({
  open,
  onOpenChange,
  task,
  statuses,
  onUpdated,
  onDeleted,
}: TaskDetailPanelProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [statusId, setStatusId] = useState('')
  const [priority, setPriority] = useState<Priority>('NONE')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatusId(task.statusId)
      setPriority(task.priority as Priority)
      setDueDate(
        task.dueDate
          ? new Date(task.dueDate).toISOString().slice(0, 10)
          : ''
      )
    }
  }, [task])

  const handleSave = async () => {
    if (!task) return
    if (!title.trim()) {
      toast.error('O título é obrigatório')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          statusId,
          priority,
          dueDate: dueDate || null,
        }),
      })

      if (!res.ok) throw new Error('Erro ao salvar')

      toast.success('Tarefa atualizada')
      onUpdated?.()
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao salvar alterações')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    if (!confirm('Excluir esta tarefa? Esta ação não pode ser desfeita.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')

      toast.success('Tarefa excluída')
      onDeleted?.()
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao excluir tarefa')
    } finally {
      setDeleting(false)
    }
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Detalhes da tarefa</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="task-description">Descrição</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione uma descrição..."
              rows={4}
            />
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/50 bg-muted/20 p-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flag className="h-3 w-3" />
                Status
              </Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger className="h-8">
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
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flag className="h-3 w-3" />
                Prioridade
              </Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-8">
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

            <div className="grid gap-2 col-span-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Prazo
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8"
              />
            </div>

            {task.assignee && (
              <div className="grid gap-2 col-span-2">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  Responsável
                </Label>
                <div className="text-sm">{task.assignee.name || task.assignee.email}</div>
              </div>
            )}
          </div>

          {/* Links */}
          {(task.deal || task.contact) && (
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">Vinculado a</div>
              <div className="flex flex-wrap gap-2">
                {task.deal && (
                  <a
                    href={`/dashboard/deals/${task.deal.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-500/20"
                  >
                    Deal: {task.deal.title}
                  </a>
                )}
                {task.contact && (
                  <a
                    href={`/dashboard/contacts/${task.contact.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20"
                  >
                    Contato: {task.contact.name}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
            >
              {deleting ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-3 w-3" />
              )}
              Excluir
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading || !title.trim()}>
                {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
