import { NextResponse } from 'next/server'
import type { Prisma, WhatsAppConnection } from '.prisma/client-wa'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'
import { carregarAcesso, type Acesso } from '@/lib/visibilidade'
import { numeroEnvio } from '@/lib/whatsapp/telefone'
import { carregarConexao, conexaoDaConversa, contaTemPlanoPago } from './conexao'
import { mudarEstado } from './estado'
import { avaliarTravas, dadosDasTravas } from './travas'
import { FalhaIntegrador, ROTULO_ESTADO, RecusaIntegrador, type Credenciais } from './tipos'

/**
 * The inbox reply through an integrator (spec 012, contracts/rotas.md), steps 1 to 4 and 6. The routes
 * send-message and send-media call the integrator themselves, so no other module holds that call (SC-006).
 */

/** The message as the chat already reads it */
export const SELECT_MENSAGEM = {
  id: true, messageId: true, text: true, direction: true, sentAt: true, deliveredAt: true, readAt: true, status: true,
  mediaUrl: true, mediaType: true, replyToId: true, replyToText: true, erro: true, connectionId: true,
} satisfies Prisma.WhatsAppMessageSelect

export type Preparo = {
  acesso: Acesso
  contato: { id: string; phone: string }
  conexao: WhatsAppConnection
  credenciais: Credenciais
  numero: string
}

const recusa = (status: number, error: string) => NextResponse.json({ error }, { status })

export async function prepararEnvio(contactId: string | null, connectionId: string | null): Promise<Preparo | Response> {
  const session = await getSession()
  if (!session?.user?.email) return recusa(401, 'Faça login para enviar.')
  const acesso = await carregarAcesso({ email: session.user.email })
  if (!acesso) return recusa(401, 'Faça login para enviar.')
  if (!contactId || !connectionId) return recusa(400, 'Informe o contato e a conexão.')
  const { organizationId } = acesso

  // 1. Contact and connection of the account
  const contato = await prisma.contact.findFirst({ where: { id: contactId, organizationId }, select: { id: true, phone: true } })
  const carregada = await carregarConexao(organizationId, connectionId)
  if (!contato || !carregada?.linha.provider) return recusa(404, 'Contato ou conexão não encontrados.')
  const { linha: conexao, credenciais } = carregada

  // 2. The conversation's connection (FR-018); a contact who never wrote may be reached by any of the account's
  const daConversa = await conexaoDaConversa(organizationId, contato.id)
  if (daConversa.via === 'oficial' || (daConversa.via === 'integrador' && daConversa.connectionId !== conexao.id)) {
    return recusa(409, 'Esta conversa chegou por outro número. Responda pelo número da conversa.')
  }

  // 3. Connected, with credentials, on a paid plan
  if (conexao.status !== 'CONNECTED' || !credenciais) {
    const motivo = conexao.statusMotivo ? `: ${conexao.statusMotivo}` : ''
    return recusa(409, `A conexão está ${ROTULO_ESTADO[conexao.status].toLowerCase()}${motivo}. Reconecte para enviar.`)
  }
  if (!(await contaTemPlanoPago(organizationId))) {
    return recusa(409, 'O plano da conta não inclui WhatsApp. Assine um plano pago para enviar.')
  }
  if (!contato.phone) return recusa(409, 'Este contato não tem telefone. Complete o cadastro para responder.')

  // 4. Terms section 6.5: a person, from the inbox, to one contact (FR-020 to FR-023)
  const motivo = avaliarTravas({ origem: 'inbox', destinatarios: 1, ...(await dadosDasTravas(organizationId, conexao.id, contato.id)) })
  if (motivo) {
    // never the text of the message
    logger.info({ organizationId, connectionId: conexao.id, contactId: contato.id, motivo }, 'WhatsApp integrator send refused by a 6.5 lock')
    return recusa(409, `Não enviada: ${motivo}.`)
  }

  return { acesso, contato: { id: contato.id, phone: contato.phone }, conexao, credenciais, numero: numeroEnvio(contato.phone) }
}

/** A reply the inbox is answering, if it belongs to the account */
export async function mensagemRespondida(organizationId: string, replyToId: string | null | undefined) {
  if (!replyToId) return null
  return prismaWa.whatsAppMessage.findFirst({ where: { id: replyToId, organizationId }, select: { id: true, text: true } })
}

/**
 * Step 6: saved as PENDING, sent, then SENT with the integrator's id. When the integrator's echo already created the
 * message with that id (P2002), the pending row goes and the echo is returned. A failure stays as FAILED with the
 * reason (502); a refused credential also takes the connection to FAILED at once, without waiting for the cron.
 */
export async function enviarPeloIntegrador(
  p: Preparo,
  dados: { text: string; mediaType?: string | null; mediaUrl?: string | null; replyTo?: { id: string; text: string } | null },
  chamar: () => Promise<{ messageId: string }>,
): Promise<Response> {
  const { organizationId } = p.acesso
  // isolamento: contact, connection and the replied message were all loaded with the organization in the where
  const pendente = await prismaWa.whatsAppMessage.create({
    data: {
      organizationId,
      connectionId: p.conexao.id,
      contactId: p.contato.id,
      remoteJid: `${p.numero}@s.whatsapp.net`,
      text: dados.text,
      direction: 'OUTBOUND',
      status: 'PENDING',
      isRead: true,
      sentAt: new Date(),
      mediaType: dados.mediaType ?? null,
      mediaUrl: dados.mediaUrl ?? null,
      replyToId: dados.replyTo?.id ?? null,
      replyToText: dados.replyTo?.text ?? null,
    },
    select: SELECT_MENSAGEM,
  })

  let messageId: string
  try {
    ;({ messageId } = await chamar())
  } catch (erro) {
    const motivo = erro instanceof RecusaIntegrador || erro instanceof FalhaIntegrador ? erro.message : 'o integrador não respondeu'
    if (erro instanceof RecusaIntegrador) {
      await mudarEstado(p.conexao, 'FAILED', 'o integrador recusou as credenciais; conecte de novo')
    }
    // isolamento: pendente is the row created above for this organization
    const falha = await prismaWa.whatsAppMessage.update({
      where: { id: pendente.id },
      data: { status: 'FAILED', erro: motivo },
      select: SELECT_MENSAGEM,
    })
    logger.warn({ organizationId, connectionId: p.conexao.id, erro: motivo }, 'WhatsApp integrator send failed')
    return NextResponse.json({ error: `Não enviada: ${motivo}.`, mensagem: falha }, { status: 502 })
  }

  try {
    // isolamento: pendente is the row created above for this organization
    const enviada = await prismaWa.whatsAppMessage.update({
      where: { id: pendente.id },
      data: { messageId, status: 'SENT' },
      select: SELECT_MENSAGEM,
    })
    return NextResponse.json(enviada, { status: 201 })
  } catch (erro: any) {
    if (erro?.code !== 'P2002') throw erro
    // isolamento: pendente is the row created above for this organization
    await prismaWa.whatsAppMessage.delete({ where: { id: pendente.id } })
    const eco = await prismaWa.whatsAppMessage.findFirst({ where: { organizationId, messageId }, select: SELECT_MENSAGEM })
    return NextResponse.json(eco, { status: 201 })
  }
}
