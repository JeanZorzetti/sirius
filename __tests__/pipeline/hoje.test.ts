import { describe, expect, it } from 'vitest'
import {
  diasCorridos,
  dinheiro,
  dinheiroCompacto,
  fatoDeTempo,
  montarFila,
  pedeAcao,
  resumirEtapa,
} from '@/lib/pipeline/hoje'

// 24/09/2026 18:00 in Brasília (21:00 UTC)
const agora = new Date('2026-09-24T21:00:00Z')
const diasAtras = (d: number) => new Date(agora.getTime() - d * 86_400_000).toISOString()
const nbsp = (s: string) => s.replace(/ /g, ' ')

describe('diasCorridos', () => {
  it('counts calendar days in Brasília, not 24h blocks', () => {
    // 23/09 23:30 BRT (02:30 UTC on the 24th) is yesterday in Brasília
    expect(diasCorridos('2026-09-24T02:30:00Z', agora)).toBe(1)
    expect(diasCorridos('2026-09-24T12:00:00Z', agora)).toBe(0)
  })
})

describe('fatoDeTempo', () => {
  it('names each of the five facts', () => {
    expect(fatoDeTempo({ status: 'WON', wonAt: '2026-09-22T15:00:00Z' }, agora).frase).toBe('ganho em 22/09')
    expect(fatoDeTempo({ status: 'LOST', lostReason: 'Preço alto' }, agora).frase).toBe('perdido · Preço alto')
    expect(fatoDeTempo({ status: 'ACTIVE', dueDate: diasAtras(3), stageEnteredAt: diasAtras(20) }, agora).frase).toBe(
      'retorno venceu há 3 d',
    )
    expect(fatoDeTempo({ status: 'ACTIVE', stageEnteredAt: diasAtras(41) }, agora).frase).toBe('parado há 41 d')
    expect(fatoDeTempo({ status: 'ACTIVE', stageEnteredAt: diasAtras(9) }, agora).frase).toBe('9 d na etapa')
    expect(fatoDeTempo({ status: 'ACTIVE', stageEnteredAt: diasAtras(30) }, agora).tipo).toBe('etapa')
  })

  it('falls back to the creation date when the deal never changed stage', () => {
    expect(fatoDeTempo({ createdAt: diasAtras(106) }, agora).frase).toBe('parado há 106 d')
  })

  it('does not call a follow-up due today overdue', () => {
    expect(fatoDeTempo({ dueDate: '2026-09-24T10:00:00Z', stageEnteredAt: diasAtras(2) }, agora).tipo).toBe('etapa')
  })
})

describe('fila', () => {
  const negocios = [
    { id: 'novo', status: 'ACTIVE', stageEnteredAt: diasAtras(2) },
    { id: 'parado-41', status: 'ACTIVE', stageEnteredAt: diasAtras(41) },
    { id: 'parado-164', status: 'ACTIVE', stageEnteredAt: diasAtras(164) },
    { id: 'retorno-3', status: 'ACTIVE', stageEnteredAt: diasAtras(20), dueDate: diasAtras(3) },
    { id: 'retorno-9', status: 'ACTIVE', stageEnteredAt: diasAtras(50), dueDate: diasAtras(9) },
    { id: 'arquivado', status: 'ACTIVE', archived: true, stageEnteredAt: diasAtras(200) },
    { id: 'ganho', status: 'WON', stageEnteredAt: diasAtras(90) },
  ]

  it('puts overdue follow-ups first, then the longest stalled, and leaves out archived and won', () => {
    expect(montarFila(negocios, agora).map((f) => f.negocio.id)).toEqual([
      'retorno-9',
      'retorno-3',
      'parado-164',
      'parado-41',
    ])
    expect(pedeAcao(negocios[5], agora)).toBe(false)
  })
})

describe('resumirEtapa', () => {
  it('sums only filled values and counts 0 as not filled', () => {
    const r = resumirEtapa(
      [
        { value: 12000, stageEnteredAt: diasAtras(2) },
        { value: 4800, stageEnteredAt: diasAtras(12) },
        { value: 0, stageEnteredAt: diasAtras(5) },
        { value: null, stageEnteredAt: diasAtras(106) },
      ],
      agora,
    )
    expect(r).toEqual({ n: 4, comValor: 2, soma: 16800, pedemAcao: 1 })
  })
})

describe('dinheiro', () => {
  it('writes Brazilian money, whole and compact', () => {
    expect(nbsp(dinheiro(15000))).toBe('R$ 15.000')
    expect(nbsp(dinheiroCompacto(16800))).toBe('R$ 16,8 mil')
    expect(nbsp(dinheiroCompacto(309600))).toBe('R$ 309,6 mil')
    expect(nbsp(dinheiroCompacto(180.6))).toBe('R$ 181')
  })
})
