/**
 * One-time fix: mark all OUTBOUND messages and old (>24h) INBOUND messages as read.
 * Corrects inflated unread counters caused by history sync importing old messages
 * with isRead=false.
 *
 * Usage: npx tsx scripts/fix-unread.ts
 *
 * Converted from the former /api/admin/fix-unread route (002-remove-dead-code, US5).
 */

import { prismaWa } from '@/lib/prisma-wa'

async function main() {
  const outbound = await prismaWa.whatsAppMessage.updateMany({
    where: { direction: 'OUTBOUND', isRead: false },
    data: { isRead: true },
  })

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const oldInbound = await prismaWa.whatsAppMessage.updateMany({
    where: { direction: 'INBOUND', isRead: false, sentAt: { lt: cutoff } },
    data: { isRead: true },
  })

  console.log(`Outbound marked read: ${outbound.count}`)
  console.log(`Old inbound marked read: ${oldInbound.count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prismaWa.$disconnect())
