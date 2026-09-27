/**
 * POST /api/webhooks/whatsapp-integrador/[segredo]
 *
 * Notices from Z-API, uazapi and Evolution API (spec 012, contracts/rotas.md). None of them signs its notices, so the
 * path carries a per-connection secret; the database keeps only its SHA-256 (research R3). The account comes from the
 * connection the secret names, never from the body.
 *
 * Answers 200 as soon as the body is read and does the work in after() (FR-011). The raw body is never logged: uazapi
 * and Evolution put the instance credential inside it.
 */

import { createHash } from 'crypto'
import { NextResponse, after } from 'next/server'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { avancarStatus, registrarEntrada } from '@/lib/whatsapp/entrada'
import { adaptador } from '@/lib/whatsapp/integradores'
import { contaTemPlanoPago, decifrarCredenciais, numeroJaConectado } from '@/lib/whatsapp/integradores/conexao'
import { mudarEstado } from '@/lib/whatsapp/integradores/estado'
import type { Evento } from '@/lib/whatsapp/integradores/tipos'

export const runtime = 'nodejs'

const ok = () => NextResponse.json({ status: 'ok' })

export async function POST(req: Request, { params }: { params: Promise<{ segredo: string }> }) {
  const { segredo } = await params
  const hash = createHash('sha256').update(segredo ?? '').digest('hex')
  // isolamento: the secret names the connection, and the connection names the account (research R3)
  const conexao = await prismaWa.whatsAppConnection.findUnique({ where: { webhookSegredoHash: hash } })
  if (!conexao?.provider) return NextResponse.json({ error: 'não encontrado' }, { status: 404 })

  let corpo: unknown
  try {
    corpo = await req.json()
  } catch {
    return NextResponse.json({ error: 'corpo inválido' }, { status: 400 })
  }

  // Accepted and dropped (FR-027): the owner was already told to reconnect, or the plan has no WhatsApp
  if (conexao.status === 'SUSPENDED' || conexao.status === 'FAILED') return ok()
  if (!(await contaTemPlanoPago(conexao.organizationId))) return ok()

  const integrador = adaptador(conexao.provider)
  const eventos = integrador.interpretar(corpo)
  if (eventos.length === 0) return ok()

  after(async () => {
    const { organizationId } = conexao
    const credenciais = decifrarCredenciais(conexao.apiKey)
    for (const evento of eventos) {
      try {
        await processar(evento)
      } catch (erro) {
        logger.error({ organizationId, connectionId: conexao.id, tipo: evento.tipo, erro: String(erro) }, 'WhatsApp integrator notice failed')
      }
    }

    async function processar(evento: Evento) {
      if (evento.tipo === 'mensagem') {
        const midia = evento.midia
        const baixar = midia && credenciais ? () => integrador.baixarMidia(credenciais, midia.ref) : undefined
        const salva = await registrarEntrada(organizationId, conexao!.id, evento, baixar)
        // only a live session delivers messages
        if (conexao!.status === 'DISCONNECTED') await mudarEstado(conexao!, 'CONNECTED', null)
        // SC-003: the delay from WhatsApp to the saved row, read from this log after 7 days (quickstart §3.9)
        logger.info(
          { tipo: 'mensagem', connectionId: conexao!.id, messageId: evento.messageId, duplicada: !salva },
          `WhatsApp integrator message atrasoMs=${Date.now() - evento.enviadaEm.getTime()}`,
        )
        return
      }
      if (evento.tipo === 'entrega') {
        await avancarStatus(organizationId, evento.messageIds, evento.status)
        return
      }
      if (evento.status === 'CONNECTED') {
        // one number fits in only one connection of the account (FR-008)
        const proibido = await numeroJaConectado(organizationId, evento.phoneNumber, conexao!.id)
        if (proibido) {
          await mudarEstado(conexao!, 'FAILED', proibido, { dados: { phoneNumber: evento.phoneNumber } })
          if (credenciais) await integrador.desligarAviso(credenciais).catch(() => {})
          return
        }
        await mudarEstado(conexao!, 'CONNECTED', null, evento.phoneNumber ? { dados: { phoneNumber: evento.phoneNumber } } : {})
        return
      }
      await mudarEstado(conexao!, evento.status, evento.motivo)
      logger.info({ tipo: 'conexao', connectionId: conexao!.id, status: evento.status }, 'WhatsApp integrator connection notice')
    }
  })

  return ok()
}
