/**
 * Script para remover contatos duplicados de uma org e reagregar mensagens.
 * Mantém o contato mais antigo (menor createdAt) e redireciona mensagens dos duplicados.
 * Trata variações de telefone: com/sem DDI 55, com/sem @s.whatsapp.net.
 *
 * Uso: npx tsx scripts/fix-duplicate-contacts.ts <orgId>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Normaliza phone para uma chave canônica de dedup:
 * - Remove @s.whatsapp.net, @g.us etc
 * - Remove tudo que não é dígito
 * - Se tem 11 dígitos (DDD+celular BR), adiciona 55
 * - Se tem 10 dígitos (DDD+fixo BR), adiciona 55
 * Retorna string puramente numérica com DDI (ex: "5511999887766")
 */
function normalizePhone(phone: string): string {
  // Grupos ficam como estão
  if (phone.includes('@g.us')) return phone

  let cleaned = phone
    .replace(/@s\.whatsapp\.net/g, '')
    .replace(/@lid/g, '')
    .replace(/\D/g, '')

  // Celulares BR sem DDI
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  // Fixos BR sem DDI
  if (cleaned.length === 10 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  return cleaned
}

async function fixDuplicateContacts(organizationId: string) {
  console.log(`\nFixing duplicate contacts for org: ${organizationId}\n`)

  const contacts = await prisma.contact.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, phone: true, createdAt: true },
  })

  console.log(`  Found ${contacts.length} total contacts`)

  // Agrupa por phone normalizado
  const byPhone = new Map<string, typeof contacts>()
  for (const c of contacts) {
    if (!c.phone) continue
    const key = normalizePhone(c.phone)
    if (!key) continue
    if (!byPhone.has(key)) byPhone.set(key, [])
    byPhone.get(key)!.push(c)
  }

  let totalMerged = 0
  let totalMessagesReassigned = 0
  let totalDealsReassigned = 0

  for (const [phone, group] of byPhone.entries()) {
    if (group.length <= 1) continue

    // Mantém o mais antigo (index 0 — já ordenado por createdAt asc)
    const keeper = group[0]
    const duplicates = group.slice(1)

    console.log(`\n  Phone: ${phone} (${group.length} registros)`)
    console.log(`    Keeper: ${keeper.id} | "${keeper.name}" | phone="${keeper.phone}"`)

    for (const dup of duplicates) {
      console.log(`    Merging: ${dup.id} | "${dup.name}" | phone="${dup.phone}"`)

      // Redireciona mensagens WhatsApp
      const reassignedMsgs = await prisma.whatsAppMessage.updateMany({
        where: { contactId: dup.id },
        data: { contactId: keeper.id },
      })
      totalMessagesReassigned += reassignedMsgs.count

      // Redireciona deals
      try {
        const reassignedDeals = await prisma.deal.updateMany({
          where: { contactId: dup.id },
          data: { contactId: keeper.id },
        })
        totalDealsReassigned += reassignedDeals.count
      } catch {
        // ignora se não existir relação
      }

      // Remove o duplicado
      await prisma.contact.delete({ where: { id: dup.id } })
      totalMerged++
    }

    // Atualiza nome do keeper para o melhor nome disponível
    const bestName = group.find(c =>
      c.name && c.name !== c.phone && !c.name.match(/^\d+$/) && !c.name.startsWith('Grupo ')
    )?.name
    if (bestName && bestName !== keeper.name) {
      await prisma.contact.update({ where: { id: keeper.id }, data: { name: bestName } })
      console.log(`    Updated keeper name: "${keeper.name}" → "${bestName}"`)
    }
  }

  console.log(`\n========================================`)
  console.log(`  Merged: ${totalMerged} duplicates`)
  console.log(`  Messages reassigned: ${totalMessagesReassigned}`)
  console.log(`  Deals reassigned: ${totalDealsReassigned}`)
  console.log(`========================================\n`)

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
