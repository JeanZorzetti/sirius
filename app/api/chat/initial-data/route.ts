import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
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

    // 3. Fetch connections from WA DB
    const connections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Get active connection to scope messages
    const activeConnection = connections.find(c => c.status === 'CONNECTED' || c.status === 'CONNECTING')
    const messageFilter = activeConnection ? { connectionId: activeConnection.id } : {}

    // 5. Get distinct contactIds that have messages (from WA DB)
    const contactIdsWithMessages = await prismaWa.whatsAppMessage.findMany({
      where: {
        organizationId: user.organizationId,
        ...messageFilter,
      },
      distinct: ['contactId'],
      select: { contactId: true },
    })

    const contactIds = contactIdsWithMessages
      .map(m => m.contactId)
      .filter((id): id is string => id !== null)

    // 6. Fetch contacts from CRM DB
    const contacts = contactIds.length > 0
      ? await prisma.contact.findMany({
          where: {
            id: { in: contactIds },
            organizationId: user.organizationId,
          },
          include: {
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
          },
          orderBy: {
            updatedAt: 'desc'
          }
        })
      : []

    // 7. Fetch last message per contact from WA DB
    const lastMessagesRaw = contactIds.length > 0
      ? await prismaWa.whatsAppMessage.findMany({
          where: {
            organizationId: user.organizationId,
            contactId: { in: contactIds },
            ...messageFilter,
          },
          orderBy: { sentAt: 'desc' },
        })
      : []

    // distinct + orderBy on different fields causes INSUFFICIENT_PATH — dedupe in JS
    const lastMessageMap = new Map<string, typeof lastMessagesRaw[0]>()
    for (const msg of lastMessagesRaw) {
      if (msg.contactId && !lastMessageMap.has(msg.contactId)) {
        lastMessageMap.set(msg.contactId, msg)
      }
    }

    // 8. Fetch unread counts from WA DB
    const unreadCounts = contactIds.length > 0
      ? await prismaWa.whatsAppMessage.groupBy({
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

    // 9. Fetch total inbound counts
    const totalCounts = contactIds.length > 0
      ? await prismaWa.whatsAppMessage.groupBy({
          by: ['contactId'],
          where: {
            ...messageFilter,
            contactId: { in: contactIds },
            direction: 'INBOUND',
          },
          _count: { id: true },
        })
      : []

    const totalCountMap = new Map(
      totalCounts.map(u => [u.contactId, u._count.id])
    )

    // 10. Merge
    const contactsWithUnread = contacts.map(contact => {
      const lastMsg = lastMessageMap.get(contact.id)
      return {
        ...contact,
        whatsappMessages: lastMsg ? [lastMsg] : [],
        _count: {
          whatsappMessages: totalCountMap.get(contact.id) || 0,
          unreadMessages: unreadMap.get(contact.id) || 0,
        },
      }
    })

    return NextResponse.json({
      connections,
      contacts: contactsWithUnread,
      userId: user.id,
      userName: user.name,
      organizationId: user.organizationId,
      maxInstances: 1
    })

  } catch (error: any) {
    logger.error({ error }, 'Error fetching chat initial data')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
