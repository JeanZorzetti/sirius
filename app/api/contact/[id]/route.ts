/**
 * API Route: /api/contact/[id]
 *
 * Retorna detalhes completos de um contato (para sidebar)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // 3. Buscar contato com dados relacionados
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        tags: true,
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
          take: 5,
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    // Count WhatsApp messages from WA DB
    const whatsappMessageCount = contact
      ? await prismaWa.whatsAppMessage.count({
          where: { contactId: contact.id, organizationId: user.organizationId },
        })
      : 0

    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    // 4. Buscar notas (via deals relacionados)
    const notes = await prisma.note.findMany({
      where: {
        deal: {
          contactId: id,
          organizationId: user.organizationId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      ...contact,
      _count: { whatsappMessages: whatsappMessageCount },
      notes,
    })
  } catch (error: any) {
    logger.error({ error }, 'Error fetching contact details')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
