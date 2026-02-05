/**
 * API Route: /api/contact/[id]/interactions
 *
 * Retorna todas as interações de um contato (filtradas por tipo opcionalmente)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // 3. Verificar se o contato pertence à organização
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // 4. Buscar mensagens WhatsApp do contato
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        contactId: id,
        organizationId: user.organizationId,
      },
      orderBy: {
        sentAt: 'asc',
      },
      select: {
        id: true,
        text: true,
        direction: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        status: true,
        mediaUrl: true,
        mediaType: true,
      },
    })

    return NextResponse.json(messages)
  } catch (error: any) {
    logger.error({ error }, 'Error fetching interactions')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
