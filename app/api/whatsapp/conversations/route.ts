/**
 * API Route: /api/whatsapp/conversations
 *
 * Lista conversas WhatsApp (contatos com mensagens)
 * Usado pelo chat interface para polling de novas conversas (a cada 5s!)
 *
 * Supports two message sources:
 * - Evolution API connections (WhatsAppConnection records, connectionId set)
 * - WhatsApp Official API / WABA (connectionId IS NULL, org.wabaEnabled = true)
 *
 * The evolution×waba matrix and the per-contact aggregations live in
 * lib/chat/queries.ts (shared with the chat page SSR).
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'
import {
  getContactIdsWithMessages,
  getInboundCounts,
  getLastMessagesPerContact,
  hasAnyChannel,
  type ConnectionScope,
} from '@/lib/chat/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    // 2. Get user with organization (including WABA status)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        organizationId: true,
        organization: {
          select: { wabaEnabled: true, wabaPhoneNumberId: true }
        }
      },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // 3. All Evolution API connections for this org (regardless of status).
    // Filtering by CONNECTED causes conversations to vanish when a phone
    // temporarily takes over the session — messages must stay visible
    // during reconnection.
    const orgConnections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })

    const scope: ConnectionScope = {
      connectionIds: orgConnections.map(c => c.id),
      wabaEnabled: user.organization?.wabaEnabled === true && !!user.organization?.wabaPhoneNumberId,
    }

    // If neither Evolution connections nor WABA → no conversations
    if (!hasAnyChannel(scope)) {
      return NextResponse.json([])
    }

    // 4. ContactIds from CRM DB first (source of truth for org membership),
    // then intersect with WA DB messages. This prevents cross-org
    // contamination from orphaned messages left by old instances.
    const orgContacts = await prisma.contact.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })
    const contactIds = await getContactIdsWithMessages(
      user.organizationId,
      orgContacts.map(c => c.id),
      scope,
    )

    if (contactIds.length === 0) {
      return NextResponse.json([])
    }

    // 5. Contacts (with tags) + chatConversation as a FLAT query joined in
    // memory: the nested include (tags M2M + chatConversation 1-1 +
    // assignedUser) makes Prisma 5.x throw INSUFFICIENT_PATH.
    const [contactsRaw, conversations, lastMessages, unreadCounts, totalCounts] = await Promise.all([
      prisma.contact.findMany({
        where: {
          id: { in: contactIds },
          organizationId: user.organizationId,
        },
        include: { tags: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.chatConversation.findMany({
        where: { contactId: { in: contactIds } },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      getLastMessagesPerContact(user.organizationId, contactIds, scope),
      getInboundCounts(user.organizationId, contactIds, scope, true),
      getInboundCounts(user.organizationId, contactIds, scope, false),
    ])

    const conversationByContact = new Map(conversations.map(c => [c.contactId, c]))
    const lastMessageMap = new Map(lastMessages.map(m => [m.contactId, m]))

    // 6. Merge CRM contacts with WA data
    const contactsWithMessages = contactsRaw.map(contact => {
      const lastMsg = lastMessageMap.get(contact.id)
      return {
        ...contact,
        chatConversation: conversationByContact.get(contact.id) ?? null,
        whatsappMessages: lastMsg ? [lastMsg] : [],
        _count: {
          whatsappMessages: totalCounts.get(contact.id) || 0,
          unreadMessages: unreadCounts.get(contact.id) || 0,
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
  } catch (error) {
    logger.error({ error }, 'Error fetching WhatsApp conversations')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
