'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { FolderKanban, Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
  color: string
}

interface Props {
  projects: Project[]
  currentProjectId?: string
}

export function AnalyticsProjectFilter({ projects, currentProjectId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('projectId')
    } else {
      params.set('projectId', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const selectedValue = currentProjectId ?? 'all'
  const selectedProject = projects.find((p) => p.id === currentProjectId)

  return (
    <Select value={selectedValue} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          'h-9 w-auto min-w-[160px] max-w-[240px] gap-2 rounded-xl',
          'border-border/60 bg-card/40 backdrop-blur-xl text-sm',
          'focus:ring-1 focus:ring-ring'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedProject ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selectedProject.color }}
            />
          ) : (
            <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <SelectValue placeholder="Todos os projetos" />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        <SelectItem value="all" className="gap-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Todos os projetos</span>
          </div>
        </SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id} className="rounded-lg">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate">{project.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
