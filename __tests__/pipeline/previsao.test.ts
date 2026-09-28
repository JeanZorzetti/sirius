/** Spec 016: stage chance, weighted forecast and temperature. */
import { describe, it, expect } from 'vitest'
import { probabilidadeDaEtapa, previsaoPonderada, temperatura } from '@/lib/pipeline/previsao'

const funil = [
  { id: 'a', order: 0, type: 'OPEN' }, { id: 'b', order: 1, type: 'OPEN' }, { id: 'c', order: 2, type: 'OPEN' },
  { id: 'd', order: 3, type: 'OPEN' }, { id: 'e', order: 4, type: 'OPEN' },
  { id: 'g', order: 5, type: 'WON' }, { id: 'p', order: 6, type: 'LOST' },
]

describe('probabilidadeDaEtapa', () => {
  it('escada nas abertas, 100 no ganho, 0 na perda', () => {
    expect(funil.map(e => probabilidadeDaEtapa(e, funil))).toEqual([15, 35, 50, 65, 85, 100, 0])
  })
  it('valor digitado vence o padrão', () => {
    expect(probabilidadeDaEtapa({ ...funil[0], probability: 40 }, funil)).toBe(40)
  })
})

describe('previsaoPonderada', () => {
  const janela = { de: new Date('2026-10-01'), ate: new Date('2026-10-31T23:59:59') }
  it('soma valor × chance na janela e nomeia quem ficou de fora', () => {
    const r = previsaoPonderada([
      { value: 1000, closeDate: '2026-10-10', chance: 50 },
      { value: 2000, closeDate: '2026-10-20', chance: 25 },
      { value: 5000, closeDate: '2026-11-05', chance: 90 }, // fora da janela
      { value: null, closeDate: '2026-10-10', chance: 50 }, // sem valor
      { value: 300, closeDate: null, chance: 50 },           // sem data
    ], janela)
    expect(r).toEqual({ ponderada: 1000, bruta: 3000, contados: 2, semValorOuData: 2 })
  })
})

describe('temperatura', () => {
  const agora = new Date('2026-10-31T12:00:00-03:00')
  it('até 7 d quente, até 30 morna, depois fria; fechado não tem', () => {
    expect(temperatura({ stageEnteredAt: '2026-10-25T12:00:00-03:00' }, agora)).toBe('quente')
    expect(temperatura({ stageEnteredAt: '2026-10-10T12:00:00-03:00' }, agora)).toBe('morna')
    expect(temperatura({ stageEnteredAt: '2026-09-01T12:00:00-03:00' }, agora)).toBe('fria')
    expect(temperatura({ status: 'WON', stageEnteredAt: '2026-09-01T12:00:00-03:00' }, agora)).toBeNull()
  })
})
