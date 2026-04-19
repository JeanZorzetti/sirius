'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, QrCode, Power, Trash2, RefreshCw, Wifi, WifiOff, Smartphone, Clock } from 'lucide-react'
import { NewConnectionDialog } from './new-connection-dialog'
import { QRCodeDialog } from './qr-code-dialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

interface Connection {
  id: string
  instanceName: string
  status: string
  phoneNumber: string | null
  connectedAt: Date | null
  createdAt: Date
}

interface ConnectionManagerProps {
  connections: Connection[]
  maxInstances: number
}

export function ConnectionManager({ connections, maxInstances }: ConnectionManagerProps) {
  const router = useRouter()
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [selectedConnectionForQR, setSelectedConnectionForQR] = useState<Connection | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'disconnect' | 'delete'; id: string } | null>(null)

  const activeConnections = connections.filter(c => c.status === 'CONNECTED' || c.status === 'CONNECTING')
  const canAddMore = activeConnections.length < maxInstances

  const handleDisconnect = async (connectionId: string) => {
    setLoadingId(connectionId)
    try {
      const res = await fetch(`/api/whatsapp/connections/${connectionId}/disconnect`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao desconectar')
      }
      toast.success('WhatsApp desconectado')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desconectar')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (connectionId: string) => {
    setLoadingId(connectionId)
    try {
      const res = await fetch(`/api/whatsapp/connections/${connectionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao deletar')
      }
      toast.success('Conexão removida')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover conexão')
    } finally {
      setLoadingId(null)
    }
  }

  const statusConfig = {
    CONNECTED: {
      dot: 'bg-emerald-500',
      bg: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20',
      icon: Wifi,
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      label: 'Conectado',
      labelClass: 'text-emerald-700 dark:text-emerald-400',
    },
    CONNECTING: {
      dot: 'bg-amber-500 animate-pulse',
      bg: 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20',
      icon: RefreshCw,
      iconClass: 'text-amber-600 dark:text-amber-400 animate-spin',
      label: 'Conectando...',
      labelClass: 'text-amber-700 dark:text-amber-400',
    },
    DISCONNECTED: {
      dot: 'bg-zinc-400',
      bg: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50',
      icon: WifiOff,
      iconClass: 'text-zinc-400 dark:text-zinc-500',
      label: 'Desconectado',
      labelClass: 'text-zinc-500 dark:text-zinc-400',
    },
  }

  const getConfig = (status: string) =>
    statusConfig[status as keyof typeof statusConfig] || statusConfig.DISCONNECTED

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Conexões WhatsApp</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeConnections.length} de {maxInstances} {maxInstances === 1 ? 'conexão ativa' : 'conexões ativas'}
          </p>
        </div>
        <Button
          onClick={() => setIsNewDialogOpen(true)}
          disabled={!canAddMore}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      {/* Empty */}
      {connections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-[260px]">
              Nenhuma conexão WhatsApp.
              Clique em <strong>"Nova Conexão"</strong> para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {connections.map((connection) => {
            const cfg = getConfig(connection.status)
            const StatusIcon = cfg.icon
            const isLoading = loadingId === connection.id

            return (
              <Card
                key={connection.id}
                className={cn('transition-colors duration-200', cfg.bg)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                        <StatusIcon className={cn('h-4.5 w-4.5', cfg.iconClass)} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {connection.displayName || connection.phoneNumber || connection.instanceName}
                        </span>
                        <span className={cn('flex items-center gap-1.5 text-xs font-medium', cfg.labelClass)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {(connection.phoneNumber || connection.displayName) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {connection.displayName && connection.phoneNumber
                              ? `${connection.phoneNumber}`
                              : connection.instanceName}
                          </span>
                        )}
                        {connection.connectedAt && connection.status === 'CONNECTED' && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Desde {new Date(connection.connectedAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {connection.status === 'CONNECTING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedConnectionForQR(connection)}
                          disabled={isLoading}
                          className="h-8"
                        >
                          <QrCode className="mr-1.5 h-3.5 w-3.5" />
                          QR Code
                        </Button>
                      )}

                      {connection.status === 'DISCONNECTED' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedConnectionForQR(connection)}
                            disabled={isLoading}
                            className="h-8"
                          >
                            <QrCode className="mr-1.5 h-3.5 w-3.5" />
                            Reconectar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'delete', id: connection.id })}
                            disabled={isLoading}
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {isLoading ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </>
                      )}

                      {connection.status === 'CONNECTED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmAction({ type: 'disconnect', id: connection.id })}
                          disabled={isLoading}
                          className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          {isLoading ? (
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Power className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Desconectar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <NewConnectionDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
      />

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.type === 'disconnect' ? 'Desconectar WhatsApp' : 'Remover conexão'}
        description={confirmAction?.type === 'disconnect'
          ? 'Tem certeza que deseja desconectar? Você precisará escanear o QR Code novamente.'
          : 'Tem certeza que deseja remover permanentemente? Esta ação não pode ser desfeita.'
        }
        confirmLabel={confirmAction?.type === 'disconnect' ? 'Desconectar' : 'Remover'}
        onConfirm={() => {
          if (confirmAction) {
            if (confirmAction.type === 'disconnect') {
              handleDisconnect(confirmAction.id)
            } else {
              handleDelete(confirmAction.id)
            }
            setConfirmAction(null)
          }
        }}
      />

      {selectedConnectionForQR && (
        <QRCodeDialog
          connection={selectedConnectionForQR}
          open={!!selectedConnectionForQR}
          onOpenChange={(open) => !open && setSelectedConnectionForQR(null)}
        />
      )}
    </div>
  )
}
