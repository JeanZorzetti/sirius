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
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    // 3. Fetch connections from WA DB
    const connections = await prismaWa.whatsAppConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Get active connection to scope messages
    const activeConnection = connections.find(c => c.status === 'CONNECTED' || c.status === 'CONNECTING')
    const messageFilter = activeConnection ? { connectionId: activeConnection.id } : {}

    // 5. Get distinct contactIds via raw SQL — groupBy/distinct on nullable fields
    // causes INSUFFICIENT_PATH in Prisma 5.x, raw SQL is the safe alternative
    const connectionIdFilter = activeConnection ? activeConnection.id : null
    const rows = connectionIdFilter
      ? await prismaWa.$queryRaw<{ contact_id: string }[]>`
          SELECT DISTINCT "contactId" AS contact_id
          FROM "WhatsAppMessage"
          WHERE "organizationId" = ${user.organizationId}
            AND "contactId" IS NOT NULL
            AND "connectionId" = ${connectionIdFilter}
        `
      : await prismaWa.$queryRaw<{ contact_id: string }[]>`
          SELECT DISTINCT "contactId" AS contact_id
          FROM "WhatsAppMessage"
          WHERE "organizationId" = ${user.organizationId}
            AND "contactId" IS NOT NULL
        `

    const contactIds = rows.map(r => r.contact_id)

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

    // 8. Fetch unread counts from WA DB (raw SQL — groupBy on nullable contactId causes INSUFFICIENT_PATH)
    const unreadMap = new Map<string, number>()
    const totalCountMap = new Map<string, number>()
    if (contactIds.length > 0) {
      const connIdFilter = activeConnection ? activeConnection.id : null
      const unreadRows = connIdFilter
        ? await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND "connectionId" = ${connIdFilter}
              AND direction = 'INBOUND'
              AND "isRead" = false
            GROUP BY "contactId"
          `
        : await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND direction = 'INBOUND'
              AND "isRead" = false
            GROUP BY "contactId"
          `
      for (const r of unreadRows) unreadMap.set(r.contact_id, Number(r.cnt))

      // 9. Fetch total inbound counts
      const totalRows = connIdFilter
        ? await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND "connectionId" = ${connIdFilter}
              AND direction = 'INBOUND'
            GROUP BY "contactId"
          `
        : await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
            SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
            FROM "WhatsAppMessage"
            WHERE "organizationId" = ${user.organizationId}
              AND "contactId" = ANY(${contactIds}::text[])
              AND direction = 'INBOUND'
            GROUP BY "contactId"
          `
      for (const r of totalRows) totalCountMap.set(r.contact_id, Number(r.cnt))
    }

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
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
