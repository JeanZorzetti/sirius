/**
 * Script para limpar dados duplicados de uma org:
 * 1. Remove contatos duplicados (mesmo phone normalizado) e reagrega mensagens
 * 2. Remove mensagens duplicadas (mesmo messageId)
 *
 * Uso: npx tsx scripts/fix-duplicate-contacts.ts <orgId>
 */

import { PrismaClient } from '@prisma/client'
import { PrismaClient as PrismaClientWa } from '.prisma/client-wa'

const prisma = new PrismaClient()
const prismaWa = new PrismaClientWa()

function normalizePhone(phone: string): string {
  if (phone.includes('@g.us')) return phone
  let cleaned = phone
    .replace(/@s\.whatsapp\.net/g, '')
    .replace(/@lid/g, '')
    .replace(/\D/g, '')
  if (cleaned.length === 11 && !cleaned.startsWith('55')) cleaned = '55' + cleaned
  if (cleaned.length === 10 && !cleaned.startsWith('55')) cleaned = '55' + cleaned
  return cleaned
}

async function fixDuplicateContacts(organizationId: string) {
  console.log(`\n=== STEP 1: Fix duplicate CONTACTS for org ${organizationId} ===\n`)

  const contacts = await prisma.contact.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, phone: true, createdAt: true },
  })
  console.log(`  Total contacts: ${contacts.length}`)

  // Agrupa por phone normalizado
  const byPhone = new Map<string, typeof contacts>()
  for (const c of contacts) {
    if (!c.phone) continue
    const key = normalizePhone(c.phone)
    if (!key) continue
    if (!byPhone.has(key)) byPhone.set(key, [])
    byPhone.get(key)!.push(c)
  }

  let totalContactsMerged = 0
  let totalMessagesReassigned = 0

  for (const [phone, group] of byPhone.entries()) {
    if (group.length <= 1) continue

    const keeper = group[0]
    const duplicates = group.slice(1)

    console.log(`\n  Phone: ${phone} (${group.length} records)`)
    console.log(`    Keeper: ${keeper.id} | "${keeper.name}" | raw="${keeper.phone}"`)

    for (const dup of duplicates) {
      console.log(`    Merging: ${dup.id} | "${dup.name}" | raw="${dup.phone}"`)

      // Reassign messages
      const msgs = await prismaWa.whatsAppMessage.updateMany({
        where: { contactId: dup.id },
        data: { contactId: keeper.id },
      })
      totalMessagesReassigned += msgs.count

      // Reassign deals
      try {
        await prisma.deal.updateMany({ where: { contactId: dup.id }, data: { contactId: keeper.id } })
      } catch {}

      // Reassign chat conversations
      try {
        await (prisma as any).chatConversation.updateMany({ where: { contactId: dup.id }, data: { contactId: keeper.id } })
      } catch {}

      // Delete duplicate
      await prisma.contact.delete({ where: { id: dup.id } })
      totalContactsMerged++
    }

    // Best name
    const bestName = group.find(c =>
      c.name && c.name !== c.phone && !c.name.match(/^\d+$/) && !c.name.startsWith('Grupo ')
    )?.name
    if (bestName && bestName !== keeper.name) {
      await prisma.contact.update({ where: { id: keeper.id }, data: { name: bestName } })
      console.log(`    Name updated: "${keeper.name}" → "${bestName}"`)
    }
  }

  console.log(`\n  Contacts merged: ${totalContactsMerged}`)
  console.log(`  Messages reassigned: ${totalMessagesReassigned}`)

  // =============================================
  // STEP 2: Remove duplicate MESSAGES
  // =============================================
  console.log(`\n=== STEP 2: Fix duplicate MESSAGES ===\n`)

  // Busca mensagens com messageId duplicado
  const duplicateMessageIds = await prismaWa.$queryRaw<Array<{ messageId: string; cnt: bigint }>>`
    SELECT "messageId", COUNT(*) as cnt
    FROM "WhatsAppMessage"
    WHERE "organizationId" = ${organizationId}
      AND "messageId" IS NOT NULL
    GROUP BY "messageId"
    HAVING COUNT(*) > 1
  `

  console.log(`  Found ${duplicateMessageIds.length} messageIds with duplicates`)

  let totalMsgDeleted = 0

  for (const { messageId } of duplicateMessageIds) {
    const msgs = await prismaWa.whatsAppMessage.findMany({
      where: { organizationId, messageId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    // Keep the first, delete the rest
    const toDelete = msgs.slice(1).map(m => m.id)
    if (toDelete.length > 0) {
      await prismaWa.whatsAppMessage.deleteMany({
        where: { id: { in: toDelete } },
      })
      totalMsgDeleted += toDelete.length
    }
  }

  console.log(`  Duplicate messages deleted: ${totalMsgDeleted}`)

  console.log(`\n========================================`)
  console.log(`  Contacts merged: ${totalContactsMerged}`)
  console.log(`  Messages reassigned: ${totalMessagesReassigned}`)
  console.log(`  Duplicate messages deleted: ${totalMsgDeleted}`)
  console.log(`========================================\n`)

  await prisma.$disconnect()
  await prismaWa.$disconnect()
}

const orgId = process.argv[2]
if (!orgId) {
  console.error('Usage: npx tsx scripts/fix-duplicate-contacts.ts <orgId>')
  process.exit(1)
}

fixDuplicateContacts(orgId).catch((err) => {
  console.error(err)
  process.exit(1)
})
