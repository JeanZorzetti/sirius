import { Badge } from '@/components/ui/badge'
import type { TicketStatus } from '@prisma/client'

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  OPEN: { label: 'Aberto', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'Em andamento', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  WAITING_USER: { label: 'Aguardando você', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  RESOLVED: { label: 'Resolvido', className: 'bg-green-100 text-green-700 border-green-200' },
  CLOSED: { label: 'Fechado', className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
