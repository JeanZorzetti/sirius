// Carta de Bayer: the demo pipeline catalogued like Uranometria (1603) —
// Greek letters in order of brightness, brightness = deal value (star area ∝ value).
import { DEMO_DEALS, DEFAULT_STAGES } from '@/lib/pipeline-defaults'

const GREGO = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ']

export const CATALOGO = [...DEMO_DEALS]
  .sort((a, b) => b.value - a.value)
  .map((deal, i) => ({ ...deal, letra: GREGO[i], etapa: DEFAULT_STAGES[deal.stageIndex].name }))

export type Entrada = (typeof CATALOGO)[number]

/** star radius in plate units: area proportional to value */
export const raio = (value: number, k = 6) => k * Math.sqrt(value / 1000)

/** engraved name next to the star: the client part of the deal title */
export const nomeCurto = (title: string) => title.split(' - ').at(-1) ?? title

export const brl = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)

export function prazo(e: Entrada) {
  const d = e.dueInDays
  if (e.won) return `ganho há ${-d} dias`
  if (d < 0) return d === -1 ? 'venceu ontem' : `venceu há ${-d} dias`
  return d === 1 ? 'vence amanhã' : `vence em ${d} dias`
}

const n = (v: number) => +v.toFixed(2)

/** engraved star: disc + 8 tapered rays, long on the axes, short on the diagonals */
export function estrela(cx: number, cy: number, r: number) {
  const rd = r * 0.5
  let d = `M${n(cx - rd)} ${n(cy)}A${n(rd)} ${n(rd)} 0 1 0 ${n(cx + rd)} ${n(cy)}A${n(rd)} ${n(rd)} 0 1 0 ${n(cx - rd)} ${n(cy)}Z`
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 - Math.PI / 2
    const longo = k % 2 === 0
    const tip = longo ? r : r * 0.72
    const w = longo ? r * 0.17 : r * 0.12
    const bx = cx + rd * 0.8 * Math.cos(a), by = cy + rd * 0.8 * Math.sin(a)
    const px = -Math.sin(a) * w, py = Math.cos(a) * w
    d += `M${n(bx + px)} ${n(by + py)}L${n(cx + tip * Math.cos(a))} ${n(cy + tip * Math.sin(a))}L${n(bx - px)} ${n(by - py)}Z`
  }
  return d
}
