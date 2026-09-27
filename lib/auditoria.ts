import { prisma } from '@/lib/prisma'
import { VERSAO_AVISO_INTEGRADOR } from '@/lib/termos'

/** Who did it: a member of the organization or ROI Labs staff acting on it. */
export type AutorAuditoria = { userId: string | null; email: string; tipo: 'USUARIO' | 'EQUIPE' }

export type AcaoAuditoria = 'EXPORTACAO' | 'ENTRAR_COMO' | 'ACEITE_INTEGRADOR'

/** Append-only: one row per sensitive access (spec 011). The owner reads it in settings. */
export async function registrarAuditoria(registro: {
  organizationId: string
  autor: AutorAuditoria
  acao: AcaoAuditoria
  alvo: string
  formato?: string
  linhas?: number
  ip?: string | null
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: registro.organizationId,
      autorUserId: registro.autor.userId,
      autorEmail: registro.autor.email,
      autorTipo: registro.autor.tipo,
      acao: registro.acao,
      alvo: registro.alvo,
      formato: registro.formato ?? null,
      linhas: registro.linhas ?? null,
      ip: registro.ip ?? null,
    },
  })
}

/**
 * Terms section 6.2: a WhatsApp integrator connection is only activated after a user confirmed the risk notice
 * (<AceiteIntegrador>, which sends `aceite: true`). Call this in the route that activates the connection, before
 * activating it; `false` means refuse with 400 and activate nothing. The row is the proof, shown in Auditoria.
 */
export async function registrarAceiteIntegrador(registro: {
  organizationId: string
  autor: AutorAuditoria
  integrador: string
  aceite: unknown
  ip?: string | null
}): Promise<boolean> {
  if (registro.aceite !== true) return false
  await registrarAuditoria({
    organizationId: registro.organizationId,
    autor: registro.autor,
    acao: 'ACEITE_INTEGRADOR',
    alvo: `${registro.integrador} · aviso de ${VERSAO_AVISO_INTEGRADOR}`,
    ip: registro.ip,
  })
  return true
}

/** Client IP behind the proxy (EasyPanel/Traefik sets x-forwarded-for). */
export function ipDoPedido(cabecalhos: Headers): string | null {
  return cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || cabecalhos.get('x-real-ip') || null
}
