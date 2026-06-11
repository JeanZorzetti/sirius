/**
 * Domain types for the sales pipeline UI.
 *
 * They mirror the serialized shape produced by DashboardTabsWrapper
 * (Prisma Decimal → number, DateTime → ISO string) and are the contract
 * between the dashboard server components and the kanban/list/dialog UI.
 *
 * Enum fields stay anchored to the Prisma client so schema changes
 * propagate here at compile time.
 */
import type { DealStatus, PipelineStageType } from '@prisma/client'

/** Contact summary carried with deals and offered in the deal dialogs */
export interface PipelineContact {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
}

/** Deal as serialized for the dashboard (see DashboardTabsWrapper) */
export interface PipelineDeal {
  id: string
  title: string
  value: number | null
  stageId: string
  pipelineId: string
  contactId: string | null
  userId: string
  organizationId: string
  order: number | null
  status: DealStatus
  lostReason: string | null
  observations: string | null
  archived: boolean
  archivedReason: string | null
  archivedAt: Date | null
  closeDate: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  contact: PipelineContact | null
}

/** Pipeline row for the selector (with aggregate counts) */
export interface PipelineSummary {
  id: string
  name: string
  isDefault: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
  _count: { stages: number; deals: number }
}

/** Client-side optimistic deal, created before the server responds */
export interface OptimisticDeal {
  id: string
  title: string
  value: number | null
  stageId: string
  contactId: string | null
  contact: PipelineContact | null
  createdAt: string
  updatedAt: string
  isOptimistic: true
}

/** Kanban column: a stage with its (already filtered) deals */
export interface PipelineStageWithDeals {
  id: string
  name: string
  order: number
  type: PipelineStageType
  organizationId: string
  pipelineId: string
  createdAt: string
  updatedAt: string
  deals: PipelineDeal[]
}
