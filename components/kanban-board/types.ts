import type { PipelineDeal } from '@/lib/types/pipeline'

export type Deal = {
  id: string
  title: string
  value: number | null
  stageId: string
  status?: string
  contact?: {
    name: string
    phone?: string | null
    company?: string | null
  } | null
  closeDate?: string | Date | null
  dueDate?: string | Date | null
}

export type Stage = {
  id: string
  name: string
  order: number
  deals: Deal[]
}

export type Contact = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  company?: string | null
}

export type KanbanBoardProps = {
  stages: Stage[]
  contacts: Contact[]
  pipelineId?: string
  currentUserId?: string
  canViewClosings?: boolean
  onOptimisticUpdate?: (dealId: string, updates: Partial<PipelineDeal>) => void
  onOptimisticDelete?: (dealId: string) => void
  onRollback?: (tempId: string) => void
  onSuccess?: () => void
}

export type ContactDisplayMode = 'name' | 'company'

export const LOST_COLUMN_ID = '__PERDIDO__'

export const LOST_REASONS = [
  'Preço alto',
  'Concorrente escolhido',
  'Sem orçamento',
  'Sem resposta',
  'Fora do escopo',
  'Timing ruim',
  'Produto inadequado',
]
