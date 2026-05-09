'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Smartphone, Wifi, WifiOff, RefreshCw, QrCode, Trash2, Plus } from 'lucide-react'
import QRCode from 'qrcode'

type Step = 'idle' | 'creating' | 'qr' | 'verifying' | 'connected' | 'error'

// Gateway instance (fonte de verdade)
interface GatewayInstance {
  id: string
  name: string
  status: string
  phoneNumber: string | null
  organizationId: string
}

export function WhatsmeowConnectCard() {
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('idle')
  const [instanceName, setInstanceName] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [gatewayInstanceId, setGatewayInstanceId] = useState<string | null>(null)
  const gatewayInstanceIdRef = useRef<string | null>(null)
  const [instances, setInstances] = useState<GatewayInstance[]>([])
  const [loadingInstances, setLoadingInstances] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/connections/whatsmeow')
      if (res.ok) {
        const data = await res.json()
        setInstances(data)
      }
    } catch {
      // silent
    } finally {
      setLoadingInstances(false)
    }
  }, [])

  useEffect(() => {
    fetchInstances()
    return () => eventSourceRef.current?.close()
  }, [fetchInstances])

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
      gatewayInstanceIdRef.current = data.gatewayInstanceId
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
    let receivedQR = false

    es.addEventListener('qr', async (e) => {
      receivedQR = true
      try {
        const dataUrl = await QRCode.toDataURL(e.data, { width: 256, margin: 1 })
        setQrDataUrl(dataUrl)
      } catch {
        setQrDataUrl(null)
      }
    })

    es.onerror = () => {
      es.close()
      // Se já tinha QR e o stream fechou → provavelmente escaneou com sucesso
      if (receivedQR) {
        pollForConnection()
      } else {
        fetchInstances()
      }
    }
  }

  async function pollForConnection() {
    const instId = gatewayInstanceIdRef.current
    if (!instId) { fetchInstances(); return }
    setStep('verifying')

    const maxAttempts = 12 // 12 × 1.5s = 18s
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 1500))
      try {
        const res = await fetch(`/api/whatsapp/connections/whatsmeow/${instId}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.connected || data.status === 'connected') {
            setStep('connected')
            fetchInstances()
            return
          }
        }
      } catch {
        // continue polling
      }
    }
    // Timeout — atualiza lista e volta ao idle (pode ter conectado mas status atrasado)
    fetchInstances()
    setStep('idle')
  }

  function handleReset() {
    eventSourceRef.current?.close()
    setStep('idle')
    setInstanceName('')
    setQrDataUrl(null)
    setGatewayInstanceId(null)
    gatewayInstanceIdRef.current = null
    setShowForm(false)
    fetchInstances()
  }

  function handleRefreshQR() {
    if (!gatewayInstanceId) return
    startQRStream(`/api/whatsapp/connections/whatsmeow/${gatewayInstanceId}/qr`)
  }

  async function handleDelete(gatewayId: string, label: string) {
    if (!confirm(`Deletar a instância "${label}"?\nEsta ação remove do gateway e não pode ser desfeita.`)) return
    setDeletingId(gatewayId)
    try {
      const res = await fetch(`/api/whatsapp/connections/whatsmeow/${gatewayId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Instância deletada', description: `"${label}" removida com sucesso.` })
        fetchInstances()
      } else {
        const data = await res.json()
        toast({ title: 'Erro ao deletar', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao deletar instância.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const isCreating = step === 'creating' || step === 'qr' || step === 'verifying'

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
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lista de conexões existentes */}
        {loadingInstances ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Carregando instâncias...</span>
          </div>
        ) : instances.length > 0 ? (
          <div className="space-y-2">
            {instances.map((inst) => (
              <div
                key={inst.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <StatusDot status={inst.status} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{inst.name || inst.id}</p>
                    {inst.phoneNumber && (
                      <p className="text-[11px] text-muted-foreground">{inst.phoneNumber}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 truncate font-mono">{inst.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadgeSmall status={inst.status} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(inst.id, inst.name || inst.id)}
                    disabled={deletingId === inst.id}
                  >
                    {deletingId === inst.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Formulário / QR de nova instância */}
        {!isCreating && !showForm && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 gap-2 text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            {tCommon('buttons.add')}
          </Button>
        )}

        {!isCreating && showForm && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome da instância</Label>
              <Input
                placeholder="ex: principal, vendas, suporte"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="h-9 text-sm"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Apenas letras, números e hífen.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!instanceName.trim()}
                size="sm"
                className="flex-1 h-9 gap-2"
              >
                <QrCode className="h-3.5 w-3.5" />
                Criar e conectar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-xs text-muted-foreground"
                onClick={() => { setShowForm(false); setInstanceName('') }}
              >
                {tCommon('buttons.cancel')}
              </Button>
            </div>
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
                {tCommon('buttons.cancel')}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              O QR expira em 60 segundos. Escaneie com o celular para conectar.
            </p>
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Verificando conexão...</p>
              <p className="text-xs text-muted-foreground mt-1">
                QR escaneado! Aguardando confirmação do WhatsApp.
              </p>
            </div>
          </div>
        )}

        {step === 'connected' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center ring-2 ring-emerald-500/30">
              <Wifi className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Conectado com sucesso!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mensagens recebidas serão salvas automaticamente no CRM.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs mt-1">
              {tCommon('buttons.add')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusDot({ status }: { status: string }) {
  const s = status.toUpperCase()
  const color =
    s === 'CONNECTED' ? 'bg-emerald-500' :
    s === 'CONNECTING' ? 'bg-amber-500 animate-pulse' :
    'bg-zinc-400'
  return <span className={`h-2 w-2 rounded-full flex-shrink-0 ${color}`} />
}

function StatusBadgeSmall({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (s === 'CONNECTED')
    return (
      <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5 text-[10px] px-1.5 py-0">
        <Wifi className="h-2.5 w-2.5 mr-1" />
        Ativo
      </Badge>
    )
  if (s === 'CONNECTING')
    return (
      <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5 text-[10px] px-1.5 py-0">
        Conectando
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0">
      <WifiOff className="h-2.5 w-2.5 mr-1" />
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
