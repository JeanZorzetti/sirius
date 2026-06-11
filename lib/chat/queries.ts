import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { Prisma, type WhatsAppMessage } from '.prisma/client-wa'
import type { Contact } from '@prisma/client'

/**
 * Chat data layer. The chat page needs the same WhatsAppMessage filters in
 * three flavors depending on which channels the org has active:
 * - legacy/evolution connections → messages carry connectionId
 * - WABA (official Meta API)     → messages have connectionId NULL
 * - both                         → union of the two
 * This used to be 6 near-identical raw queries inlined in the page; the
 * matrix now lives in connectionScopeSql/connectionScopeWhere only.
 */
export type ConnectionScope = {
  /** IDs of CONNECTED legacy/evolution connections */
  connectionIds: string[]
  /** Official Meta API active (org has wabaEnabled + phone number id) */
  wabaEnabled: boolean
}

/** Subset of WhatsAppMessage the conversation list actually renders. */
export type ChatLastMessage = Pick<
  WhatsAppMessage,
  'id' | 'contactId' | 'text' | 'direction' | 'status' | 'sentAt' | 'mediaType'
>

export type ChatConversation = Contact & {
  whatsappMessages: ChatLastMessage[]
  _count: {
    whatsappMessages: number
    unreadMessages: number
  }
}

export function hasAnyChannel(scope: ConnectionScope): boolean {
  return scope.connectionIds.length > 0 || scope.wabaEnabled
}

/** The single SQL fragment behind the evolution×waba matrix (raw queries). */
export function connectionScopeSql(scope: ConnectionScope): Prisma.Sql {
  const hasEvolution = scope.connectionIds.length > 0
  if (hasEvolution && scope.wabaEnabled) {
    return Prisma.sql`("connectionId" = ANY(${scope.connectionIds}::text[]) OR "connectionId" IS NULL)`
  }
  if (hasEvolution) {
    return Prisma.sql`"connectionId" = ANY(${scope.connectionIds}::text[])`
  }
  return Prisma.sql`"connectionId" IS NULL`
}

/** Same matrix as connectionScopeSql, but as a Prisma `where` fragment. */
export function connectionScopeWhere(scope: ConnectionScope): Prisma.WhatsAppMessageWhereInput {
  const hasEvolution = scope.connectionIds.length > 0
  if (hasEvolution && scope.wabaEnabled) {
    return { OR: [{ connectionId: { in: scope.connectionIds } }, { connectionId: null }] }
  }
  if (hasEvolution) {
    return { connectionId: { in: scope.connectionIds } }
  }
  return { connectionId: null }
}

/** Contacts of the org that have at least one message in the scope. */
export async function getContactIdsWithMessages(
  organizationId: string,
  orgContactIds: string[],
  scope: ConnectionScope,
): Promise<string[]> {
  if (orgContactIds.length === 0) return []
  const rows = await prismaWa.$queryRaw<{ contact_id: string }[]>`
    SELECT DISTINCT "contactId" AS contact_id
    FROM "WhatsAppMessage"
    WHERE "organizationId" = ${organizationId}
      AND "contactId" = ANY(${orgContactIds}::text[])
      AND ${connectionScopeSql(scope)}
  `
  return rows.map(r => r.contact_id)
}

/** INBOUND message counts per contact; `onlyUnread` narrows to isRead=false. */
export async function getInboundCounts(
  organizationId: string,
  contactIds: string[],
  scope: ConnectionScope,
  onlyUnread: boolean,
): Promise<Map<string, number>> {
  const rows = await prismaWa.$queryRaw<{ contact_id: string; cnt: bigint }[]>`
    SELECT "contactId" AS contact_id, COUNT(id)::bigint AS cnt
    FROM "WhatsAppMessage"
    WHERE "organizationId" = ${organizationId}
      AND "contactId" = ANY(${contactIds}::text[])
      AND ${connectionScopeSql(scope)}
      AND direction = 'INBOUND'
      ${onlyUnread ? Prisma.sql`AND "isRead" = false` : Prisma.empty}
    GROUP BY "contactId"
  `
  return new Map(rows.map(r => [r.contact_id, Number(r.cnt)]))
}

/**
 * Latest message per contact via DISTINCT ON — replaces the old pattern of
 * fetching EVERY message in scope (unbounded, grew with org history) just to
 * keep the first per contact in memory.
 */
export async function getLastMessagesPerContact(
  organizationId: string,
  contactIds: string[],
  scope: ConnectionScope,
): Promise<ChatLastMessage[]> {
  if (contactIds.length === 0) return []
  return prismaWa.$queryRaw<ChatLastMessage[]>`
    SELECT DISTINCT ON ("contactId")
      "contactId", id, text, direction, status, "sentAt", "mediaType"
    FROM "WhatsAppMessage"
    WHERE "organizationId" = ${organizationId}
      AND "contactId" = ANY(${contactIds}::text[])
      AND ${connectionScopeSql(scope)}
    ORDER BY "contactId", "sentAt" DESC
  `
}

/** Pure merge of CRM contacts with WA data, sorted by latest message (exported for unit tests). */
export function mergeContactsWithWaData(
  rawContacts: Contact[],
  lastMessages: ChatLastMessage[],
  totalCounts: Map<string, number>,
  unreadCounts: Map<string, number>,
): ChatConversation[] {
  // Messages come ordered by sentAt desc — first hit per contact is the latest
  const lastMessageMap = new Map<string, ChatLastMessage>()
  for (const msg of lastMessages) {
    if (msg.contactId && !lastMessageMap.has(msg.contactId)) {
      lastMessageMap.set(msg.contactId, msg)
    }
  }

  const merged = rawContacts.map(contact => {
    const lastMsg = lastMessageMap.get(contact.id)
    return {
      ...contact,
      whatsappMessages: lastMsg ? [lastMsg] : [],
      _count: {
        whatsappMessages: totalCounts.get(contact.id) || 0,
        unreadMessages: unreadCounts.get(contact.id) || 0,
      },
    }
  })

  // Sort by latest message time to match WhatsApp ordering
  merged.sort((a, b) => {
    const aTime = a.whatsappMessages[0]?.sentAt?.getTime() ?? 0
    const bTime = b.whatsappMessages[0]?.sentAt?.getTime() ?? 0
    return bTime - aTime
  })
  return merged
}

/**
 * The whole chat-page data pipeline: org contacts (CRM DB, source of truth)
 * ∩ contacts with messages in scope (WA DB), enriched with last message and
 * inbound/unread counts.
 */
export async function getChatConversations(
  organizationId: string,
  scope: ConnectionScope,
): Promise<ChatConversation[]> {
  // No active Evolution connections and WABA not active — nothing to show
  if (!hasAnyChannel(scope)) return []

  // Org's contacts from CRM DB first, then intersect with the WA DB to
  // avoid cross-org orphaned messages
  const orgContacts = await prisma.contact.findMany({
    where: { organizationId },
    select: { id: true },
  })
  const contactIds = await getContactIdsWithMessages(
    organizationId,
    orgContacts.map(c => c.id),
    scope,
  )
  if (contactIds.length === 0) return []

  const [rawContacts, lastMessages, unreadCounts, totalCounts] = await Promise.all([
    prisma.contact.findMany({
      where: { id: { in: contactIds }, organizationId },
      orderBy: { updatedAt: 'desc' },
    }),
    getLastMessagesPerContact(organizationId, contactIds, scope),
    getInboundCounts(organizationId, contactIds, scope, true),
    getInboundCounts(organizationId, contactIds, scope, false),
  ])

  return mergeContactsWithWaData(rawContacts, lastMessages, totalCounts, unreadCounts)
}
