import type { getDealDetails } from '@/app/[locale]/dashboard/deals/actions'
import type { PipelineDeal } from '@/lib/types/pipeline'

/** Full deal payload as serialized by the getDealDetails server action. */
export type FullDeal = Awaited<ReturnType<typeof getDealDetails>>
export type DealNote = FullDeal['notes'][number]
export type DealActivity = FullDeal['activities'][number]

/**
 * Shape returned by getDealClosings / addDealClosing (declared explicitly —
 * the action body still goes through `prisma.dealClosing as any`, so its
 * inferred return type is useless). `userName` only comes from the list
 * endpoint; a freshly created closing won't have it until the next refetch.
 */
export interface DealClosing {
  id: string
  value: number
  date: string
  createdAt: string
  note?: string | null
  userName?: string | null
  productName: string | null
  productId: string | null
}

export type SimpleDeal = {
  id: string
  title: string
  value: number | null
  stageId: string
  status?: string | null
  contactId?: string | null
  closeDate?: string | Date | null
  dueDate?: string | Date | null
}

export interface ContactOption {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  company?: string | null
}

/** /api/products serializes Prisma Decimal price as a string. */
export interface ProductOption {
  id: string
  name: string
  price: number | string | null
}

export interface PipelineOption {
  id: string
  name: string
  stages: { id: string; name: string }[]
}

export type ContactDisplayMode = 'name' | 'company'

export interface EditDealDialogProps {
  deal: SimpleDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  stages: { id: string; name: string }[]
  contacts: ContactOption[]
  onOptimisticUpdate?: (dealId: string, updates: Partial<PipelineDeal>) => void
  onOptimisticDelete?: (dealId: string) => void
  onRollback?: (tempId: string) => void
  onSuccess?: () => void
  currentUserId?: string
  canViewClosings?: boolean
  contactDisplayMode?: ContactDisplayMode
  onContactDisplayModeChange?: (mode: ContactDisplayMode) => void
}
