'use client'

import { EmailAutomationType, EmailStatus } from '@prisma/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle, Eye, MousePointer, XCircle, Clock } from 'lucide-react'

interface EmailLog {
  id: string
  type: EmailAutomationType
  to: string
  subject: string
  status: EmailStatus
  sentAt: Date
  deliveredAt: Date | null
  openedAt: Date | null
  clickedAt: Date | null
  errorMessage: string | null
  user: {
    name: string | null
    email: string
  } | null
}

interface EmailHistoryTableProps {
  logs: EmailLog[]
  isPro: boolean
}

const statusConfig = {
  SENT: {
    label: 'Enviado',
    icon: Mail,
    color: 'bg-blue-100 text-blue-800'
  },
  DELIVERED: {
    label: 'Entregue',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800'
  },
  OPENED: {
    label: 'Aberto',
    icon: Eye,
    color: 'bg-purple-100 text-purple-800'
  },
  CLICKED: {
    label: 'Clicado',
    icon: MousePointer,
    color: 'bg-indigo-100 text-indigo-800'
  },
  BOUNCED: {
    label: 'Rejeitado',
    icon: XCircle,
    color: 'bg-red-100 text-red-800'
  },
  FAILED: {
    label: 'Falhou',
    icon: XCircle,
    color: 'bg-red-100 text-red-800'
  }
}

const typeLabels = {
  WELCOME_EMAIL: 'Boas-vindas',
  DEAL_CREATED: 'Deal Criado',
  DEAL_STAGE_CHANGED: 'Mudança de Etapa',
  UPGRADE_NUDGE: 'Sugestão Upgrade'
}

export function EmailHistoryTable({ logs, isPro }: EmailHistoryTableProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum email enviado ainda</h3>
        <p className="text-sm text-muted-foreground">
          Os emails enviados automaticamente aparecerão aqui
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Para</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enviado</TableHead>
            {isPro && <TableHead>Analytics</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const StatusIcon = statusConfig[log.status].icon
            return (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant="outline">
                    {typeLabels[log.type]}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {log.to}
                  {log.user?.name && (
                    <div className="text-xs text-muted-foreground">
                      {log.user.name}
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {log.subject}
                </TableCell>
                <TableCell>
                  <Badge className={statusConfig[log.status].color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[log.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(log.sentAt)}
                </TableCell>
                {isPro && (
                  <TableCell>
                    <div className="flex gap-2 text-xs">
                      {log.deliveredAt && (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Entregue
                        </Badge>
                      )}
                      {log.openedAt && (
                        <Badge variant="outline" className="gap-1">
                          <Eye className="h-3 w-3 text-purple-600" />
                          Aberto
                        </Badge>
                      )}
                      {log.clickedAt && (
                        <Badge variant="outline" className="gap-1">
                          <MousePointer className="h-3 w-3 text-indigo-600" />
                          Clicado
                        </Badge>
                      )}
                      {!log.deliveredAt && !log.openedAt && !log.clickedAt && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Processando
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
