/**
 * Spec 016: stage probability, weighted forecast, stage colour and the card's temperature. Pure functions: the
 * kanban, the stage dialog and the analytics card all read the same rule.
 */

import { diasCorridos, LIMIAR_PARADO_DIAS, type NegocioComTempo } from './hoje'

type TipoEtapa = 'OPEN' | 'WON' | 'LOST'
export type EtapaComChance = { id: string; order: number; type: TipoEtapa | string; probability?: number | null }

/**
 * The stage's chance of closing, 0–100. An explicit value wins; otherwise WON is 100, LOST is 0 and the open stages of
 * the pipeline climb in even steps by order (5 open stages: 15, 35, 50, 65, 85).
 */
export function probabilidadeDaEtapa(etapa: EtapaComChance, etapasDoFunil: EtapaComChance[]): number {
  if (etapa.probability != null) return etapa.probability
  if (etapa.type === 'WON') return 100
  if (etapa.type === 'LOST') return 0
  const abertas = etapasDoFunil.filter(e => e.type !== 'WON' && e.type !== 'LOST').sort((a, b) => a.order - b.order)
  const i = abertas.findIndex(e => e.id === etapa.id)
  if (i < 0) return 0
  return Math.round(((i + 1) / (abertas.length + 1)) * 20) * 5
}

export type Previsao = {
  /** Σ value × chance of the open deals that have both a value and a close date in the window */
  ponderada: number
  /** Σ value of the same deals, unweighted */
  bruta: number
  /** deals that entered the sums */
  contados: number
  /** open deals left out because they have no value or no close date (named on screen, never a silent zero) */
  semValorOuData: number
}

export function previsaoPonderada(
  negocios: { value: number | null; closeDate: Date | string | null; chance: number }[],
  janela: { de: Date; ate: Date },
): Previsao {
  const r: Previsao = { ponderada: 0, bruta: 0, contados: 0, semValorOuData: 0 }
  for (const n of negocios) {
    if (!n.value || n.value <= 0 || !n.closeDate) { r.semValorOuData++; continue }
    const d = new Date(n.closeDate)
    if (d < janela.de || d > janela.ate) continue
    r.contados++
    r.bruta += n.value
    r.ponderada += (n.value * n.chance) / 100
  }
  return r
}

export type Temperatura = 'quente' | 'morna' | 'fria'

/** Days in the stage, the same count as the card's time fact: up to 7 hot, up to 30 warm, beyond that cold (= parado). */
export function temperatura(n: NegocioComTempo, agora: Date): Temperatura | null {
  if ((n.status ?? 'ACTIVE') !== 'ACTIVE') return null
  const desde = n.stageEnteredAt ?? n.createdAt
  if (!desde) return null
  const dias = Math.max(0, diasCorridos(desde, agora))
  if (dias <= 7) return 'quente'
  if (dias <= LIMIAR_PARADO_DIAS) return 'morna'
  return 'fria'
}

/** Stage colours: a named, closed palette (the name is shown next to the swatch, so colour never carries alone). */
export const CORES_DE_ETAPA = {
  cinza: { nome: 'Cinza', valor: 'oklch(0.62 0.01 250)' },
  azul: { nome: 'Azul', valor: 'oklch(0.58 0.16 250)' },
  verde: { nome: 'Verde', valor: 'oklch(0.60 0.15 150)' },
  ambar: { nome: 'Âmbar', valor: 'oklch(0.72 0.15 75)' },
  vermelho: { nome: 'Vermelho', valor: 'oklch(0.58 0.19 25)' },
  roxo: { nome: 'Roxo', valor: 'oklch(0.55 0.17 300)' },
} as const
export type CorDeEtapa = keyof typeof CORES_DE_ETAPA
export const corDaEtapa = (cor: string | null | undefined) =>
  cor && cor in CORES_DE_ETAPA ? CORES_DE_ETAPA[cor as CorDeEtapa].valor : null
