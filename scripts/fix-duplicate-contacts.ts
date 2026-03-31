/**
 * Script para remover contatos duplicados de uma org e reagregar mensagens.
 * Mantém o contato mais antigo (menor createdAt) e redireciona mensagens dos duplicados.
 *
 * Uso: npx tsx scripts/fix-duplicate-contacts.ts <orgId>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDuplicateContacts(organizationId: string) {
  console.log(`\nFixing duplicate contacts for org: ${organizationId}\n`)

  // Busca todos os contatos da org
  const contacts = await prisma.contact.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, phone: true, createdAt: true },
  })

  // Agrupa por phone normalizado
  const byPhone = new Map<string, typeof contacts>()
  for (const c of contacts) {
    if (!c.phone) continue
    const key = c.phone.trim().toLowerCase()
    if (!byPhone.has(key)) byPhone.set(key, [])
    byPhone.get(key)!.push(c)
  }

  let totalMerged = 0
  let totalMessagesReassigned = 0

  for (const [phone, group] of byPhone.entries()) {
    if (group.length <= 1) continue

    // Mantém o mais antigo (index 0 — já ordenado por createdAt asc)
    const keeper = group[0]
    const duplicates = group.slice(1)

    console.log(`  Phone: ${phone}`)
    console.log(`    Keeper: ${keeper.id} (${keeper.name})`)
    console.log(`    Duplicates: ${duplicates.map(d => d.id).join(', ')}`)

    for (const dup of duplicates) {
      // Redireciona mensagens do duplicado para o keeper
      const reassigned = await prisma.whatsAppMessage.updateMany({
        where: { contactId: dup.id },
        data: { contactId: keeper.id },
      })
      totalMessagesReassigned += reassigned.count

      // Redireciona deals
      await prisma.deal.updateMany({
        where: { contactId: dup.id },
        data: { contactId: keeper.id },
      }).catch(() => {}) // ignora se campo não existir

      // Remove o duplicado
      await prisma.contact.delete({ where: { id: dup.id } })
      totalMerged++
    }

    // Atualiza nome do keeper se estiver genérico
    const bestName = group.find(c => c.name && c.name !== c.phone && !c.name.match(/^\d+$/))?.name
    if (bestName && bestName !== keeper.name) {
      await prisma.contact.update({ where: { id: keeper.id }, data: { name: bestName } })
      console.log(`    Updated name to: ${bestName}`)
    }
  }

  console.log(`\nDone! Merged ${totalMerged} duplicates, reassigned ${totalMessagesReassigned} messages.\n`)
  await prisma.$disconnect()
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
