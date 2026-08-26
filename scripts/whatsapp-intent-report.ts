/**
 * Relatório de intenção de WhatsApp declarada no onboarding (US3).
 *
 * Uso: npx tsx scripts/whatsapp-intent-report.ts
 */

import { prisma } from '../lib/prisma'

type Intent = 'waba' | 'qr' | 'later'

async function main() {
  const rows = await prisma.onboardingProgress.findMany({
    where: { organization: { isTestAccount: false } },
    select: { stepData: true },
  })

  const counts: Record<Intent | 'notDeclared', number> = {
    waba: 0,
    qr: 0,
    later: 0,
    notDeclared: 0,
  }

  for (const row of rows) {
    const whatsapp = (row.stepData as { whatsapp?: { intent?: Intent } } | null)?.whatsapp
    if (whatsapp?.intent && whatsapp.intent in counts) {
      counts[whatsapp.intent]++
    } else {
      counts.notDeclared++
    }
  }

  console.log('\n📊 Intenção de WhatsApp declarada no onboarding')
  console.log(`   Possui API oficial (waba): ${counts.waba}`)
  console.log(`   QR code (qr):              ${counts.qr}`)
  console.log(`   Decidir depois (later):    ${counts.later}`)
  console.log(`   Não declarou:              ${counts.notDeclared}`)
  console.log(`   Total (org de teste excluídas): ${rows.length}`)

  await prisma.$disconnect()
}

main().catch(console.error)
