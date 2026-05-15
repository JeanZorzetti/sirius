/**
 * POST /api/whatsapp/send-template
 * Send a pre-approved WABA template message (can be sent outside 24h window).
 *
 * Body:
 *   contactId: string
 *   templateName: string
 *   language: string  (e.g. "pt_BR")
 *   parameters?: string[]   (positional body parameters {{1}}, {{2}}, ...)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { getWhatsAppOfficialClient, normalizePhone } from '@/lib/integrations/whatsapp-official-client'
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
  const { contactId, templateName, language, parameters } = body as {
    contactId?: string
    templateName?: string
    language?: string
    parameters?: string[]
  }

  if (!contactId || !templateName || !language) {
    return NextResponse.json(
      { error: 'contactId, templateName e language são obrigatórios' },
      { status: 400 }
    )
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

  try {
    const phone = normalizePhone(contact.phone)

    const components = (parameters && parameters.length > 0)
      ? [{
          type: 'body' as const,
          parameters: parameters.map(p => ({ type: 'text' as const, text: p })),
        }]
      : undefined

    const result = await client.sendTemplateMessage({
      to: phone,
      templateName,
      language,
      components,
    })

    const wamid = result.messages?.[0]?.id ?? null
    const now = new Date()
    const msgId = `waba_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Render the parameters back into a preview of what the template will look like
    const previewText = parameters && parameters.length > 0
      ? `[Template: ${templateName}] ${parameters.map((p, i) => `{${i + 1}}=${p}`).join(' · ')}`
      : `[Template: ${templateName}]`

    await prismaWa.$executeRaw`
      INSERT INTO "WhatsAppMessage"
        (id, "contactId", "organizationId", "connectionId", "remoteJid",
         "messageId", text, direction, status, "sentAt", "isRead")
      VALUES (
        ${msgId},
        ${contact.id},
        ${user.organizationId},
        ${null},
        ${phone},
        ${wamid},
        ${previewText},
        'OUTBOUND',
        'SENT',
        ${now},
        true
      )
      ON CONFLICT ("organizationId", "messageId") DO NOTHING
    `

    logger.info({ contactId, wamid, templateName }, 'WABA template sent')

    return NextResponse.json({
      id: msgId,
      text: previewText,
      direction: 'OUTBOUND',
      sentAt: now,
      messageId: wamid,
      status: 'SENT',
    })
  } catch (err: any) {
    logger.error({ err, templateName }, 'send-template failed')
    return NextResponse.json({ error: err?.message || 'Erro ao enviar template' }, { status: 500 })
  }
}
