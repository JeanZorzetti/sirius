import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { carregarAcesso, podeExportar, type Acesso } from '@/lib/visibilidade'
import { registrarAuditoria, ipDoPedido } from '@/lib/auditoria'

/**
 * Exporting the base is for the owner and the manager (spec 011); every export is written to the audit log.
 * Returns the caller's access, or the response to send back.
 */
export async function autorizarExportacao(): Promise<{ acesso: Acesso; email: string } | Response> {
  const session = await getSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Faça login para exportar.' }, { status: 401 })
  const acesso = await carregarAcesso({ email: session.user.email })
  if (!acesso) return NextResponse.json({ error: 'Faça login para exportar.' }, { status: 401 })
  if (!podeExportar(acesso)) {
    return NextResponse.json(
      { error: 'Só o dono e o gerente da conta podem exportar. Peça a um deles.' },
      { status: 403 },
    )
  }
  return { acesso, email: session.user.email }
}

export async function registrarExportacao(
  quem: { acesso: Acesso; email: string },
  alvo: 'contatos' | 'negocios',
  formato: 'xlsx' | 'pdf',
  linhas: number,
  request: Request,
) {
  await registrarAuditoria({
    organizationId: quem.acesso.organizationId,
    autor: { userId: quem.acesso.userId, email: quem.email, tipo: 'USUARIO' },
    acao: 'EXPORTACAO',
    alvo,
    formato,
    linhas,
    ip: ipDoPedido(request.headers),
  })
}
