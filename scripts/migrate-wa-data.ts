/**
 * Data Migration Script: CRM DB → WhatsApp DB
 *
 * Copies WhatsAppConnection, QuickReply, WhatsAppMessage, and MessageReaction
 * from the CRM database to the new dedicated WhatsApp database.
 *
 * Usage:
 *   npx tsx scripts/migrate-wa-data.ts
 *
 * Prerequisites:
 *   - Both DATABASE_URL and DATABASE_URL_WA_DIRECT must be set
 *   - WhatsApp DB must have tables created (prisma migrate deploy --schema prisma/whatsapp.prisma)
 *   - CRM DB must still have the old WhatsApp tables
 */

import { PrismaClient as CrmClient } from '@prisma/client'
import { PrismaClient as WaClient } from '.prisma/client-wa'

const BATCH_SIZE = 1000

const crm = new CrmClient()
const wa = new WaClient()

async function migrateConnections() {
  console.log('\n--- Migrating WhatsAppConnection ---')
  const rows: any[] = await crm.$queryRaw`SELECT * FROM "WhatsAppConnection"`
  console.log(`  Found ${rows.length} connections in CRM DB`)

  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    for (const row of batch) {
      try {
        await wa.whatsAppConnection.create({
          data: {
            id: row.id,
            organizationId: row.organizationId,
            userId: row.userId,
            instanceName: row.instanceName,
            phoneNumber: row.phoneNumber,
            qrCode: row.qrCode,
            status: row.status,
            apiKey: row.apiKey,
            webhookUrl: row.webhookUrl,
            connectedAt: row.connectedAt,
            lastSyncAt: row.lastSyncAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
        })
        inserted++
      } catch (e: any) {
        if (e.code === 'P2002') continue // duplicate, skip
        console.error(`  Error inserting connection ${row.id}:`, e.message)
      }
    }
    console.log(`  Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`)
  }
  console.log(`  Inserted: ${inserted}`)
}

async function migrateQuickReplies() {
  console.log('\n--- Migrating QuickReply ---')
  const rows: any[] = await crm.$queryRaw`SELECT * FROM "QuickReply"`
  console.log(`  Found ${rows.length} quick replies in CRM DB`)

  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    for (const row of batch) {
      try {
        await wa.quickReply.create({
          data: {
            id: row.id,
            shortcut: row.shortcut,
            title: row.title,
            content: row.content,
            category: row.category,
            organizationId: row.organizationId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
        })
        inserted++
      } catch (e: any) {
        if (e.code === 'P2002') continue
        console.error(`  Error inserting quick reply ${row.id}:`, e.message)
      }
    }
    console.log(`  Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`)
  }
  console.log(`  Inserted: ${inserted}`)
}

async function migrateMessages() {
  console.log('\n--- Migrating WhatsAppMessage ---')
  const countResult: any[] = await crm.$queryRaw`SELECT count(*)::int as count FROM "WhatsAppMessage"`
  const total = countResult[0].count
  console.log(`  Found ${total} messages in CRM DB`)

  let inserted = 0
  let offset = 0

  while (offset < total) {
    const rows: any[] = await crm.$queryRaw`
      SELECT * FROM "WhatsAppMessage"
      ORDER BY "sentAt" ASC
      LIMIT ${BATCH_SIZE} OFFSET ${offset}
    `

    for (const row of rows) {
      try {
        await wa.whatsAppMessage.create({
          data: {
            id: row.id,
            remoteJid: row.remoteJid,
            messageId: row.messageId,
            text: row.text,
            direction: row.direction,
            status: row.status,
            isRead: row.isRead,
            replyToId: row.replyToId,
            replyToText: row.replyToText,
            mediaUrl: row.mediaUrl,
            mediaType: row.mediaType,
            dealId: row.dealId,
            contactId: row.contactId,
            connectionId: row.connectionId,
            sentAt: row.sentAt,
            deliveredAt: row.deliveredAt,
            readAt: row.readAt,
            organizationId: row.organizationId,
          },
        })
        inserted++
      } catch (e: any) {
        if (e.code === 'P2002') continue
        console.error(`  Error inserting message ${row.id}:`, e.message)
      }
    }

    offset += BATCH_SIZE
    console.log(`  Progress: ${Math.min(offset, total)}/${total} (inserted: ${inserted})`)
  }

  console.log(`  Inserted: ${inserted}`)
}

async function migrateReactions() {
  console.log('\n--- Migrating MessageReaction ---')
  const rows: any[] = await crm.$queryRaw`SELECT * FROM "MessageReaction"`
  console.log(`  Found ${rows.length} reactions in CRM DB`)

  let inserted = 0
  for (const row of rows) {
    try {
      await wa.messageReaction.create({
        data: {
          id: row.id,
          emoji: row.emoji,
          messageId: row.messageId,
          userId: row.userId,
          createdAt: row.createdAt,
        },
      })
      inserted++
    } catch (e: any) {
      if (e.code === 'P2002') continue
      console.error(`  Error inserting reaction ${row.id}:`, e.message)
    }
  }
  console.log(`  Inserted: ${inserted}`)
}

async function verify() {
  console.log('\n--- Verification ---')

  const crmConns: any[] = await crm.$queryRaw`SELECT count(*)::int as c FROM "WhatsAppConnection"`
  const waConns = await wa.whatsAppConnection.count()
  console.log(`  WhatsAppConnection: CRM=${crmConns[0].c} WA=${waConns} ${crmConns[0].c === waConns ? '✓' : '✗ MISMATCH'}`)

  const crmQr: any[] = await crm.$queryRaw`SELECT count(*)::int as c FROM "QuickReply"`
  const waQr = await wa.quickReply.count()
  console.log(`  QuickReply: CRM=${crmQr[0].c} WA=${waQr} ${crmQr[0].c === waQr ? '✓' : '✗ MISMATCH'}`)

  const crmMsgs: any[] = await crm.$queryRaw`SELECT count(*)::int as c FROM "WhatsAppMessage"`
  const waMsgs = await wa.whatsAppMessage.count()
  console.log(`  WhatsAppMessage: CRM=${crmMsgs[0].c} WA=${waMsgs} ${crmMsgs[0].c === waMsgs ? '✓' : '✗ MISMATCH'}`)

  const crmReactions: any[] = await crm.$queryRaw`SELECT count(*)::int as c FROM "MessageReaction"`
  const waReactions = await wa.messageReaction.count()
  console.log(`  MessageReaction: CRM=${crmReactions[0].c} WA=${waReactions} ${crmReactions[0].c === waReactions ? '✓' : '✗ MISMATCH'}`)
}

async function main() {
  console.log('=== WhatsApp Data Migration: CRM DB → WA DB ===')
  console.log(`  CRM DB: ${process.env.DATABASE_URL?.substring(0, 40)}...`)
  console.log(`  WA DB:  ${process.env.DATABASE_URL_WA_DIRECT?.substring(0, 40)}...`)

  await migrateConnections()
  await migrateQuickReplies()
  await migrateMessages()
  await migrateReactions()
  await verify()

  console.log('\n=== Migration Complete ===')
  console.log('NOTE: Old tables in CRM DB were NOT deleted (safety net).')
  console.log('Run cleanup migration after verification period.')
}

main()
  .catch(e => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await crm.$disconnect()
    await wa.$disconnect()
  })
