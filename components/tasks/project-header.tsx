'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { InlineEditTitle } from './inline-edit-title'

interface ProjectHeaderProps {
  projectId: string
  projectName: string
  projectColor: string
  projectDescription?: string | null
  taskCount: number
  statusCount: number
  canEdit?: boolean
}

export function ProjectHeader({
  projectId,
  projectName,
  projectColor,
  projectDescription,
  taskCount,
  statusCount,
  canEdit = false,
}: ProjectHeaderProps) {
  const router = useRouter()

  const handleRename = async (newName: string) => {
    const res = await fetch(`/api/task-projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    if (!res.ok) {
      toast.error('Erro ao renomear projeto')
      throw new Error('fail')
    }
    toast.success('Projeto renomeado')
    router.refresh()
  }

  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white text-lg font-bold"
        style={{ backgroundColor: projectColor }}
      >
        {projectName.charAt(0).toUpperCase()}
      </div>
      <div className="space-y-1 min-w-0">
        {canEdit ? (
          <InlineEditTitle
            value={projectName}
            onSave={handleRename}
            className="font-display text-2xl sm:text-3xl font-bold tracking-tighter text-foreground"
            inputClassName="font-display text-2xl font-bold tracking-tighter"
          />
        ) : (
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tighter text-foreground truncate">
            {projectName}
          </h1>
        )}
        {projectDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {projectDescription}
          </p>
        )}
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span>{taskCount} tarefa(s)</span>
          <span>·</span>
          <span>{statusCount} status</span>
        </div>
      </div>
    </div>
  )
}
