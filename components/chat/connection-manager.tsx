'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Plus, QrCode, Power, Trash2, RefreshCw } from 'lucide-react'
import { NewConnectionDialog } from './new-connection-dialog'
import { QRCodeDialog } from './qr-code-dialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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

  const activeConnections = connections.filter(c => c.status === 'CONNECTED' || c.status === 'CONNECTING')
  const canAddMore = activeConnections.length < maxInstances

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Tem certeza que deseja desconectar este WhatsApp?')) return

    setLoadingId(connectionId)
    try {
      const res = await fetch(`/api/whatsapp/connections/${connectionId}/disconnect`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao desconectar')
      }

      toast.success('WhatsApp desconectado com sucesso')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desconectar')
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (connectionId: string) => {
    if (!confirm('Tem certeza que deseja remover esta conexão permanentemente?')) return

    setLoadingId(connectionId)
    try {
      const res = await fetch(`/api/whatsapp/connections/${connectionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao deletar')
      }

      toast.success('Conexão removida com sucesso')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover conexão')
    } finally {
      setLoadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge className="bg-green-500">Conectado</Badge>
      case 'CONNECTING':
        return <Badge className="bg-yellow-500">Conectando</Badge>
      case 'DISCONNECTED':
        return <Badge variant="secondary">Desconectado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Conexões WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            {activeConnections.length} de {maxInstances} conexões ativas
          </p>
        </div>
        <Button
          onClick={() => setIsNewDialogOpen(true)}
          disabled={!canAddMore}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma conexão WhatsApp ainda.
              <br />
              Clique em "Nova Conexão" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {connection.phoneNumber || connection.instanceName}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {connection.instanceName}
                    </CardDescription>
                  </div>
                  {getStatusBadge(connection.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {connection.connectedAt && (
                  <p className="text-xs text-muted-foreground">
                    Conectado em {new Date(connection.connectedAt).toLocaleString('pt-BR')}
                  </p>
                )}

                <div className="flex gap-2">
                  {connection.status === 'CONNECTING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedConnectionForQR(connection)}
                      disabled={loadingId === connection.id}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Ver QR Code
                    </Button>
                  )}

                  {connection.status === 'CONNECTED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(connection.id)}
                      disabled={loadingId === connection.id}
                    >
                      {loadingId === connection.id ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="mr-2 h-4 w-4" />
                      )}
                      Desconectar
                    </Button>
                  )}

                  {connection.status === 'DISCONNECTED' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(connection.id)}
                      disabled={loadingId === connection.id}
                    >
                      {loadingId === connection.id ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Remover
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewConnectionDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
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
