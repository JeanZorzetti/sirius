'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Smartphone, Wifi, WifiOff, RefreshCw, QrCode } from 'lucide-react'
import QRCode from 'qrcode'

type Step = 'idle' | 'creating' | 'qr' | 'connected' | 'error'

export function WhatsmeowConnectCard() {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('idle')
  const [instanceName, setInstanceName] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [gatewayInstanceId, setGatewayInstanceId] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    return () => eventSourceRef.current?.close()
  }, [])

  async function handleCreate() {
    if (!instanceName.trim()) return
    setStep('creating')

    try {
      const res = await fetch('/api/whatsapp/connections/whatsmeow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: instanceName.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ title: 'Erro', description: data.error, variant: 'destructive' })
        setStep('idle')
        return
      }

      setGatewayInstanceId(data.gatewayInstanceId)
      setStep('qr')
      startQRStream(`/api/whatsapp/connections/whatsmeow/${data.gatewayInstanceId}/qr`)
    } catch {
      toast({ title: 'Erro', description: 'Falha ao criar instância.', variant: 'destructive' })
      setStep('idle')
    }
  }

  function startQRStream(url: string) {
    eventSourceRef.current?.close()

    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('qr', async (e) => {
      try {
        const dataUrl = await QRCode.toDataURL(e.data, { width: 256, margin: 1 })
        setQrDataUrl(dataUrl)
      } catch {
        setQrDataUrl(null)
      }
    })

    es.onerror = () => {
      // SSE closes after QR scan (success) or timeout
      es.close()
    }
  }

  function handleReset() {
    eventSourceRef.current?.close()
    setStep('idle')
    setInstanceName('')
    setQrDataUrl(null)
    setGatewayInstanceId(null)
  }

  function handleRefreshQR() {
    if (!gatewayInstanceId) return
    startQRStream(`/api/whatsapp/connections/whatsmeow/${gatewayInstanceId}/qr`)
  }

  return (
    <Card className="bg-white dark:bg-white/[0.02] border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
            <Smartphone className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">WhatsApp via Whatsmeow</CardTitle>
            <CardDescription className="text-xs">
              Conexão direta — sem Evolution API
            </CardDescription>
          </div>
          <div className="ml-auto">
            <StatusBadge step={step} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 'idle' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome da instância</Label>
              <Input
                placeholder="ex: principal, vendas, suporte"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="h-9 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Apenas letras, números e hífen.
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!instanceName.trim()}
              size="sm"
              className="w-full h-9 gap-2"
            >
              <QrCode className="h-3.5 w-3.5" />
              Criar e conectar
            </Button>
          </div>
        )}

        {step === 'creating' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Criando instância...</p>
          </div>
        )}

        {step === 'qr' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground text-center">
              Abra o WhatsApp no celular →{' '}
              <span className="font-medium text-foreground">Dispositivos conectados</span> → Conectar dispositivo
            </p>

            <div className="relative">
              {qrDataUrl ? (
                <div className="rounded-xl overflow-hidden ring-1 ring-border/50 shadow-sm">
                  <img
                    src={qrDataUrl}
                    alt="QR Code WhatsApp"
                    width={224}
                    height={224}
                    className="block"
                  />
                </div>
              ) : (
                <QRSkeleton />
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshQR}
                className="flex-1 h-8 gap-1.5 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Novo QR
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="flex-1 h-8 text-xs text-muted-foreground"
              >
                Cancelar
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              O QR expira em 60 segundos. Após escanear, a página atualiza automaticamente.
            </p>
          </div>
        )}

        {step === 'connected' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">Conectado com sucesso!</p>
            <p className="text-xs text-muted-foreground text-center">
              Mensagens recebidas serão salvas automaticamente no CRM.
            </p>
            <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs">
              Adicionar outra instância
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ step }: { step: Step }) {
  if (step === 'connected')
    return (
      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5 text-[11px] gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Conectado
      </Badge>
    )
  if (step === 'qr' || step === 'creating')
    return (
      <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5 text-[11px] gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Aguardando
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-muted-foreground text-[11px] gap-1">
      <WifiOff className="h-2.5 w-2.5" />
      Inativo
    </Badge>
  )
}

function QRSkeleton() {
  return (
    <div className="h-56 w-56 rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <QrCode className="h-8 w-8 text-muted-foreground/30" />
    </div>
  )
}
