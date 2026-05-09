'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, Save, X } from 'lucide-react'
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

interface StatusLite {
  id: string
  name: string
  color: string
  type: string
  order: number
  _count?: { tasks: number }
}

interface LabelLite {
  id: string
  name: string
  color: string
}

interface ProjectSettingsFormProps {
  project: {
    id: string
    name: string
    description: string | null
    color: string
    icon: string | null
  }
  statuses: StatusLite[]
  labels: LabelLite[]
  canEdit: boolean
}

const STATUS_TYPES = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'IN_PROGRESS', label: 'Em Progresso' },
  { value: 'DONE', label: 'Concluído' },
  { value: 'CLOSED', label: 'Fechado' },
]

const PRESET_COLORS = [
  '#94a3b8', '#3b82f6', '#22c55e', '#64748b',
  '#ef4444', '#f59e0b', '#a855f7', '#ec4899',
  '#06b6d4', '#14b8a6',
]

export function ProjectSettingsForm({
  project,
  statuses: initialStatuses,
  labels: initialLabels,
  canEdit,
}: ProjectSettingsFormProps) {
  const router = useRouter()
  const tCommon = useTranslations('common')

  // Project
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [color, setColor] = useState(project.color)
  const [savingProject, setSavingProject] = useState(false)

  // Statuses
  const [statuses, setStatuses] = useState(initialStatuses)
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6')
  const [newStatusType, setNewStatusType] = useState('OPEN')

  // Labels
  const [labels, setLabels] = useState(initialLabels)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#a855f7')

  const saveProject = async () => {
    setSavingProject(true)
    try {
      const res = await fetch(`/api/task-projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color }),
      })
      if (!res.ok) throw new Error('fail')
      toast.success(tCommon('toasts.updated'))
      router.refresh()
    } catch {
      toast.error(tCommon('toasts.failed'))
    } finally {
      setSavingProject(false)
    }
  }

  const addStatus = async () => {
    if (!newStatusName.trim()) return
    try {
      const res = await fetch(`/api/task-projects/${project.id}/statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStatusName,
          color: newStatusColor,
          type: newStatusType,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'fail')
      }
      const created = await res.json()
      setStatuses((prev) => [...prev, created])
      setNewStatusName('')
      toast.success(tCommon('toasts.created'))
    } catch (e: any) {
      toast.error(e.message || tCommon('toasts.failed'))
    }
  }

  const addLabel = async () => {
    if (!newLabelName.trim()) return
    try {
      const res = await fetch(`/api/task-projects/${project.id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelName, color: newLabelColor }),
      })
      if (!res.ok) throw new Error('fail')
      const created = await res.json()
      setLabels((prev) => [...prev, created])
      setNewLabelName('')
      toast.success(tCommon('toasts.created'))
    } catch {
      toast.error(tCommon('toasts.failed'))
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Project info */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <h3 className="text-sm font-semibold">Informações</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Nome, descrição e cor do projeto
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className="mt-1 h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              rows={3}
              className="mt-1 resize-none text-sm"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Cor</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => canEdit && setColor(c)}
                  disabled={!canEdit}
                  className="h-7 w-7 rounded-md ring-2 ring-offset-2 ring-offset-background transition"
                  style={{
                    backgroundColor: c,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {canEdit && (
            <Button
              onClick={saveProject}
              disabled={savingProject}
              size="sm"
              className="w-full gap-1.5"
            >
              <Save className="h-3 w-3" />
              {savingProject ? tCommon('buttons.saving') : tCommon('buttons.save')}
            </Button>
          )}
        </div>
      </div>

      {/* Statuses */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <h3 className="text-sm font-semibold">Statuses</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Colunas do kanban e estados das tarefas
        </p>

        <ul className="mt-4 space-y-2">
          {statuses.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 px-2.5 py-2"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="flex-1 truncate text-xs font-medium">{s.name}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {STATUS_TYPES.find((t) => t.value === s.type)?.label || s.type}
              </span>
              {s._count && (
                <span className="text-[10px] text-muted-foreground">
                  {s._count.tasks}
                </span>
              )}
            </li>
          ))}
        </ul>

        {canEdit && (
          <div className="mt-4 space-y-2 border-t border-border/30 pt-3">
            <Input
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder="Nome do status"
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <Select value={newStatusType} onValueChange={setNewStatusType}>
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-border/40 bg-transparent"
              />
            </div>
            <Button
              onClick={addStatus}
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
            >
              <Plus className="h-3 w-3" />
              {tCommon('buttons.add')}
            </Button>
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <h3 className="text-sm font-semibold">Etiquetas</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Tags para categorizar tarefas
        </p>

        {labels.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border/30 py-4 text-center text-xs text-muted-foreground">
            Nenhuma etiqueta ainda
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {labels.map((l) => (
              <span
                key={l.id}
                className="rounded-full px-2.5 py-1 text-[10px] font-medium text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}

        {canEdit && (
          <div className="mt-4 space-y-2 border-t border-border/30 pt-3">
            <Input
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Nome da etiqueta"
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-border/40 bg-transparent"
              />
              <Button
                onClick={addLabel}
                size="sm"
                variant="outline"
                className="h-8 flex-1 gap-1.5"
              >
                <Plus className="h-3 w-3" />
                {tCommon('buttons.add')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
