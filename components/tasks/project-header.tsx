'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, LayoutList } from 'lucide-react'
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 w-full mb-2">
      {/* Premium Icon Block */}
      <div className="relative group">
        <div 
          className="absolute inset-0 blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500 rounded-2xl"
          style={{ backgroundColor: projectColor }}
        />
        <div
          className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-[1.25rem] text-white text-2xl sm:text-3xl font-black shadow-xl ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105"
          style={{ 
            background: `linear-gradient(135deg, ${projectColor} 0%, ${projectColor}dd 100%)` 
          }}
        >
          {projectName.charAt(0).toUpperCase()}
        </div>
      </div>
      
      {/* Title & Info */}
      <div className="space-y-3 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          {canEdit ? (
            <InlineEditTitle
              value={projectName}
              onSave={handleRename}
              className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground hover:text-primary transition-colors"
              inputClassName="font-display text-3xl sm:text-4xl font-extrabold tracking-tight"
            />
          ) : (
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground truncate">
              {projectName}
            </h1>
          )}
        </div>
        
        {projectDescription && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
            {projectDescription}
          </p>
        )}
        
        {/* Modern Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/60 border border-border/50 text-xs font-semibold text-secondary-foreground shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 opacity-70" />
            <span>{taskCount} tarefas</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/60 border border-border/50 text-xs font-semibold text-secondary-foreground shadow-sm">
            <LayoutList className="w-3.5 h-3.5 opacity-70" />
            <span>{statusCount} status</span>
          </div>
        </div>
      </div>
    </div>
  )
}
