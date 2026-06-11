import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Contact } from '@prisma/client'
import type { WhatsAppMessage } from '.prisma/client-wa'

const { prismaMock, prismaWaMock } = vi.hoisted(() => ({
  prismaMock: {
    contact: { findMany: vi.fn() },
  },
  prismaWaMock: {
    $queryRaw: vi.fn(),
    whatsAppMessage: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/prisma-wa', () => ({ prismaWa: prismaWaMock }))

import {
  connectionScopeSql,
  connectionScopeWhere,
  hasAnyChannel,
  mergeContactsWithWaData,
  getChatConversations,
  type ConnectionScope,
} from '@/lib/chat/queries'

const evolutionOnly: ConnectionScope = { connectionIds: ['conn-1', 'conn-2'], wabaEnabled: false }
const wabaOnly: ConnectionScope = { connectionIds: [], wabaEnabled: true }
const both: ConnectionScope = { connectionIds: ['conn-1'], wabaEnabled: true }
const none: ConnectionScope = { connectionIds: [], wabaEnabled: false }

function makeContact(id: string, name = `Contact ${id}`): Contact {
  return { id, name } as unknown as Contact
}

function makeMessage(contactId: string, sentAt: Date, id = `msg-${contactId}-${sentAt.getTime()}`): WhatsAppMessage {
  return { id, contactId, sentAt } as unknown as WhatsAppMessage
}

describe('hasAnyChannel', () => {
  it('is true with evolution connections, waba, or both', () => {
    expect(hasAnyChannel(evolutionOnly)).toBe(true)
    expect(hasAnyChannel(wabaOnly)).toBe(true)
    expect(hasAnyChannel(both)).toBe(true)
  })

  it('is false with no channel at all', () => {
    expect(hasAnyChannel(none)).toBe(false)
  })
})

describe('connectionScopeSql (the evolution×waba matrix)', () => {
  it('evolution only: filters by connectionId IN ids', () => {
    const sql = connectionScopeSql(evolutionOnly)
    expect(sql.sql).toBe('"connectionId" = ANY(?::text[])')
    expect(sql.values).toEqual([['conn-1', 'conn-2']])
  })

  it('waba only: filters by connectionId IS NULL (no parameters)', () => {
    const sql = connectionScopeSql(wabaOnly)
    expect(sql.sql).toBe('"connectionId" IS NULL')
    expect(sql.values).toEqual([])
  })

  it('both channels: union of the two filters', () => {
    const sql = connectionScopeSql(both)
    expect(sql.sql).toBe('("connectionId" = ANY(?::text[]) OR "connectionId" IS NULL)')
    expect(sql.values).toEqual([['conn-1']])
  })
})

describe('connectionScopeWhere (same matrix for findMany)', () => {
  it('evolution only', () => {
    expect(connectionScopeWhere(evolutionOnly)).toEqual({
      connectionId: { in: ['conn-1', 'conn-2'] },
    })
  })

  it('waba only', () => {
    expect(connectionScopeWhere(wabaOnly)).toEqual({ connectionId: null })
  })

  it('both channels', () => {
    expect(connectionScopeWhere(both)).toEqual({
      OR: [{ connectionId: { in: ['conn-1'] } }, { connectionId: null }],
    })
  })
})

describe('mergeContactsWithWaData', () => {
  it('attaches the latest message and the counts per contact', () => {
    const contacts = [makeContact('c1'), makeContact('c2')]
    // Ordered by sentAt desc, as the query returns them
    const newest = makeMessage('c1', new Date('2026-06-10T12:00:00Z'))
    const older = makeMessage('c1', new Date('2026-06-09T12:00:00Z'))
    const c2Msg = makeMessage('c2', new Date('2026-06-11T08:00:00Z'))

    const result = mergeContactsWithWaData(
      contacts,
      [c2Msg, newest, older],
      new Map([['c1', 5], ['c2', 2]]),
      new Map([['c1', 3]]),
    )

    const c1 = result.find(c => c.id === 'c1')!
    expect(c1.whatsappMessages).toEqual([newest])
    expect(c1._count).toEqual({ whatsappMessages: 5, unreadMessages: 3 })

    const c2 = result.find(c => c.id === 'c2')!
    expect(c2._count).toEqual({ whatsappMessages: 2, unreadMessages: 0 })
  })

  it('sorts by latest message desc, contacts without messages last', () => {
    const contacts = [makeContact('quiet'), makeContact('old'), makeContact('recent')]
    const result = mergeContactsWithWaData(
      contacts,
      [
        makeMessage('recent', new Date('2026-06-11T10:00:00Z')),
        makeMessage('old', new Date('2026-06-01T10:00:00Z')),
      ],
      new Map(),
      new Map(),
    )

    expect(result.map(c => c.id)).toEqual(['recent', 'old', 'quiet'])
    expect(result[2].whatsappMessages).toEqual([])
  })
})

describe('getChatConversations', () => {
  beforeEach(() => {
    prismaMock.contact.findMany.mockReset()
    prismaWaMock.$queryRaw.mockReset()
    prismaWaMock.whatsAppMessage.findMany.mockReset()
  })

  it('returns [] without touching the DB when no channel is active', async () => {
    const result = await getChatConversations('org-1', none)
    expect(result).toEqual([])
    expect(prismaMock.contact.findMany).not.toHaveBeenCalled()
    expect(prismaWaMock.$queryRaw).not.toHaveBeenCalled()
  })

  it('returns [] without raw queries when the org has no contacts', async () => {
    prismaMock.contact.findMany.mockResolvedValueOnce([])
    const result = await getChatConversations('org-1', evolutionOnly)
    expect(result).toEqual([])
    expect(prismaWaMock.$queryRaw).not.toHaveBeenCalled()
  })

  it('runs the full pipeline and merges CRM contacts with WA data', async () => {
    const sentAt = new Date('2026-06-11T09:00:00Z')
    prismaMock.contact.findMany
      .mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }]) // org contact ids
      .mockResolvedValueOnce([makeContact('c1')])          // full contacts
    prismaWaMock.$queryRaw
      .mockResolvedValueOnce([{ contact_id: 'c1' }])                 // distinct contacts with messages
      .mockResolvedValueOnce([{ contact_id: 'c1', cnt: BigInt(3) }]) // unread
      .mockResolvedValueOnce([{ contact_id: 'c1', cnt: BigInt(7) }]) // total inbound
    prismaWaMock.whatsAppMessage.findMany.mockResolvedValueOnce([makeMessage('c1', sentAt)])

    const result = await getChatConversations('org-1', both)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c1')
    expect(result[0].whatsappMessages[0].sentAt).toEqual(sentAt)
    expect(result[0]._count).toEqual({ whatsappMessages: 7, unreadMessages: 3 })

    // last-message lookup uses the same matrix as the raw queries
    expect(prismaWaMock.whatsAppMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ connectionId: { in: ['conn-1'] } }, { connectionId: null }],
        }),
      })
    )
  })
})
