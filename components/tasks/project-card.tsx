'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FolderKanban, MoreHorizontal, Pencil, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
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

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    color: string
  }
  total: number
  done: number
  overdue: number
  progress: number
}

export function ProjectCard({ project, total, done, overdue, progress }: ProjectCardProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editDescription, setEditDescription] = useState(project.description ?? '')
  const [editColor, setEditColor] = useState(project.color)

  function openEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setEditName(project.name)
    setEditDescription(project.description ?? '')
    setEditColor(project.color)
    setEditOpen(true)
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
      toast.success('Projeto excluído')
      router.refresh()
    } catch {
      toast.error('Erro ao excluir projeto')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/task-projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          color: editColor,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Projeto atualizado')
      setEditOpen(false)
      router.refresh()
    } catch {
      toast.error('Erro ao salvar projeto')
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
                  Editar projeto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openDelete} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Excluir projeto
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
              <DialogTitle>Editar projeto</DialogTitle>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !editName.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai excluir permanentemente <strong>{project.name}</strong> e todas as suas tarefas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
