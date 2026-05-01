'use client'
import { Clock, CheckCircle2, XCircle, FileEdit, Eye, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  draft:             { label: 'Rascunho',          icon: <FileEdit className="h-3 w-3" />,    class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  awaiting_approval: { label: 'Aguard. aprovação', icon: <Eye className="h-3 w-3" />,          class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  scheduled:         { label: 'Agendado',           icon: <Clock className="h-3 w-3" />,        class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  posted:            { label: 'Publicado',          icon: <CheckCircle2 className="h-3 w-3" />, class: 'bg-green-500/10 text-green-500 border-green-500/20' },
  failed:            { label: 'Erro',               icon: <XCircle className="h-3 w-3" />,      class: 'bg-red-500/10 text-red-500 border-red-500/20' },
  cancelled:         { label: 'Cancelado',          icon: <Ban className="h-3 w-3" />,          class: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
}

export function PostStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <Badge variant="outline" className={`gap-1 text-xs ${cfg.class}`}>
      {cfg.icon} {cfg.label}
    </Badge>
  )
}

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.draft
}
