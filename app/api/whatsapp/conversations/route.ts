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

    // Build message filter: if active connection exists, show only its messages
    // Fall back to showing all messages (legacy data before connectionId was added)
    const messageFilter = activeConnection
      ? { connectionId: activeConnection.id }
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

    // 5. Buscar contagem de mensagens não lidas para cada contato (filtrada por conexão)
    const contactsWithUnread = await Promise.all(
      contacts.map(async (contact) => {
        const unreadCount = await prisma.whatsAppMessage.count({
          where: {
            ...messageFilter,
            contactId: contact.id,
            direction: 'INBOUND',
            isRead: false,
          }
        })
        return {
          ...contact,
          _count: {
            ...contact._count,
            unreadMessages: unreadCount,
          }
        }
      })
    )

    return NextResponse.json(contactsWithUnread)
  } catch (error: any) {
    logger.error({ error }, 'Error fetching WhatsApp conversations')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
