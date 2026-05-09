'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Calendar,
  Flag,
  User as UserIcon,
  Tag,
  Trash2,
  Save,
  Briefcase,
  Contact as ContactIcon,
  Clock,
  MessageSquare,
  CheckSquare,
  Activity as ActivityIcon,
  GitBranch,
  Repeat,
  Eye,
  Paperclip,
} from 'lucide-react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn, formatDateBR, toDateInputBR, dateInputToISO } from '@/lib/utils'
import { PRIORITY_CONFIG } from './task-types'
import { TaskComments } from './task-comments'
import { TaskActivityFeed } from './task-activity-feed'
import { TaskChecklist } from './task-checklist'
import { TaskAttachments } from './task-attachments'
import { TaskDependencies } from './task-dependencies'
import { TaskRecurrenceConfig } from './task-recurrence-config'
import { TimeTrackerWidget } from './time-tracker-widget'

type Priority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type Visibility = 'PUBLIC' | 'PRIVATE' | 'ADMINS_ONLY'

interface OrgMember {
  id: string
  name: string | null
  email: string
  orgRole: string
}

const VISIBILITY_CONFIG: Record<Visibility, { label: string; description: string }> = {
  PUBLIC: { label: 'Pública', description: 'Todos os membros podem ver' },
  PRIVATE: { label: 'Privada', description: 'Só criador e responsável' },
  ADMINS_ONLY: { label: 'Apenas admins', description: 'Só OWNER e ADMIN' },
}

interface TaskDetailContentProps {
  task: any
  currentUserId: string
  currentUserRole?: string
}

