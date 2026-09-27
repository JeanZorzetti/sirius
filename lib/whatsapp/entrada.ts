import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { uploadMedia } from '@/lib/storage'
import { dispatchWebhookAsync, WEBHOOK_EVENTS } from '@/lib/webhooks'
import logger from '@/lib/logger'
import { chaveTelefone, comPais } from '@/lib/whatsapp/telefone'
import type { EventoMensagem, Midia } from '@/lib/whatsapp/integradores/tipos'

/**
 * One inbound path for the official API and the integrators (spec 012, research R11): match or create the contact,
 * save the message once, store the media under the account's key and fire `whatsapp.message.in`.
 */

type Contato = { id: string; name: string; novo: boolean }

/** By phone key `55 + DDD + last 8` inside the account (research R6); with only a LID, by the earlier message. */
async function casarContato(organizationId: string, evento: EventoMensagem): Promise<Contato> {
  const chave = chaveTelefone(evento.telefone)
  if (chave) {
    // no backslash here: a template literal eats it (`\D` would become `D`)
    const candidatos = await prisma.$queryRaw<{ id: string; name: string; phone: string | null }[]>`
      SELECT id, name, phone FROM "Contact"
      WHERE "organizationId" = ${organizationId}
        AND regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') LIKE ${'%' + chave.slice(-8)}
      ORDER BY "updatedAt" DESC
      LIMIT 50
    `
    // same last 8 digits and a different area code is someone else
    const achado = candidatos.find((c) => chaveTelefone(c.phone) === chave)
    if (achado) return { id: achado.id, name: achado.name, novo: false }
  } else {
    const anterior = await prismaWa.whatsAppMessage.findFirst({
      where: { organizationId, remoteJid: evento.jid, contactId: { not: null } },
      orderBy: { sentAt: 'desc' },
      select: { contactId: true },
    })
    if (anterior?.contactId) {
      const contato = await prisma.contact.findFirst({
        where: { id: anterior.contactId, organizationId },
        select: { id: true, name: true },
      })
      if (contato) return { ...contato, novo: false }
    }
  }

  const telefone = evento.telefone ? `+${comPais(evento.telefone)}` : null
  const criado = await prisma.contact.create({
    data: {
      organizationId,
      name: evento.nomePerfil || telefone || 'Contato do WhatsApp',
      phone: telefone,
      // only the LID: the profile shows "completar cadastro"
      ...(telefone ? {} : { source: 'whatsapp_lid' }),
    },
    select: { id: true, name: true },
  })
  return { ...criado, novo: true }
}

export type EntradaRegistrada = { mensagemId: string; contactId: string; contactName: string; contatoNovo: boolean }

/**
 * Returns null when the message was already saved (same `messageId` in the account: FR-012). `fromMe` is a reply
 * typed on the phone: saved as sent, with no outbound webhook, agent or notification (FR-015).
 */
export async function registrarEntrada(
  organizationId: string,
  connectionId: string | null,
  evento: EventoMensagem,
  baixar?: () => Promise<Midia>,
  extra: { mediaType?: string } = {},
): Promise<EntradaRegistrada | null> {
  const contato = await casarContato(organizationId, evento)
  const mediaType = extra.mediaType ?? evento.midia?.tipo ?? null

  let salva
  try {
    // isolamento: contato was matched or created inside this organization; connectionId is the caller's connection,
    // found by its secret, whose account is this organization (or null on the official API)
    salva = await prismaWa.whatsAppMessage.create({
      data: {
        organizationId,
        connectionId,
        messageId: evento.messageId,
        remoteJid: evento.jid,
        text: evento.texto,
        direction: evento.fromMe ? 'OUTBOUND' : 'INBOUND',
        status: evento.fromMe ? 'SENT' : 'DELIVERED',
        isRead: evento.fromMe,
        contactId: contato.id,
        sentAt: evento.enviadaEm,
        ...(mediaType ? { mediaType } : {}),
      },
      select: { id: true },
    })
  } catch (erro: any) {
    if (erro?.code === 'P2002') return null
    throw erro
  }

  // Media (FR-017, research R10): our storage, never the integrator's link
  if (evento.midia && baixar) {
    try {
      const midia = await baixar()
      const chave = await uploadMedia({
        orgId: organizationId,
        contactId: contato.id,
        messageId: salva.id,
        buffer: midia.buffer,
        mimetype: midia.mimetype,
        fileName: midia.nomeArquivo,
      })
      // isolamento: salva.id is the message saved a moment ago for this organization
      await prismaWa.whatsAppMessage.update({ where: { id: salva.id }, data: { mediaUrl: chave } })
    } catch (erro) {
      logger.warn({ organizationId, messageDbId: salva.id, erro: String(erro) }, 'WhatsApp inbound media not stored')
    }
  }

  if (!evento.fromMe) {
    dispatchWebhookAsync(organizationId, WEBHOOK_EVENTS.WHATSAPP_MESSAGE_IN, {
      messageId: salva.id,
      contactId: contato.id,
      contactName: contato.name,
      phone: evento.telefone,
      text: evento.texto,
      mediaType,
      via: connectionId ? 'integrador' : 'oficial',
      receivedAt: evento.enviadaEm.toISOString(),
    })
  }

  return { mensagemId: salva.id, contactId: contato.id, contactName: contato.name, contatoNovo: contato.novo }
}

const ORDEM = ['PENDING', 'SENT', 'DELIVERED', 'READ'] as const
type EstadoEntrega = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

/**
 * Delivery state only moves forward (FR-016): PENDING < SENT < DELIVERED < READ, and FAILED only over PENDING or
 * SENT. A late "delivered" never pulls a READ message back.
 */
export async function avancarStatus(
  organizationId: string,
  messageIds: string[],
  status: EstadoEntrega,
  opcoes: { em?: Date; erro?: string | null } = {},
): Promise<number> {
  if (messageIds.length === 0) return 0
  const anteriores = status === 'FAILED' ? ['PENDING', 'SENT'] : ORDEM.slice(0, ORDEM.indexOf(status))
  const em = opcoes.em ?? new Date()
  const { count } = await prismaWa.whatsAppMessage.updateMany({
    where: { organizationId, messageId: { in: messageIds }, status: { in: anteriores as never } },
    data: {
      status,
      ...(status === 'DELIVERED' ? { deliveredAt: em } : {}),
      ...(status === 'READ' ? { readAt: em } : {}),
      ...(status === 'FAILED' && opcoes.erro ? { erro: opcoes.erro } : {}),
    },
  })
  return count
}
