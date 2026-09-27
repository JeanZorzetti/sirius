/**
 * API Route: /api/whatsapp/connections/[id]
 *
 * GET: one integrator connection of the account (spec 012), without credentials.
 * DELETE: the owner or manager disconnects it. Messages stay (FR-028); credentials, secret and instance key go.
 */

import { NextResponse } from 'next/server'
import { prismaWa } from '@/lib/prisma-wa'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'
import logger from '@/lib/logger'
import { autorizarConfiguracao, carregarAcesso } from '@/lib/visibilidade'
import { adaptador } from '@/lib/whatsapp/integradores'
import { SELECT_PUBLICO, carregarConexao, paraPublica } from '@/lib/whatsapp/integradores/conexao'
import { mudarEstado } from '@/lib/whatsapp/integradores/estado'
import { MOTIVO_DESCONECTADA_POR } from '@/lib/whatsapp/integradores/tipos'

type Contexto = { params: Promise<{ id: string }> }

const naoEncontrada = () => NextResponse.json({ error: 'Conexão não encontrada.' }, { status: 404 })

export async function GET(_req: Request, { params }: Contexto) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user?.email) return await apiError(ERR.UNAUTHORIZED, 401)
  const acesso = await carregarAcesso({ email: session.user.email })
  if (!acesso) return await apiError(ERR.USER_NOT_FOUND, 404)

  const linha = await prismaWa.whatsAppConnection.findFirst({
    where: { id, organizationId: acesso.organizationId, provider: { not: null } },
    select: SELECT_PUBLICO,
  })
  return linha ? NextResponse.json(paraPublica(linha)) : naoEncontrada()
}

export async function DELETE(_req: Request, { params }: Contexto) {
  const { id } = await params
  const acesso = await autorizarConfiguracao()
  if (acesso instanceof Response) return acesso
  const { organizationId } = acesso

  const carregada = await carregarConexao(organizationId, id)
  if (!carregada || !carregada.linha.provider) return naoEncontrada()
  const { linha, credenciais } = carregada

  if (credenciais) {
    await adaptador(credenciais.provider)
      .desligarAviso(credenciais)
      .catch((erro) => logger.warn({ connectionId: id, erro: String(erro) }, 'integrator notice not turned off on disconnect'))
  }

  const apagar = { apiKey: null, webhookSegredoHash: null, instanciaChave: null }
  const motivo = `${MOTIVO_DESCONECTADA_POR} ${acesso.nome ?? 'um gestor da conta'}`
  // No notification: the owner did it (T067)
  const mudou = await mudarEstado(linha, 'DISCONNECTED', motivo, { dados: apagar, notificar: false })
  if (!mudou) {
    // already DISCONNECTED, or changed meanwhile: the credentials go anyway
    await prismaWa.whatsAppConnection.updateMany({
      where: { id, organizationId },
      data: { ...apagar, status: 'DISCONNECTED', statusMotivo: motivo, statusMudouEm: new Date() },
    })
  }

  const atual = await prismaWa.whatsAppConnection.findFirst({ where: { id, organizationId }, select: SELECT_PUBLICO })
  logger.info({ organizationId, connectionId: id }, 'WhatsApp integrator disconnected by the owner')
  return NextResponse.json(paraPublica(atual ?? linha))
}
