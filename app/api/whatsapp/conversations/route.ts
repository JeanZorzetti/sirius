/**
 * API Route: /api/whatsapp/conversations
 *
 * Lista conversas WhatsApp (contatos com mensagens)
 * Usado pelo chat interface para polling de novas conversas
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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

    // 3. Get active connection to filter messages by connection
    const activeConnection = await prisma.whatsAppConnection.findFirst({
      where: {
        organizationId: user.organizationId,
        status: { in: ['CONNECTED', 'CONNECTING'] },
      },
      orderBy: { connectedAt: 'desc' },
    })

    // Show messages from active connection OR legacy messages (connectionId null)
    const messageFilter = activeConnection
      ? { OR: [{ connectionId: activeConnection.id }, { connectionId: null }] }
      : {}

    // 4. Buscar contatos com mensagens WhatsApp
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        whatsappMessages: {
          some: messageFilter,
        }
      },
      include: {
        whatsappMessages: {
          where: messageFilter,
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
        tags: true, // Fase 1.2
        chatConversation: { // Fase 3.1
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            whatsappMessages: {
              where: {
                ...messageFilter,
                direction: 'INBOUND',
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // 5. Buscar contagem de não lidas — query única agregada (não N+1)
    const contactIds = contacts.map(c => c.id)
    const unreadCounts = contactIds.length > 0
      ? await prisma.whatsAppMessage.groupBy({
          by: ['contactId'],
          where: {
            ...messageFilter,
            contactId: { in: contactIds },
            direction: 'INBOUND',
            isRead: false,
          },
          _count: { id: true },
        })
      : []

    const unreadMap = new Map(
      unreadCounts.map(u => [u.contactId, u._count.id])
    )

    const contactsWithUnread = contacts.map(contact => ({
      ...contact,
      _count: {
        ...contact._count,
        unreadMessages: unreadMap.get(contact.id) || 0,
      }
    }))

    return NextResponse.json(contactsWithUnread)
  } catch (error: any) {
    logger.error({ error }, 'Error fetching WhatsApp conversations')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
