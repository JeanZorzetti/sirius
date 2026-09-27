// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { LIMITE_POR_MINUTO, avaliarTravas, pediuParaParar } from '@/lib/whatsapp/integradores/travas'

const base = { origem: 'inbox' as const, destinatarios: 1, ultimaEntrada: { texto: 'oi, tudo bem?' }, enviosUltimoMinuto: 0 }

describe('travas da seção 6.5 (FR-020 a FR-023)', () => {
  it('pessoa pelo inbox, para um destinatário, pode enviar', () => {
    expect(avaliarTravas(base)).toBeNull()
  })

  it('toda origem diferente de inbox é recusada, com o caminho para a API oficial', () => {
    for (const origem of ['automacao', 'agente', 'api', 'campanha', 'encaminhar']) {
      expect(avaliarTravas({ ...base, origem: origem as never }), origem).toMatch(/API oficial/)
    }
  })

  it('dois destinatários são recusados', () => {
    expect(avaliarTravas({ ...base, destinatarios: 2 })).toMatch(/um contato por vez|API oficial/)
  })

  it('envio sem pessoa digitando exige uma entrada anterior daquele contato (FR-021)', () => {
    expect(avaliarTravas({ ...base, origem: 'automacao' as never, ultimaEntrada: null })).not.toBeNull()
    // the inbox is a person typing: the first contact is allowed (US4-3)
    expect(avaliarTravas({ ...base, ultimaEntrada: null })).toBeNull()
  })

  it('"SAIR", "Parar." e "stop" travam; uma mensagem nova destrava', () => {
    for (const texto of ['SAIR', 'Parar.', 'stop', '  sair!  ', 'S A I R']) {
      expect(pediuParaParar(texto), texto).toBe(true)
      expect(avaliarTravas({ ...base, ultimaEntrada: { texto } }), texto).toMatch(/pediu para parar/)
    }
    for (const texto of ['sair daqui não', 'quero parar de pagar caro', 'oi']) expect(pediuParaParar(texto), texto).toBe(false)
    expect(avaliarTravas({ ...base, ultimaEntrada: { texto: 'voltei, pode mandar' } })).toBeNull()
  })

  it(`o ${LIMITE_POR_MINUTO + 1}º envio do minuto é recusado com "aguarde"`, () => {
    expect(avaliarTravas({ ...base, enviosUltimoMinuto: LIMITE_POR_MINUTO - 1 })).toBeNull()
    expect(avaliarTravas({ ...base, enviosUltimoMinuto: LIMITE_POR_MINUTO })).toMatch(/aguarde/i)
  })
})
