'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, RefreshCw, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { nomeDoIntegrador, type ConexaoPublica } from './conexao-ui'

interface QRCodeDialogProps {
  connection: ConexaoPublica
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Paired: the parent reloads its connections */
  onConectado?: () => void
}

type Estado =
  | { fase: 'carregando' }
  | { fase: 'qr'; qrCode: string }
  | { fase: 'conectado' }
  | { fase: 'erro'; texto: string }

/** The integrators renew the QR about every 20 s; asking every 3 s keeps it fresh and notices the pairing (FR-007). */
const INTERVALO_MS = 3000

export function QRCodeDialog({ connection, open, onOpenChange, onConectado }: QRCodeDialogProps) {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ativo = useRef(false)
  // the parent re-renders while the connections poll; its callbacks must not restart the QR
  const avisos = useRef({ onConectado, onOpenChange })
  avisos.current = { onConectado, onOpenChange }

  const parar = () => {
    ativo.current = false
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  const consultar = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/connections/${connection.id}/qr-code`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!ativo.current) return
      if (!res.ok) {
        parar()
        setEstado({ fase: 'erro', texto: data.error || 'Não foi possível buscar o QR Code agora.' })
        return
      }
      if (data.status === 'CONNECTED') {
        parar()
        setEstado({ fase: 'conectado' })
        toast.success('WhatsApp conectado.')
        avisos.current.onConectado?.()
        setTimeout(() => avisos.current.onOpenChange(false), 1500)
        return
      }
      if (data.status === 'FAILED') {
        parar()
        setEstado({ fase: 'erro', texto: `Não foi possível ativar: ${data.statusMotivo}.` })
        avisos.current.onConectado?.()
        return
      }
      setEstado({ fase: 'qr', qrCode: data.qrCode })
    } catch {
      if (!ativo.current) return
      // a network blip does not end the pairing; keep asking
    }
    if (ativo.current) timer.current = setTimeout(consultar, INTERVALO_MS)
  }, [connection.id])

  const comecar = useCallback(() => {
    parar()
    ativo.current = true
    setEstado({ fase: 'carregando' })
    consultar()
  }, [consultar])

  useEffect(() => {
    if (open) comecar()
    return parar
  }, [open, comecar])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp ({nomeDoIntegrador(connection)})</DialogTitle>
          <DialogDescription>Leia o QR Code com o celular do número que você quer conectar.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {estado.fase === 'qr' && (
            <>
              <div className="h-64 w-64 rounded-lg border bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={estado.qrCode} alt="QR Code para conectar o WhatsApp" className="h-full w-full object-contain" />
              </div>
              <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                <li>Abra o WhatsApp no celular.</li>
                <li>Toque em Mais opções ou Configurações, depois em Dispositivos conectados.</li>
                <li>Toque em Conectar um dispositivo e aponte o celular para esta tela.</li>
              </ol>
            </>
          )}
          {estado.fase === 'conectado' && <CheckCircle2 className="h-16 w-16 text-emerald-600" aria-hidden="true" />}
          {estado.fase === 'carregando' && <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" aria-hidden="true" />}
          {estado.fase === 'erro' && <WifiOff className="h-10 w-10 text-muted-foreground" aria-hidden="true" />}

          {/* One live region for every phase, so the switch to "conectado" is announced */}
          <p role="status" aria-live="polite" className={estado.fase === 'erro' ? 'text-center text-sm text-destructive' : 'flex items-center gap-2 text-sm text-muted-foreground'}>
            {estado.fase === 'carregando' && 'Buscando o QR Code…'}
            {estado.fase === 'qr' && 'Aguardando a leitura. O QR Code se renova sozinho.'}
            {estado.fase === 'conectado' && 'WhatsApp conectado.'}
            {estado.fase === 'erro' && estado.texto}
          </p>

          {estado.fase === 'erro' && (
            <Button onClick={comecar} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Tentar de novo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
