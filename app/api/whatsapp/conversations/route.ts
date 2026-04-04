/**
 * API Route: /api/whatsapp/conversations
 *
 * Lista conversas WhatsApp (contatos com mensagens)
 * Usado pelo chat interface para polling de novas conversas
 */

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
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // 3. Get ALL connections for this org
    const orgConnections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })

    const connectionIds = orgConnections.map(c => c.id)

    // Build message filter: messages from any org connection OR legacy (connectionId null)
    const messageFilter = connectionIds.length > 0
      ? { OR: [{ connectionId: { in: connectionIds } }, { connectionId: null }] as any }
      : {}

    // 4. Get distinct contactIds that have messages (from WA DB)
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

    if (contactIds.length === 0) {
      return NextResponse.json([])
    }

    // 5. Fetch contacts from CRM DB with tags and chatConversation
    const contacts = await prisma.contact.findMany({
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

    // 6. Fetch last message per contact from WA DB
    const lastMessages = await prismaWa.whatsAppMessage.findMany({
      where: {
        organizationId: user.organizationId,
        contactId: { in: contactIds },
        ...messageFilter,
      },
      orderBy: { sentAt: 'desc' },
      distinct: ['contactId'],
      select: {
        contactId: true,
        id: true,
        text: true,
        direction: true,
        status: true,
        sentAt: true,
        mediaType: true,
      },
    })

    const lastMessageMap = new Map(
      lastMessages.map(m => [m.contactId, m])
    )

    // 7. Fetch unread counts from WA DB
    const unreadCounts = await prismaWa.whatsAppMessage.groupBy({
      by: ['contactId'],
      where: {
        organizationId: user.organizationId,
        contactId: { in: contactIds },
        direction: 'INBOUND',
        isRead: false,
        ...messageFilter,
      },
      _count: { id: true },
    })

    const unreadMap = new Map(
      unreadCounts.map(u => [u.contactId, u._count.id])
    )

    // 8. Fetch total inbound message counts from WA DB
    const totalCounts = await prismaWa.whatsAppMessage.groupBy({
      by: ['contactId'],
      where: {
        organizationId: user.organizationId,
        contactId: { in: contactIds },
        direction: 'INBOUND',
        ...messageFilter,
      },
      _count: { id: true },
    })

    const totalCountMap = new Map(
      totalCounts.map(u => [u.contactId, u._count.id])
    )

    // 9. Merge CRM contacts with WA data
    const contactsWithMessages = contacts.map(contact => {
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

    // Sort: pinned first, then by latest message time
    contactsWithMessages.sort((a, b) => {
      const aPinned = a.chatConversation?.isPinned ? 1 : 0
      const bPinned = b.chatConversation?.isPinned ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned
      const aTime = a.whatsappMessages[0]?.sentAt?.getTime() ?? 0
      const bTime = b.whatsappMessages[0]?.sentAt?.getTime() ?? 0
      return bTime - aTime
    })

    return NextResponse.json(contactsWithMessages)
  } catch (error: any) {
    logger.error({ error }, 'Error fetching WhatsApp conversations')
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
