'use client'

import { useEffect, useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
  }

  const startQRStream = async () => {
    cleanup()
    setIsLoading(true)
    setError(null)
    setQrCode(null)
    setConnected(false)

    try {
      // Connect to CRM's SSE proxy — it forwards the gateway QR stream
      // with proper auth and no CORS issues
      const es = new EventSource(`/api/whatsapp/connections/${connection.id}/qr-code`)
      eventSourceRef.current = es

      es.addEventListener('qr', (e) => {
        // Gateway sends QR as base64 data URL or raw base64
        const qrData = e.data
        if (qrData) {
          setQrCode(qrData.startsWith('data:') ? qrData : `data:image/png;base64,${qrData}`)
          setIsLoading(false)
        }
      })

      es.addEventListener('connected', () => {
        setConnected(true)
        setIsLoading(false)
        cleanup()
        toast.success('WhatsApp conectado!')

        // Trigger sync
        fetch(`/api/whatsapp/connections/${connection.id}/sync`, { method: 'POST' }).catch(() => {})

        setTimeout(() => {
          onOpenChange(false)
          router.refresh()
        }, 1500)
      })

      es.addEventListener('timeout', () => {
        cleanup()
        setError('QR Code expirou. Clique para gerar novamente.')
        setIsLoading(false)
      })

      es.addEventListener('error', (e) => {
        // SSE error event from our proxy (gateway unreachable, instance not found, etc.)
        const evt = e as MessageEvent
        if (evt.data) {
          try {
            const parsed = JSON.parse(evt.data)
            setError(parsed.error || 'Erro no gateway')
          } catch {
            setError('Erro ao conectar com o gateway')
          }
          cleanup()
          setIsLoading(false)
        }
      })

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          if (!qrCode) {
            setError('Não foi possível conectar ao gateway')
          }
          setIsLoading(false)
        }
      }

      // Fallback: also poll status in case we miss the SSE connected event
      statusIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/whatsapp/connections/${connection.id}/status`)
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            if (statusData.status === 'CONNECTED') {
              setConnected(true)
              cleanup()
              toast.success('WhatsApp conectado!')
              setTimeout(() => {
                onOpenChange(false)
                router.refresh()
              }, 1500)
            }
          }
        } catch {
          // Ignore status check errors — the SSE stream is the primary mechanism
        }
      }, 5000)

    } catch (error: any) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      startQRStream()
    } else {
      cleanup()
      setQrCode(null)
      setError(null)
      setConnected(false)
    }
    return cleanup
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
          {connected ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                WhatsApp conectado com sucesso!
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <WifiOff className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-destructive text-center">{error}</p>
              <Button onClick={startQRStream} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          ) : qrCode ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="relative w-64 h-64 bg-white p-3 rounded-lg border">
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-full h-full object-contain"
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

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando conexão...
              </div>

              <Button onClick={startQRStream} variant="outline" size="sm">
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
