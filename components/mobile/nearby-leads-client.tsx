'use client'

/**
 * NearbyLeadsClient — Sprint 4.3
 *
 * Página de leads próximos:
 * - Solicita GPS e busca contatos com coordenadas dentro do raio
 * - Lista de cards com distância + botões Ligar / WhatsApp / Rota
 * - Raio ajustável (1km, 5km, 10km, 25km)
 * - Notificação proativa emitida pela NativeInitializer quando em movimento
 *
 * Nota: mapa interativo (Mapbox/Google) é intencionalmenente omitido nesta
 * versão para evitar dependências pagas. A integração está documentada abaixo
 * para quando o usuário decidir qual provider usar.
 */

import * as React from 'react'
import {
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNearbyLeads, type NearbyLead } from '@/lib/mobile/checkin'

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 ? digits : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'locating' | 'loading' | 'done' | 'error'

const RADIUS_OPTIONS = [
  { label: '1 km', value: 1000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10_000 },
  { label: '25 km', value: 25_000 },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Lead Card
// ─────────────────────────────────────────────────────────────────────────────

function LeadCard({ lead }: { lead: NearbyLead }) {
  const phone = cleanPhone(lead.phone)

  function handleRoute() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lead.latitude},${lead.longitude}&travelmode=driving`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all active:scale-[0.99]">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
        <span className="text-sm font-bold">{lead.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-sm text-foreground">{lead.name}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {formatDistance(lead.distanceMeters)}
          </span>
        </div>

        {lead.company && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.company}</p>
        )}
        {lead.lastDealTitle && (
          <p className="mt-0.5 truncate text-[11px] text-indigo-600/80 dark:text-indigo-400/80">
            {lead.lastDealTitle}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {phone && (
            <a
              href={`tel:+${phone}`}
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold transition-colors hover:bg-blue-100 active:scale-95 dark:bg-blue-950/30 dark:text-blue-300"
            >
              <Phone className="h-3.5 w-3.5" />
              Ligar
            </a>
          )}
          {phone && (
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-50 text-green-700 text-xs font-semibold transition-colors hover:bg-green-100 active:scale-95 dark:bg-green-950/30 dark:text-green-300"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={handleRoute}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold transition-colors hover:bg-amber-100 active:scale-95 dark:bg-amber-950/30 dark:text-amber-300"
          >
            <Navigation className="h-3.5 w-3.5" />
            Rota
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export function NearbyLeadsClient() {
  const [status, setStatus] = React.useState<Status>('idle')
  const [leads, setLeads] = React.useState<NearbyLead[]>([])
  const [errorMsg, setErrorMsg] = React.useState('')
  const [radius, setRadius] = React.useState<number>(5000)

  async function fetchLeads() {
    setStatus('locating')
    setErrorMsg('')
    try {
      setStatus('loading')
      const nearby = await getNearbyLeads(radius)
      setLeads(nearby)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao obter localização')
      setStatus('error')
    }
  }

  // Busca automática ao montar e ao mudar raio
  React.useEffect(() => {
    void fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius])

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Leads Próximos</h1>
          <p className="text-sm text-muted-foreground">
            {status === 'done'
              ? leads.length === 0
                ? 'Nenhum lead nesta área'
                : `${leads.length} lead${leads.length !== 1 ? 's' : ''} encontrado${leads.length !== 1 ? 's' : ''}`
              : 'Buscando leads na sua região...'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLeads}
          disabled={status === 'locating' || status === 'loading'}
          aria-label="Atualizar"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw
            className={cn('h-4 w-4', (status === 'locating' || status === 'loading') && 'animate-spin')}
          />
        </button>
      </div>

      {/* Raio */}
      <div className="flex gap-2">
        {RADIUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRadius(opt.value)}
            className={cn(
              'flex-1 rounded-xl border py-2 text-xs font-semibold transition-all',
              radius === opt.value
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {(status === 'locating' || status === 'loading') && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground">
            {status === 'locating' ? 'Obtendo sua localização...' : 'Buscando leads próximos...'}
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">Não foi possível obter a localização</p>
            <p className="mt-1 text-amber-700/80 dark:text-amber-400/80">{errorMsg}</p>
            <button
              type="button"
              onClick={fetchLeads}
              className="mt-2 text-xs font-semibold text-amber-700 underline dark:text-amber-300"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {status === 'done' && leads.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Nenhum lead encontrado em {formatDistance(radius)}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Aumente o raio ou adicione coordenadas aos seus contatos
          </p>
        </div>
      )}

      {/* Leads list */}
      {status === 'done' && leads.length > 0 && (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}

      {/* Dica de cadastro de coordenadas */}
      {status === 'done' && (
        <p className="text-center text-[11px] text-muted-foreground/60">
          Contatos sem coordenadas cadastradas não aparecem aqui.
        </p>
      )}
    </div>
  )
}