export function TaskDetailContent({ task, currentUserId, currentUserRole }: TaskDetailContentProps) {
  const router = useRouter()
  const tCommon = useTranslations('common')
  const t = useTranslations('components.tasks')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [members, setMembers] = useState<OrgMember[]>([])

  const [title, setTitle] = useState<string>(task.title)
  const [description, setDescription] = useState<string>(task.description || '')
  const [statusId, setStatusId] = useState<string>(task.statusId)
  const [priority, setPriority] = useState<Priority>(task.priority as Priority)
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId || 'none')
  const [visibility, setVisibility] = useState<Visibility>((task.visibility as Visibility) || 'PUBLIC')
  const [dueDate, setDueDate] = useState<string>(
    task.dueDate ? toDateInputBR(task.dueDate) : ''
  )
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(
    task.estimatedMinutes || ''
  )

  const isAdmin = currentUserRole === 'OWNER'

  useEffect(() => {
    fetch('/api/org/members')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMembers(data))
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          statusId,
          priority,
          assigneeId: assigneeId === 'none' ? null : assigneeId,
          visibility,
          dueDate: dueDate ? dateInputToISO(dueDate) : null,
          estimatedMinutes: estimatedMinutes || null,
        }),
      })
      if (!res.ok) throw new Error('fail')
      toast.success(t('updateSuccess'))
      router.refresh()
    } catch {
      toast.error(tCommon('toasts.failedSave'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Excluir esta tarefa?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('fail')
      toast.success(t('deleteSuccess'))
      router.push(`/dashboard/tasks/${task.projectId}`)
    } catch {
      toast.error(tCommon('toasts.failedDelete'))
      setDeleting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* LEFT: Title, description, tabs */}
      <div className="space-y-6">
        {/* Title + status dot */}
        <div className="flex items-start gap-3">
          {task.status && (
            <div
              className="mt-3 h-3 w-3 shrink-0 rounded-full ring-4 ring-background"
              style={{ backgroundColor: task.status.color }}
            />
          )}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            className="h-auto border-none bg-transparent px-0 font-display text-3xl font-bold tracking-tighter text-foreground shadow-none focus-visible:ring-0"
          />
        </div>

        {/* Parent task */}
        {task.parent && (
          <Link
            href={`/dashboard/tasks/task/${task.parent.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-muted/50"
          >
            <CheckSquare className="h-3 w-3" />
            Subtarefa de: <span className="font-medium text-foreground">{task.parent.title}</span>
          </Link>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Descrição
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={save}
            placeholder="Adicionar descrição..."
            rows={4}
            className="resize-none border-border/50 text-sm leading-relaxed"
          />
        </div>

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Subtarefas ({task.subtasks.length})
            </Label>
            <ul className="space-y-1">
              {task.subtasks.map((sub: any) => (
                <li key={sub.id}>
                  <Link
                    href={`/dashboard/tasks/task/${sub.id}`}
                    className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-3 py-2 text-xs transition hover:border-border hover:bg-card/60"
                  >
                    {sub.status && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: sub.status.color }}
                      />
                    )}
                    <span
                      className={cn(
                        'flex-1 truncate',
                        sub.completedAt && 'text-muted-foreground line-through'
                      )}
                    >
                      {sub.title}
                    </span>
                    {sub.assignee && (
                      <span className="text-[10px] text-muted-foreground">
                        {sub.assignee.name || sub.assignee.email}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="comments" className="text-xs">
              <MessageSquare className="mr-1 h-3 w-3" />
              Comentários
            </TabsTrigger>
            <TabsTrigger value="checklists" className="text-xs">
              <CheckSquare className="mr-1 h-3 w-3" />
              Checklists
            </TabsTrigger>
            <TabsTrigger value="attachments" className="text-xs">
              <Paperclip className="mr-1 h-3 w-3" />
              Anexos
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="text-xs">
              <GitBranch className="mr-1 h-3 w-3" />
              Dependências
            </TabsTrigger>
            <TabsTrigger value="recurrence" className="text-xs">
              <Repeat className="mr-1 h-3 w-3" />
              Recorrência
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              <ActivityIcon className="mr-1 h-3 w-3" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="mt-4">
            <TaskComments taskId={task.id} />
          </TabsContent>
          <TabsContent value="checklists" className="mt-4">
            <TaskChecklist taskId={task.id} />
          </TabsContent>
          <TabsContent value="attachments" className="mt-4">
            <TaskAttachments taskId={task.id} />
          </TabsContent>
          <TabsContent value="dependencies" className="mt-4">
            <TaskDependencies taskId={task.id} projectId={task.projectId} />
          </TabsContent>
          <TabsContent value="recurrence" className="mt-4">
            <TaskRecurrenceConfig taskId={task.id} />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <TaskActivityFeed taskId={task.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* RIGHT: Metadata sidebar */}
      <aside className="space-y-4">
        <div className="space-y-3 rounded-xl border border-border/50 bg-card/30 p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Propriedades
          </h3>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flag className="h-3 w-3" />
              Status
            </Label>
            <Select
              value={statusId}
              onValueChange={(v) => {
                setStatusId(v)
                setTimeout(save, 0)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {task.project.statuses.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flag className="h-3 w-3" />
              Prioridade
            </Label>
            <Select
              value={priority}
              onValueChange={(v) => {
                setPriority(v as Priority)
                setTimeout(save, 0)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className={cn('font-medium', cfg.color)}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee — editável */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserIcon className="h-3 w-3" />
              Responsável
            </Label>
            <Select
              value={assigneeId}
              onValueChange={(v) => {
                setAssigneeId(v)
                setTimeout(save, 0)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Sem responsável</span>
                </SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-bold text-primary uppercase">
                        {(m.name || m.email).charAt(0)}
                      </div>
                      <span className="truncate">{m.name || m.email}</span>
                      {m.orgRole === 'OWNER' && (
                        <span className="ml-auto text-[9px] text-muted-foreground">Owner</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibilidade — só admin pode alterar */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              Visibilidade
            </Label>
            {isAdmin ? (
              <Select
                value={visibility}
                onValueChange={(v) => {
                  setVisibility(v as Visibility)
                  setTimeout(save, 0)
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(VISIBILITY_CONFIG) as [Visibility, { label: string; description: string }][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <span className="font-medium">{cfg.label}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{cfg.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md border border-border/40 bg-background px-2 py-1.5 text-xs text-muted-foreground">
                {VISIBILITY_CONFIG[visibility]?.label ?? 'Pública'}
              </div>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Prazo
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={save}
              className="h-8 text-xs"
            />
          </div>

          {/* Estimated time */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Tempo estimado (min)
            </Label>
            <Input
              type="number"
              min={0}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value ? parseInt(e.target.value) : '')}
              onBlur={save}
              className="h-8 text-xs"
            />
          </div>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                Etiquetas
              </Label>
              <div className="flex flex-wrap gap-1">
                {task.labels.map((l: any) => (
                  <span
                    key={l.id}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: l.color }}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links CRM */}
          {(task.deal || task.contact) && (
            <div className="space-y-1.5 border-t border-border/30 pt-3">
              <Label className="text-xs text-muted-foreground">Vinculado a</Label>
              {task.deal && (
                <Link
                  href={`/dashboard/deals/${task.deal.id}`}
                  className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1 text-xs hover:bg-muted/50"
                >
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  {task.deal.title}
                </Link>
              )}
              {task.contact && (
                <Link
                  href={`/dashboard/contacts/${task.contact.id}`}
                  className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1 text-xs hover:bg-muted/50"
                >
                  <ContactIcon className="h-3 w-3 text-muted-foreground" />
                  {task.contact.name}
                </Link>
              )}
            </div>
          )}

          {/* Creator / dates */}
          <div className="space-y-1 border-t border-border/30 pt-3 text-[10px] text-muted-foreground">
            <div>
              Criado por{' '}
              <span className="font-medium text-foreground">
                {task.creator?.name || task.creator?.email}
              </span>
            </div>
            <div>
              em {formatDateBR(task.createdAt)}
            </div>
          </div>
        </div>

        {/* Time tracker */}
        <TimeTrackerWidget taskId={task.id} />

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={save}
            disabled={saving}
            size="sm"
            className="w-full gap-1.5"
          >
            <Save className="h-3 w-3" />
            {saving ? tCommon('buttons.saving') : tCommon('buttons.save')}
          </Button>
          <Button
            onClick={remove}
            disabled={deleting}
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            {deleting ? tCommon('buttons.loading') : t('deleteTask')}
          </Button>
        </div>
      </aside>
    </div>
  )
}
