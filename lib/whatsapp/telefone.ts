/**
 * Phone matching for WhatsApp (spec 012, research R6). The same Brazilian mobile arrives with and without the ninth
 * digit and with and without +55, so contacts are matched by `55 + DDD + last 8 digits`.
 */

export const digitos = (valor: string | null | undefined) => (valor ?? '').replace(/\D/g, '')

/**
 * Digits with the Brazilian country code added when the number has only DDD + number (10 or 11 digits).
 * A leading `+` means the country code is already there (`+1 415 555 2671` is also 11 digits).
 */
export function comPais(valor: string | null | undefined): string {
  const d = digitos(valor)
  if ((valor ?? '').trim().startsWith('+')) return d
  return d.length === 10 || d.length === 11 ? `55${d}` : d
}

/** `55 + DDD + last 8`, equal with or without the ninth digit. Foreign numbers keep their digits. */
export function chaveTelefone(valor: string | null | undefined): string | null {
  const d = comPais(valor)
  if (!d) return null
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return `55${d.slice(2, 4)}${d.slice(-8)}`
  return d
}

/** Group, status, channel and broadcast list: not a conversation with a person (FR-013). */
export function jidIgnorado(jid: string): boolean {
  return /@(g\.us|broadcast|newsletter)$/i.test(jid)
}

/** Phone digits from a user JID (`5511…@s.whatsapp.net`, `…:12@s.whatsapp.net`, `…@c.us`). A `@lid` has no phone. */
export function telefoneDoJid(jid: string | null | undefined): string | null {
  const m = /^(\d+)(?::\d+)?@(s\.whatsapp\.net|c\.us)$/i.exec(jid ?? '')
  return m ? m[1] : null
}

/** The number handed to the integrator: digits with the country code. The integrator resolves the ninth digit. */
export const numeroEnvio = (telefone: string) => comPais(telefone)
