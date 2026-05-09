/**
 * API Route: /api/whatsapp/conversations
 *
 * Lista conversas WhatsApp (contatos com mensagens)
 * Usado pelo chat interface para polling de novas conversas
 *
 * Supports two message sources:
 * - Evolution API connections (WhatsAppConnection records, connectionId set)
 * - WhatsApp Official API / WABA (connectionId IS NULL, org.wabaEnabled = true)
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

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

    const wabaActive = user.organization?.wabaEnabled === true && !!user.organization?.wabaPhoneNumberId

    logger.info({ organizationId: user.organizationId, wabaActive, wabaEnabled: user.organization?.wabaEnabled, wabaPhoneNumberId: user.organization?.wabaPhoneNumberId }, 'conversations: org waba state')

    // 3. Get all Evolution API connections for this org (regardless of status)
    // Filtering by CONNECTED causes conversations to vanish when a phone temporarily
    // takes over the session — we want messages to stay visible during reconnection.
    const orgConnections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })

    const connectionIds = orgConnections.map(c => c.id)
    const hasEvolutionConnections = connectionIds.length > 0

    // If neither Evolution connections nor WABA → no conversations
    if (!hasEvolutionConnections && !wabaActive) {
      logger.info({ organizationId: user.organizationId, hasEvolutionConnections, wabaActive }, 'conversations: no source, returning empty')
      return NextResponse.json([])
    }

    // 4. Get contactIds from CRM DB first (source of truth for org membership),
    // then intersect with WA DB messages. This prevents cross-org contamination
    // from orphaned messages (no connectionId) left by old whatsmeow/Evolution instances.
    const orgContacts = await prisma.contact.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true },
    })
    const orgContactIds = orgContacts.map(c => c.id)

    let contactIds: string[] = []

    if (orgContactIds.length === 0) {
      // No contacts in org at all
    } else if (hasEvolutionConnections && wabaActive) {
      const rows = await prismaWa.$queryRaw<{ contact_id: string }[]>`
        SELECT DISTINCT "contactId" AS contact_id
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${orgContactIds}::text[])
          AND (
            "connectionId" = ANY(${connectionIds}::text[])
            OR "connectionId" IS NULL
          )
      `
      contactIds = rows.map(r => r.contact_id)
    } else if (hasEvolutionConnections) {
      const rows = await prismaWa.$queryRaw<{ contact_id: string }[]>`
        SELECT DISTINCT "contactId" AS contact_id
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${orgContactIds}::text[])
          AND "connectionId" = ANY(${connectionIds}::text[])
      `
      contactIds = rows.map(r => r.contact_id)
    } else {
      // WABA only — intersect with org's actual contacts to avoid orphaned messages
      const rows = await prismaWa.$queryRaw<{ contact_id: string }[]>`
        SELECT DISTINCT "contactId" AS contact_id
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${orgContactIds}::text[])
          AND "connectionId" IS NULL
      `
      contactIds = rows.map(r => r.contact_id)
    }

    logger.info({ organizationId: user.organizationId, contactIds, hasEvolutionConnections, wabaActive }, 'conversations: contactIds found')

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

    // 6. Build message WHERE clause for last message and unread queries
    // Include messages from all applicable sources
    const buildMsgWhere = () => {
      if (hasEvolutionConnections && wabaActive) {
        return `("connectionId" = ANY(${JSON.stringify(connectionIds)}::text[]) OR "connectionId" IS NULL)`
      }
      if (hasEvolutionConnections) {
        return `"connectionId" = ANY(${JSON.stringify(connectionIds)}::text[])`
      }
      return `"connectionId" IS NULL`
    }

    // 7. Fetch last message per contact from WA DB
    // Note: distinct + orderBy on different fields causes INSUFFICIENT_PATH in Prisma.
    // Solution: fetch all ordered, then keep first occurrence per contactId.
    const lastMessagesWhere: any = {
      organizationId: user.organizationId,
      contactId: { in: contactIds },
    }
    if (hasEvolutionConnections && wabaActive) {
      lastMessagesWhere.OR = [
        { connectionId: { in: connectionIds } },
        { connectionId: null },
      ]
    } else if (hasEvolutionConnections) {
      lastMessagesWhere.connectionId = { in: connectionIds }
    } else {
      lastMessagesWhere.connectionId = null
    }

    const lastMessagesRaw = await prismaWa.whatsAppMessage.findMany({
      where: lastMessagesWhere,
      orderBy: { sentAt: 'desc' },
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

    const lastMessageMap = new Map<string, typeof lastMessagesRaw[0]>()
    for (const msg of lastMessagesRaw) {
      if (msg.contactId && !lastMessageMap.has(msg.contactId)) {
        lastMessageMap.set(msg.contactId, msg)
      }
    }

    // 8. Fetch unread counts from WA DB
    let unreadRows: { contact_id: string; cnt: bigint }[] = []
    let totalRows: { contact_id: string; cnt: bigint }[] = []

    if (hasEvolutionConnections && wabaActive) {
      unreadRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
        SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${contactIds}::text[])
          AND ("connectionId" = ANY(${connectionIds}::text[]) OR "connectionId" IS NULL)
          AND direction = 'INBOUND'
          AND "isRead" = false
        GROUP BY "contactId"
      `
      totalRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
        SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${contactIds}::text[])
          AND ("connectionId" = ANY(${connectionIds}::text[]) OR "connectionId" IS NULL)
          AND direction = 'INBOUND'
        GROUP BY "contactId"
      `
    } else if (hasEvolutionConnections) {
      unreadRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
        SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${contactIds}::text[])
          AND "connectionId" = ANY(${connectionIds}::text[])
          AND direction = 'INBOUND'
          AND "isRead" = false
        GROUP BY "contactId"
      `
      totalRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
        SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${contactIds}::text[])
          AND "connectionId" = ANY(${connectionIds}::text[])
          AND direction = 'INBOUND'
        GROUP BY "contactId"
      `
    } else {
      // WABA only
      unreadRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
        SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${contactIds}::text[])
          AND "connectionId" IS NULL
          AND direction = 'INBOUND'
          AND "isRead" = false
        GROUP BY "contactId"
      `
      totalRows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
        SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
        FROM "WhatsAppMessage"
        WHERE "organizationId" = ${user.organizationId}
          AND "contactId" = ANY(${contactIds}::text[])
          AND "connectionId" IS NULL
          AND direction = 'INBOUND'
        GROUP BY "contactId"
      `
    }

    const unreadMap = new Map(unreadRows.map(r => [r.contact_id, Number(r.cnt)]))
    const totalCountMap = new Map(totalRows.map(r => [r.contact_id, Number(r.cnt)]))

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
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
