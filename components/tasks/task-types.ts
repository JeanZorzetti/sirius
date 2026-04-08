import type { TaskPriority, TaskStatusType } from '@prisma/client'

export interface TaskStatusLite {
  id: string
  name: string
  color: string
  type: TaskStatusType
  order: number
  isDefault: boolean
}

export interface TaskLabelLite {
  id: string
  name: string
  color: string
  projectId: string
}

export interface TaskUserLite {
  id: string
  name: string | null
  email: string
}

export interface TaskProjectLite {
  id: string
  name: string
  color: string
  icon: string | null
  description: string | null
  archived: boolean
  order: number
  statuses?: TaskStatusLite[]
  _count?: { tasks: number }
}

export interface TaskLite {
  id: string
  title: string
  description: string | null
  priority: TaskPriority
  order: number
  dueDate: Date | string | null
  startDate: Date | string | null
  completedAt: Date | string | null
  estimatedMinutes: number | null
  archived: boolean
  createdAt: Date | string
  updatedAt: Date | string
  projectId: string
  statusId: string
  assigneeId: string | null
  creatorId: string
  parentId: string | null
  dealId: string | null
  contactId: string | null
  status?: TaskStatusLite
  assignee?: TaskUserLite | null
  creator?: TaskUserLite
  labels?: TaskLabelLite[]
  project?: { id: string; name: string; color: string }
  deal?: { id: string; title: string } | null
  contact?: { id: string; name: string } | null
  _count?: {
    subtasks: number
    comments: number
    checklists: number
    timeEntries?: number
  }
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  NONE: { label: 'Nenhuma', color: 'text-zinc-400', icon: '○' },
  LOW: { label: 'Baixa', color: 'text-sky-500', icon: '↓' },
  MEDIUM: { label: 'Média', color: 'text-amber-500', icon: '=' },
  HIGH: { label: 'Alta', color: 'text-orange-500', icon: '↑' },
  URGENT: { label: 'Urgente', color: 'text-red-500', icon: '!!' },
}

export const STATUS_TYPE_CONFIG: Record<TaskStatusType, { label: string; defaultColor: string }> = {
  OPEN: { label: 'Aberto', defaultColor: '#94a3b8' },
  IN_PROGRESS: { label: 'Em Progresso', defaultColor: '#3b82f6' },
  DONE: { label: 'Concluído', defaultColor: '#22c55e' },
  CLOSED: { label: 'Fechado', defaultColor: '#64748b' },
}
