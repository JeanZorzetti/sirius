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
      select: { 
        id: true,
        name: true,
        organizationId: true,
      },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // 3. Fetch connections
    const connections = await prisma.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Get active connection to scope messages
    const activeConnection = connections.find(c => c.status === 'CONNECTED' || c.status === 'CONNECTING')
    const messageFilter = activeConnection ? { connectionId: activeConnection.id } : {}

    // 5. Fetch contacts with messages (scoped to active connection)
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

    // 6. Fetch unread counts — single aggregated query instead of N+1
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

    return NextResponse.json({
      connections,
      contacts: contactsWithUnread,
      userId: user.id,
      userName: user.name,
      organizationId: user.organizationId,
      maxInstances: 1 // Default value
    })

  } catch (error: any) {
    logger.error({ error }, 'Error fetching chat initial data')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
