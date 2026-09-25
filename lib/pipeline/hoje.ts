/**
 * The rule behind the dashboard's "today" queue (spec 009): how long a deal has been where it is, whether it
 * asks for action, the order of the queue, and a stage's honest summary. Pure — every function takes `agora`,
 * so the server render and the browser agree on the same instant's calendar day.
 */
import { formatCurrency } from '@/lib/format'

// ponytail: one threshold for every stage (the contact sheets' 30 d); per-stage limits when someone asks for them
export const LIMIAR_PARADO_DIAS = 30

const diaEmBrasilia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Calendar days from `desde` to `agora`, both read as dates in Brasília (negative when `desde` is later). */
export function diasCorridos(desde: string | Date, agora: Date): number {
  const inicio = Date.parse(diaEmBrasilia.format(new Date(desde)))
  const fim = Date.parse(diaEmBrasilia.format(agora))
  return Math.round((fim - inicio) / 86_400_000)
}

/** The fields the rule reads; both the server's PipelineDeal and the board's narrower Deal fit. */
export type NegocioComTempo = {
  value?: number | null
  status?: string | null
  archived?: boolean | null
  dueDate?: string | Date | null
  stageEnteredAt?: string | null
  createdAt?: string | Date | null
  wonAt?: string | Date | null
  lostReason?: string | null
}

export type FatoDeTempo = {
  tipo: 'etapa' | 'parado' | 'retorno' | 'ganho' | 'perdido'
  dias: number | null
  frase: string
}

const ddmm = (d: string | Date) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(new Date(d))

/** The one time fact a card shows, in words. */
export function fatoDeTempo(n: NegocioComTempo, agora: Date): FatoDeTempo {
  if (n.status === 'WON') return { tipo: 'ganho', dias: null, frase: n.wonAt ? `ganho em ${ddmm(n.wonAt)}` : 'ganho' }
  if (n.status === 'LOST') return { tipo: 'perdido', dias: null, frase: n.lostReason ? `perdido · ${n.lostReason}` : 'perdido' }
  if (n.dueDate) {
    const atraso = diasCorridos(n.dueDate, agora)
    if (atraso > 0) return { tipo: 'retorno', dias: atraso, frase: `retorno venceu há ${atraso} d` }
  }
  const desde = n.stageEnteredAt ?? n.createdAt
  if (!desde) return { tipo: 'etapa', dias: null, frase: 'na etapa' }
  const dias = Math.max(0, diasCorridos(desde, agora))
  if (dias > LIMIAR_PARADO_DIAS) return { tipo: 'parado', dias, frase: `parado há ${dias} d` }
  return { tipo: 'etapa', dias, frase: dias === 0 ? 'entrou hoje na etapa' : `${dias} d na etapa` }
}

const aberto = (n: NegocioComTempo) => (n.status ?? 'ACTIVE') === 'ACTIVE' && !n.archived

export function pedeAcao(n: NegocioComTempo, agora: Date): boolean {
  if (!aberto(n)) return false
  const { tipo } = fatoDeTempo(n, agora)
  return tipo === 'retorno' || tipo === 'parado'
}

/** Overdue follow-ups first (most overdue first), then the stalled ones (longest first). */
export function montarFila<T extends NegocioComTempo>(negocios: T[], agora: Date): { negocio: T; fato: FatoDeTempo }[] {
  return negocios
    .filter((n) => pedeAcao(n, agora))
    .map((negocio) => ({ negocio, fato: fatoDeTempo(negocio, agora) }))
    .sort((a, b) =>
      a.fato.tipo !== b.fato.tipo ? (a.fato.tipo === 'retorno' ? -1 : 1) : (b.fato.dias ?? 0) - (a.fato.dias ?? 0),
    )
}

/**
 * A value of 0 counts as not filled: the AI qualifier writes `suggestedDealValue || 0` when it has no
 * suggestion (lib/agaas-executor.ts), and a R$ 0 deal is not a deal. 35.9% of real deals carry that 0.
 */
export const temValor = (n: NegocioComTempo) => typeof n.value === 'number' && n.value > 0

export function resumirEtapa(negocios: NegocioComTempo[], agora: Date) {
  const comValor = negocios.filter(temValor)
  return {
    n: negocios.length,
    comValor: comValor.length,
    soma: comValor.reduce((s, n) => s + (n.value as number), 0),
    pedemAcao: negocios.filter((n) => pedeAcao(n, agora)).length,
  }
}

/** "R$ 15.000" — a card's value, no cents. */
export const dinheiro = (v: number) => formatCurrency(v, { maximumFractionDigits: 0 })

/** "R$ 16,8 mil" — a stage's or a board's sum; below a thousand, whole reais ("R$ 181", not the compact "R$ 180,6"). */
export const dinheiroCompacto = (v: number) =>
  v < 1000 ? dinheiro(v) : formatCurrency(v, { notation: 'compact', maximumFractionDigits: 1 })
