/**
 * DESTRUCTIVE: truncates all WhatsApp data (orphaned Evolution/whatsmeow data).
 *
 * Usage: npx tsx scripts/reset-wa-db.ts --confirm RESET_WA_DB
 *
 * Converted from the former /api/admin/reset-wa-db route (002-remove-dead-code, US5).
 */

import { prismaWa } from '@/lib/prisma-wa'

async function main() {
  const confirmIdx = process.argv.indexOf('--confirm')
  const confirm = confirmIdx !== -1 ? process.argv[confirmIdx + 1] : undefined
  if (confirm !== 'RESET_WA_DB') {
    console.error('Missing confirmation. Run with: --confirm RESET_WA_DB')
    process.exit(1)
  }

  const [reactions, messages, connections, quickReplies] = await Promise.all([
    prismaWa.messageReaction.deleteMany({}),
    prismaWa.whatsAppMessage.deleteMany({}),
    prismaWa.whatsAppConnection.deleteMany({}),
    prismaWa.quickReply.deleteMany({}),
  ])

  console.log('Deleted:', {
    reactions: reactions.count,
    messages: messages.count,
    connections: connections.count,
    quickReplies: quickReplies.count,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prismaWa.$disconnect())
