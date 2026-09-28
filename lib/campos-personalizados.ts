/**
 * Spec 017: turning what a person typed into the typed column of a custom field value, and back. Pure, so the server
 * action and the screen agree on what is valid.
 */

export type TipoCampo = 'TEXTO' | 'NUMERO' | 'DATA' | 'SELECAO' | 'CHECKBOX'
export type ColunasDoValor = { valueText: string | null; valueNumber: number | null; valueDate: Date | null; valueBool: boolean | null }

const vazio: ColunasDoValor = { valueText: null, valueNumber: null, valueDate: null, valueBool: null }

export const ROTULO_DO_TIPO: Record<TipoCampo, string> = {
  TEXTO: 'Texto',
  NUMERO: 'Número',
  DATA: 'Data',
  SELECAO: 'Seleção',
  CHECKBOX: 'Sim ou não',
}

/** null input clears the value. Returns the columns to write, or an error written for the screen. */
export function colunasDoValor(
  tipo: TipoCampo,
  bruto: string | boolean | null,
  opcoes: string[] = [],
): { ok: true; colunas: ColunasDoValor } | { ok: false; erro: string } {
  if (bruto === null || bruto === '') return { ok: true, colunas: vazio }
  switch (tipo) {
    case 'TEXTO': {
      const t = String(bruto).trim()
      if (t.length > 2000) return { ok: false, erro: 'Use até 2.000 caracteres.' }
      return { ok: true, colunas: { ...vazio, valueText: t || null } }
    }
    case 'NUMERO': {
      // Brazilian input: "1.234,5" and "1234.5" both mean 1234.5
      const s = String(bruto).trim()
      const n = Number(/,/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s)
      if (!Number.isFinite(n)) return { ok: false, erro: 'Digite um número, como 1.500,50.' }
      return { ok: true, colunas: { ...vazio, valueNumber: n } }
    }
    case 'DATA': {
      const s = String(bruto)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { ok: false, erro: 'Escolha uma data válida.' }
      const d = new Date(`${s}T12:00:00Z`)
      if (Number.isNaN(d.getTime())) return { ok: false, erro: 'Escolha uma data válida.' }
      return { ok: true, colunas: { ...vazio, valueDate: d } }
    }
    case 'SELECAO': {
      const s = String(bruto)
      if (!opcoes.includes(s)) return { ok: false, erro: 'Escolha uma das opções da lista.' }
      return { ok: true, colunas: { ...vazio, valueText: s } }
    }
    case 'CHECKBOX':
      return { ok: true, colunas: { ...vazio, valueBool: bruto === true || bruto === 'true' } }
  }
}

/** The value as the input shows it (date as yyyy-mm-dd, checkbox as boolean). */
export function valorParaTela(tipo: TipoCampo, v: Partial<ColunasDoValor> | null | undefined): string | boolean {
  if (!v) return tipo === 'CHECKBOX' ? false : ''
  switch (tipo) {
    case 'NUMERO': return v.valueNumber != null ? String(v.valueNumber) : ''
    case 'DATA': return v.valueDate ? new Date(v.valueDate).toISOString().slice(0, 10) : ''
    case 'CHECKBOX': return v.valueBool === true
    default: return v.valueText ?? ''
  }
}
