'use client'

import { useState } from 'react'
import { MapPin, Send, Loader2, Crosshair } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface LocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  onSent?: (msg: any) => void
}

export function LocationModal({ open, onOpenChange, contactId, onSent }: LocationModalProps) {
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [sending, setSending] = useState(false)
  const [locating, setLocating] = useState(false)

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocalização não disponível neste navegador')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude.toFixed(6))
        setLongitude(pos.coords.longitude.toFixed(6))
        setLocating(false)
      },
      err => {
        toast.error(`Erro ao obter localização: ${err.message}`)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  async function handleSend() {
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Latitude e longitude inválidas')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          latitude: lat,
          longitude: lng,
          name: name.trim() || undefined,
          address: address.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao enviar localização')
      }
      const data = await res.json()
      toast.success('Localização enviada')
      onSent?.(data)
      onOpenChange(false)
      setLatitude(''); setLongitude(''); setName(''); setAddress('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Enviar localização
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            disabled={locating}
            className="w-full gap-2"
          >
            {locating
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Crosshair className="h-3.5 w-3.5" />}
            Usar minha localização atual
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-zinc-500">Latitude</Label>
              <Input
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                placeholder="-23.5505"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-zinc-500">Longitude</Label>
              <Input
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                placeholder="-46.6333"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-zinc-500">Nome do local <span className="text-zinc-400">(opcional)</span></Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Sirius CRM HQ"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-zinc-500">Endereço <span className="text-zinc-400">(opcional)</span></Label>
            <Input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Av. Paulista, 1000, São Paulo"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !latitude || !longitude}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {sending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            Enviar localização
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
