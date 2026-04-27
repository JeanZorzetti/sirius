import { Badge } from '@/components/ui/badge'
import type { TicketPriority } from '@prisma/client'

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; className: string }> = {
  LOW: { label: 'Baixa', className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
  NORMAL: { label: 'Normal', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  HIGH: { label: 'Alta', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  URGENT: { label: 'Urgente', className: 'bg-red-100 text-red-700 border-red-200' },
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
