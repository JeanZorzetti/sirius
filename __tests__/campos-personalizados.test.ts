/** Spec 017: typed columns for custom field values. */
import { describe, it, expect } from 'vitest'
import { colunasDoValor, valorParaTela } from '@/lib/campos-personalizados'

describe('colunasDoValor', () => {
  it('número aceita vírgula decimal brasileira', () => {
    expect(colunasDoValor('NUMERO', '1.234,5')).toMatchObject({ ok: true, colunas: { valueNumber: 1234.5 } })
    expect(colunasDoValor('NUMERO', '1234.5')).toMatchObject({ ok: true, colunas: { valueNumber: 1234.5 } })
    expect(colunasDoValor('NUMERO', 'abc')).toMatchObject({ ok: false })
  })
  it('seleção só aceita opção da lista', () => {
    expect(colunasDoValor('SELECAO', 'Ouro', ['Prata', 'Ouro'])).toMatchObject({ ok: true, colunas: { valueText: 'Ouro' } })
    expect(colunasDoValor('SELECAO', 'Bronze', ['Prata', 'Ouro'])).toMatchObject({ ok: false })
  })
  it('data volta igual na tela; vazio limpa', () => {
    const r = colunasDoValor('DATA', '2026-10-05')
    expect(r.ok && valorParaTela('DATA', r.colunas)).toBe('2026-10-05')
    expect(colunasDoValor('TEXTO', '')).toEqual({ ok: true, colunas: { valueText: null, valueNumber: null, valueDate: null, valueBool: null } })
  })
  it('checkbox', () => {
    expect(colunasDoValor('CHECKBOX', true)).toMatchObject({ ok: true, colunas: { valueBool: true } })
    expect(valorParaTela('CHECKBOX', null)).toBe(false)
  })
})
