/**
 * GET /api/whatsapp/templates
 * Lists message templates registered in the Meta WhatsApp Business Account.
 * Requires `wabaBusinessAccountId` to be configured for the organization.
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWhatsAppOfficialClient } from '@/lib/integrations/whatsapp-official-client'
import logger from '@/lib/logger'

export async function GET() {
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

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { wabaBusinessAccountId: true, wabaEnabled: true },
  })

  if (!org?.wabaEnabled) {
    return NextResponse.json(
      { error: 'WABA não está habilitado para esta organização.' },
      { status: 400 }
    )
  }

  if (!org?.wabaBusinessAccountId) {
    return NextResponse.json(
      {
        error:
          'WABA Business Account ID não configurado. Adicione-o nas configurações de integração da Meta.',
        code: 'MISSING_WABA_ID',
      },
      { status: 400 }
    )
  }

  const client = await getWhatsAppOfficialClient(user.organizationId)
  if (!client) {
    return NextResponse.json({ error: 'WABA client não disponível.' }, { status: 400 })
  }

  try {
    const result = await client.getMessageTemplates(org.wabaBusinessAccountId)
    return NextResponse.json({
      templates: result.data,
      paging: result.paging,
    })
  } catch (err: any) {
    logger.error({ err }, 'Failed to fetch WABA templates')
    return NextResponse.json(
      { error: err?.message || 'Erro ao buscar templates' },
      { status: 502 }
    )
  }
}
