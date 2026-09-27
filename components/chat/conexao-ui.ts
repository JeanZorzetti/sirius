import type { ConexaoPublica } from '@/lib/whatsapp/integradores/conexao'
import { MOTIVO_DESCONECTADA_POR, NOME_INTEGRADOR, ROTULO_ESTADO } from '@/lib/whatsapp/integradores/tipos'

export type { ConexaoPublica }
export { NOME_INTEGRADOR, ROTULO_ESTADO }

/** "+55 11 98765-4321" from digits; anything else as it came */
export function formatarTelefone(digitos: string | null): string | null {
  if (!digitos) return null
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(digitos)
  return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : `+${digitos}`
}

export const nomeDaConexao = (c: ConexaoPublica) => formatarTelefone(c.phoneNumber) ?? c.instanceName

export const nomeDoIntegrador = (c: ConexaoPublica) => (c.provider ? NOME_INTEGRADOR[c.provider] : 'conexão antiga')

/** "desde 03:12" today, "desde 26/09 03:12" before */
export function desde(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === new Date().toDateString()) return `desde ${hora}`
  return `desde ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hora}`
}

/** Disconnected by the owner or manager: the credentials are gone, so it only comes back through a new connection */
export const semCredencial = (c: ConexaoPublica) => c.status === 'DISCONNECTED' && (c.statusMotivo ?? '').startsWith(MOTIVO_DESCONECTADA_POR)
