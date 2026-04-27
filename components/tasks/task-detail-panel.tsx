'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Loader2, Calendar, User, Flag, AlignLeft, CheckCircle2, CheckSquare, Paperclip } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { TaskLite, TaskStatusLite } from './task-types'
import { TaskAssigneeAvatar } from './task-assignee-avatar'
import { TaskPriorityIcon } from './task-priority-icon'
import { TaskChecklist } from './task-checklist'
import { TaskAttachments } from './task-attachments'

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

  const isCompleted = !!task.completedAt
  const currentStatus = statuses.find(s => s.id === statusId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-hidden p-0 border-l-0 shadow-2xl rounded-l-2xl sm:rounded-l-2xl">
        <div className="flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Header / Breadcrumb */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/40">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className={cn("h-4 w-4", isCompleted ? "text-emerald-500" : "text-muted-foreground")} />
                <span>ID-{task.id.slice(0, 5).toUpperCase()}</span>
              </div>
            </div>

            <div className="px-6 py-8 space-y-8">
              {/* Title Section */}
              <div className="flex flex-col">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da tarefa..."
                  className={cn(
                    "w-full text-3xl font-bold tracking-tight bg-transparent border-none outline-none focus:ring-0 px-0 transition-all placeholder:text-muted-foreground/30",
                    isCompleted && "line-through text-muted-foreground"
                  )}
                />
              </div>

              {/* Meta Attributes - Sleek Horizontal layout */}
              <div className="flex flex-wrap items-center gap-2 md:gap-4">
                {/* Status */}
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger className="h-9 px-3 w-auto min-w-[130px] rounded-full border-none bg-muted/60 hover:bg-muted focus:ring-0 shadow-none transition-colors">
                    <SelectValue>
                      {currentStatus ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: currentStatus.color }}
                          />
                          <span className="font-medium">{currentStatus.name}</span>
                        </div>
                      ) : (
                        "Status"
                      )}
                    </SelectValue>
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

                {/* Priority */}
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="h-9 px-3 w-auto min-w-[120px] rounded-full border-none bg-muted/60 hover:bg-muted focus:ring-0 shadow-none transition-colors">
                    <SelectValue>
                      <div className="flex items-center gap-2 font-medium">
                        <TaskPriorityIcon priority={priority} />
                        {priority === 'NONE' && 'Sem Prioridade'}
                        {priority === 'LOW' && 'Baixa'}
                        {priority === 'MEDIUM' && 'Média'}
                        {priority === 'HIGH' && 'Alta'}
                        {priority === 'URGENT' && 'Urgente'}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE"><div className="flex items-center gap-2"><TaskPriorityIcon priority="NONE" />Sem Prioridade</div></SelectItem>
                    <SelectItem value="LOW"><div className="flex items-center gap-2"><TaskPriorityIcon priority="LOW" />Baixa</div></SelectItem>
                    <SelectItem value="MEDIUM"><div className="flex items-center gap-2"><TaskPriorityIcon priority="MEDIUM" />Média</div></SelectItem>
                    <SelectItem value="HIGH"><div className="flex items-center gap-2"><TaskPriorityIcon priority="HIGH" />Alta</div></SelectItem>
                    <SelectItem value="URGENT"><div className="flex items-center gap-2"><TaskPriorityIcon priority="URGENT" />Urgente</div></SelectItem>
                  </SelectContent>
                </Select>

                {/* Due Date */}
                <div className="relative group flex items-center">
                  <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-9 pl-9 pr-4 text-sm font-medium rounded-full bg-muted/60 hover:bg-muted border-none outline-none focus:ring-0 transition-colors cursor-pointer"
                  />
                </div>

                {/* Assignee */}
                {task.assignee ? (
                  <div className="flex items-center gap-2 h-9 px-1.5 pr-4 rounded-full bg-muted/60 hover:bg-muted transition-colors border-none">
                    <TaskAssigneeAvatar user={task.assignee} size="sm" />
                    <span className="text-sm font-medium">{task.assignee.name || task.assignee.email.split('@')[0]}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 h-9 px-3 rounded-full bg-muted/60 hover:bg-muted transition-colors border-none text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Sem responsável</span>
                  </div>
                )}
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-border/50 to-transparent my-2" />

              {/* Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                  <h3>Descrição da atividade</h3>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione notas, checklists ou qualquer contexto relevante..."
                  className="min-h-[220px] resize-y border-0 bg-muted/30 hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all text-[15px] leading-relaxed rounded-2xl p-5 shadow-inner"
                />
              </div>

              {/* Checklists */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <h3>Checklists</h3>
                </div>
                <TaskChecklist taskId={task.id} />
              </div>

              {/* Attachments */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <h3>Anexos</h3>
                </div>
                <TaskAttachments taskId={task.id} />
              </div>

              {/* Connected Entities */}
              {(task.deal || task.contact) && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vinculado a</h4>
                  <div className="flex flex-wrap gap-3">
                    {task.deal && (
                      <a
                        href={`/dashboard/deals/${task.deal.id}`}
                        className="group flex items-center gap-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 transition-all"
                      >
                        <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform" />
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Deal: {task.deal.title}</span>
                      </a>
                    )}
                    {task.contact && (
                      <a
                        href={`/dashboard/contacts/${task.contact.id}`}
                        className="group flex items-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 transition-all"
                      >
                        <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Contato: {task.contact.name}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-4 px-6 border-t border-border/30 bg-muted/20 backdrop-blur-sm sticky bottom-0">
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/15 rounded-full px-4 h-10"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              <span className="font-medium">Excluir</span>
            </Button>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={loading}
                className="rounded-full px-5 h-10 border-border/50 hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={loading || !title.trim()}
                className="rounded-full px-6 h-10 bg-primary/90 hover:bg-primary shadow-md hover:shadow-lg transition-all"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span className="font-semibold">Salvar alterações</span>
              </Button>
            </div>
          </div>
          
        </div>
      </SheetContent>
    </Sheet>
  )
}
