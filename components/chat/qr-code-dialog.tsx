'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

interface Connection {
  id: string
  instanceName: string
  status: string
}

interface QRCodeDialogProps {
  connection: Connection
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRCodeDialog({ connection, open, onOpenChange }: QRCodeDialogProps) {
  const router = useRouter()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const fetchQRCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/whatsapp/connections/${connection.id}/qr-code`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao buscar QR Code')
      }

      setQrCode(data.qrCode)
    } catch (error: any) {
      setError(error.message)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkStatus = async () => {
    setIsChecking(true)
    try {
      const res = await fetch(`/api/whatsapp/connections/${connection.id}/status`)
      const data = await res.json()

      if (data.status === 'CONNECTED') {
        toast.success('WhatsApp conectado com sucesso! Sincronizando conversas...')

        // Trigger sync of existing conversations from Evolution API
        try {
          await fetch(`/api/whatsapp/connections/${connection.id}/sync`, {
            method: 'POST',
          })
          toast.success('Conversas sincronizadas!')
        } catch (syncError) {
          console.error('Sync error:', syncError)
          // Non-blocking - sync failure shouldn't prevent usage
        }

        onOpenChange(false)
        router.refresh()
      } else if (data.status === 'DISCONNECTED') {
        toast.error('Conexão falhou. Tente novamente.')
        setError('Conexão falhou')
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchQRCode()

      // Verificar status a cada 3 segundos
      const interval = setInterval(checkStatus, 3000)

      return () => clearInterval(interval)
    }
  }, [open, connection.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu WhatsApp para conectar
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-destructive text-center">{error}</p>
              <Button onClick={fetchQRCode} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          ) : qrCode ? (
            <>
              <div className="relative w-64 h-64 bg-white p-4 rounded-lg">
                <Image
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  fill
                  className="object-contain"
                />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Como escanear:</p>
                <ol className="text-xs text-muted-foreground space-y-1 text-left">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Toque em Mais opções ou Configurações</li>
                  <li>3. Toque em Dispositivos conectados</li>
                  <li>4. Toque em Conectar um dispositivo</li>
                  <li>5. Aponte seu telefone para esta tela</li>
                </ol>
              </div>

              {isChecking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando conexão...
                </div>
              )}

              <Button onClick={fetchQRCode} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar QR Code
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
