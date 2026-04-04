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

    // 3. Get ALL connections for this org (not just active) so messages
    //    from previous sessions are never hidden. This ensures conversations
    //    persist across reconnections/new WhatsApp pairings.
    const orgConnections = await prisma.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })

    const connectionIds = orgConnections.map(c => c.id)

    // Show messages from ANY org connection OR legacy messages (connectionId null)
    const messageFilter = connectionIds.length > 0
      ? { OR: [{ connectionId: { in: connectionIds } }, { connectionId: null }] }
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
        tags: true,
        chatConversation: {
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

    // Sort: pinned first, then by latest message time (matches WhatsApp ordering)
    contactsWithUnread.sort((a, b) => {
      const aPinned = a.chatConversation?.isPinned ? 1 : 0
      const bPinned = b.chatConversation?.isPinned ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned
      const aTime = a.whatsappMessages[0]?.sentAt?.getTime() ?? 0
      const bTime = b.whatsappMessages[0]?.sentAt?.getTime() ?? 0
      return bTime - aTime
    })

    return NextResponse.json(contactsWithUnread)
  } catch (error: any) {
    logger.error({ error }, 'Error fetching WhatsApp conversations')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
