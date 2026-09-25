import { prisma } from '@/lib/prisma'

/** Who did it: a member of the organization or ROI Labs staff acting on it. */
export type AutorAuditoria = { userId: string | null; email: string; tipo: 'USUARIO' | 'EQUIPE' }

export type AcaoAuditoria = 'EXPORTACAO' | 'ENTRAR_COMO'

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

/** Client IP behind the proxy (EasyPanel/Traefik sets x-forwarded-for). */
export function ipDoPedido(cabecalhos: Headers): string | null {
  return cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || cabecalhos.get('x-real-ip') || null
}
