/**
 * Moves deals from Roilabs Lead+Prospecção into pipeline "antigo" / stage "clientes antigos".
 *
 * Usage: npx tsx scripts/migrate-deals-pipeline.ts [--apply]
 *   (no flag) → dry-run, lists pipelines/stages and deals that would move
 *   --apply   → actually migrates the deals
 *
 * Converted from the former /api/admin/migrate-deals-pipeline route (002-remove-dead-code, US5).
 */

import { prisma } from '@/lib/prisma'

const SOURCE_STAGE_IDS = [
  '76182ad6-cac2-4d0d-8a63-e06393df2155', // Lead
  'd03f77f1-5569-40ff-a943-325202f9fd54', // Prospecção
]
const TARGET_PIPELINE_ID = '1630c534-facb-4085-9d08-f12c8b86060c' // antigo
const TARGET_STAGE_ID = '94b0d441-1da0-4062-ac65-7c4d7db00524' // clientes antigos

async function inspect() {
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: { orderBy: { order: 'asc' } },
      _count: { select: { deals: true } },
    },
    orderBy: { isDefault: 'desc' },
  })

  for (const p of pipelines) {
    console.log(`[pipeline] ${p.name} (default=${p.isDefault}, totalDeals=${p._count.deals})`)
    for (const s of p.stages) {
      const count = await prisma.deal.count({ where: { stageId: s.id, archived: false } })
      console.log(`  - ${s.name} (order: ${s.order}): ${count} active deals`)
    }
  }
}

async function migrate() {
  const dealsToMigrate = await prisma.deal.findMany({
    where: { stageId: { in: SOURCE_STAGE_IDS }, archived: false },
    select: { id: true, title: true, stageId: true },
  })

  if (dealsToMigrate.length === 0) {
    console.log('Nenhum deal encontrado nas etapas Lead/Prospecção')
    return
  }

  const maxOrderDeal = await prisma.deal.findFirst({
    where: { stageId: TARGET_STAGE_ID },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const nextOrder = (maxOrderDeal?.order ?? 0) + 1

  const results = await prisma.$transaction(
    dealsToMigrate.map((deal, idx) =>
      prisma.deal.update({
        where: { id: deal.id },
        data: { pipelineId: TARGET_PIPELINE_ID, stageId: TARGET_STAGE_ID, order: nextOrder + idx },
      })
    )
  )

  console.log(`Migrated ${results.length} deal(s):`)
  dealsToMigrate.forEach((d) => console.log(`  - ${d.title}`))
}

async function main() {
  console.log('=== Pipeline snapshot ===')
  await inspect()

  if (process.argv.includes('--apply')) {
    console.log('\n=== Migrating ===')
    await migrate()
  } else {
    console.log('\nDry-run only. Pass --apply to migrate deals.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
