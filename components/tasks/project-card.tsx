'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FolderKanban, MoreHorizontal, Pencil, Trash2, CheckCircle2, Loader2, Lock, Globe } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b',
]

const ROLE_OPTIONS = [
  { value: 'GERENTE',     label: 'Gerente',     color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-purple-500/20' },
  { value: 'COORDENADOR', label: 'Coordenador', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/20' },
  { value: 'SUPERVISOR',  label: 'Supervisor',  color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/20' },
  { value: 'VENDEDOR',    label: 'Vendedor',    color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 ring-zinc-500/20' },
] as const

type AllowedRole = 'GERENTE' | 'COORDENADOR' | 'SUPERVISOR' | 'VENDEDOR'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    color: string
    allowedRoles: string[]
  }
  total: number
  done: number
  overdue: number
  progress: number
  canManageRoles?: boolean
}

export function ProjectCard({ project, total, done, overdue, progress, canManageRoles = false }: ProjectCardProps) {
  const router = useRouter()
  const tCommon = useTranslations('common')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editDescription, setEditDescription] = useState(project.description ?? '')
  const [editColor, setEditColor] = useState(project.color)
  const [editAllowedRoles, setEditAllowedRoles] = useState<AllowedRole[]>(
    (project.allowedRoles ?? []) as AllowedRole[]
  )

  function openEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setEditName(project.name)
    setEditDescription(project.description ?? '')
    setEditColor(project.color)
    setEditAllowedRoles((project.allowedRoles ?? []) as AllowedRole[])
    setEditOpen(true)
  }

  function toggleRole(role: AllowedRole) {
    setEditAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  function openDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDeleteOpen(true)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/task-projects/${project.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(tCommon('toasts.deleted'))
      router.refresh()
    } catch {
      toast.error(tCommon('toasts.failedDelete'))
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) { toast.error(tCommon('toasts.failed')); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/task-projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          color: editColor,
          ...(canManageRoles && { allowedRoles: editAllowedRoles }),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(tCommon('toasts.updated'))
      setEditOpen(false)
      router.refresh()
    } catch {
      toast.error(tCommon('toasts.failedSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:bg-card">
        {/* Hover glow */}
        <div
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${project.color} 0%, transparent 60%)` }}
        />
        {/* Accent top bar */}
        <div
          className="absolute inset-x-0 top-0 h-1.5 opacity-80 transition-all duration-300 scale-x-0 group-hover:scale-x-100 origin-left"
          style={{ backgroundColor: project.color }}
        />

        <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
          <Link href={`/dashboard/tasks/${project.id}`} className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-white shadow-lg ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{ backgroundColor: project.color }}
            >
              <FolderKanban className="h-6 w-6" strokeWidth={2.5} />
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {(project.allowedRoles ?? []).length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20 shadow-sm">
                <Lock className="h-2.5 w-2.5" />
                Restrito
              </span>
            )}
            {overdue > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-500 ring-1 ring-inset ring-rose-500/20 shadow-sm">
                {overdue} {overdue !== 1 ? 'atrasadas' : 'atrasada'}
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-muted focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Opções do projeto"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={openEdit} className="gap-2 cursor-pointer">
                  <Pencil className="h-4 w-4" />
                  {tCommon('buttons.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  {tCommon('buttons.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Link href={`/dashboard/tasks/${project.id}`} className="relative z-10 flex flex-col flex-1">
          <h3 className="text-xl font-bold tracking-tight leading-tight text-foreground group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          {project.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground/50 italic">Sem descrição</p>
          )}

          <div className="mt-auto pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                {done} <span className="text-muted-foreground/50 font-normal">/ {total}</span>
              </span>
              <span className="tabular-nums" style={{ color: project.color }}>{progress}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/60">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out shadow-inner"
                style={{ width: `${progress}%`, backgroundColor: project.color }}
              />
            </div>
          </div>
        </Link>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{tCommon('buttons.edit')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nome do projeto"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-desc">Descrição</Label>
                <Textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Do que se trata este projeto?"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={cn(
                        'h-7 w-7 rounded-full border-2 transition-all',
                        editColor === c ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
              </div>

              {canManageRoles && (
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Visibilidade por cargo
                    </Label>
                    {editAllowedRoles.length === 0 ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Globe className="h-3 w-3" />
                        Todos os cargos
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        {editAllowedRoles.length} cargo{editAllowedRoles.length > 1 ? 's' : ''} selecionado{editAllowedRoles.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed -mt-1">
                    Selecione os cargos que podem ver este projeto. Sem seleção = visível para todos.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((role) => {
                      const active = editAllowedRoles.includes(role.value)
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => toggleRole(role.value)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-all duration-150',
                            active
                              ? role.color
                              : 'bg-muted/50 text-muted-foreground ring-border/50 hover:bg-muted'
                          )}
                        >
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                          {role.label}
                        </button>
                      )
                    })}
                  </div>
                  {editAllowedRoles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditAllowedRoles([])}
                      className="self-start text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                    >
                      Limpar restrições
                    </button>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>
                {tCommon('buttons.cancel')}
              </Button>
              <Button type="submit" disabled={saving || !editName.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon('buttons.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('buttons.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai excluir permanentemente <strong>{project.name}</strong> e todas as suas tarefas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tCommon('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
