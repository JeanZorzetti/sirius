/**
 * POST /api/whatsapp/send-location
 * Send a location pin via WABA.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { getWhatsAppOfficialClient, normalizePhone } from '@/lib/integrations/whatsapp-official-client'
import { isWithin24hWindow } from '@/lib/whatsapp/waba-window-check'
import logger from '@/lib/logger'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })
  if (!user?.organizationId) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const { contactId, latitude, longitude, name, address } = body as {
    contactId?: string
    latitude?: number
    longitude?: number
    name?: string
    address?: string
  }

  if (!contactId || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json(
      { error: 'contactId, latitude e longitude são obrigatórios' },
      { status: 400 }
    )
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 })
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, organizationId: user.organizationId },
    select: { id: true, phone: true },
  })
  if (!contact?.phone) {
    return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
  }

  const client = await getWhatsAppOfficialClient(user.organizationId)
  if (!client) {
    return NextResponse.json({ error: 'WABA não configurado' }, { status: 400 })
  }

  const withinWindow = await isWithin24hWindow(contact.id, user.organizationId)
  if (!withinWindow) {
    return NextResponse.json(
      { error: 'Janela de 24h expirada.', code: 'OUTSIDE_24H_WINDOW' },
      { status: 409 }
    )
  }

  try {
    const phone = normalizePhone(contact.phone)
    const result = await client.sendLocationMessage(phone, latitude, longitude, name, address)
    const wamid = result.messages?.[0]?.id ?? null
    const now = new Date()
    const msgId = `waba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const renderedText = `[Localização] ${name || address || `${latitude}, ${longitude}`}`

    await prismaWa.$executeRaw`
      INSERT INTO "WhatsAppMessage"
        (id, "contactId", "organizationId", "connectionId", "remoteJid",
         "messageId", text, direction, status, "sentAt", "isRead",
         "mediaType")
      VALUES (
        ${msgId},
        ${contact.id},
        ${user.organizationId},
        ${null},
        ${phone},
        ${wamid},
        ${renderedText},
        'OUTBOUND',
        'SENT',
        ${now},
        true,
        'location'
      )
      ON CONFLICT ("organizationId", "messageId") DO NOTHING
    `

    logger.info({ contactId, wamid }, 'WABA location sent')

    return NextResponse.json({
      id: msgId,
      text: renderedText,
      direction: 'OUTBOUND',
      sentAt: now,
      messageId: wamid,
      status: 'SENT',
      mediaType: 'location',
    })
  } catch (err: any) {
    logger.error({ err }, 'send-location failed')
    return NextResponse.json({ error: err?.message || 'Erro ao enviar' }, { status: 500 })
  }
}
