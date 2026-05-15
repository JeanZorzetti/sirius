/**
 * POST /api/whatsapp/forward
 * Forwards a message to one or more contacts.
 * Body: { sourceMessageId: string, targetContactIds: string[] }
 *
 * Resolves the source message text (and media tag) and sends as a fresh
 * outbound text to each target. For mediafull forwarding via WABA, the
 * media-id of the original would need to be cached — not implemented in v1.
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
  const { sourceMessageId, targetContactIds } = body as {
    sourceMessageId?: string
    targetContactIds?: string[]
  }

  if (!sourceMessageId || !Array.isArray(targetContactIds) || targetContactIds.length === 0) {
    return NextResponse.json(
      { error: 'sourceMessageId e targetContactIds são obrigatórios' },
      { status: 400 }
    )
  }
  if (targetContactIds.length > 10) {
    return NextResponse.json({ error: 'Máximo 10 destinatários por encaminhamento' }, { status: 400 })
  }

  const sourceMessage = await prismaWa.whatsAppMessage.findFirst({
    where: { id: sourceMessageId, organizationId: user.organizationId },
    select: { text: true, mediaType: true },
  })
  if (!sourceMessage) {
    return NextResponse.json({ error: 'Mensagem original não encontrada' }, { status: 404 })
  }

  const client = await getWhatsAppOfficialClient(user.organizationId)
  if (!client) {
    return NextResponse.json({ error: 'WABA não configurado' }, { status: 400 })
  }

  const targetContacts = await prisma.contact.findMany({
    where: { id: { in: targetContactIds }, organizationId: user.organizationId },
    select: { id: true, phone: true, name: true },
  })

  const forwardedText = sourceMessage.mediaType
    ? `↪️ Encaminhado\n${sourceMessage.text}`
    : `↪️ ${sourceMessage.text}`

  const results: Array<{ contactId: string; status: 'sent' | 'failed'; error?: string }> = []

  for (const target of targetContacts) {
    if (!target.phone) {
      results.push({ contactId: target.id, status: 'failed', error: 'Sem telefone' })
      continue
    }
    const withinWindow = await isWithin24hWindow(target.id, user.organizationId)
    if (!withinWindow) {
      results.push({ contactId: target.id, status: 'failed', error: 'Janela 24h expirada' })
      continue
    }
    try {
      const phone = normalizePhone(target.phone)
      const result = await client.sendTextMessage(phone, forwardedText)
      const wamid = result.messages?.[0]?.id ?? null
      const now = new Date()
      const msgId = `waba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      await prismaWa.$executeRaw`
        INSERT INTO "WhatsAppMessage"
          (id, "contactId", "organizationId", "connectionId", "remoteJid",
           "messageId", text, direction, status, "sentAt", "isRead")
        VALUES (
          ${msgId}, ${target.id}, ${user.organizationId}, ${null},
          ${phone}, ${wamid}, ${forwardedText}, 'OUTBOUND', 'SENT', ${now}, true
        )
        ON CONFLICT ("organizationId", "messageId") DO NOTHING
      `
      results.push({ contactId: target.id, status: 'sent' })
    } catch (err: any) {
      logger.error({ err, target: target.id }, 'forward failed for target')
      results.push({ contactId: target.id, status: 'failed', error: err?.message || 'Erro' })
    }
  }

  const succeeded = results.filter(r => r.status === 'sent').length
  return NextResponse.json({ succeeded, total: targetContacts.length, results })
}
