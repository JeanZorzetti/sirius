/**
 * Backfill PipelineStage.type based on stage name heuristics.
 *
 * Rules:
 *   WON  → name contains: ganho, fechado, won, vendido, aprovado, pago, concluído, finalizado
 *   LOST → name contains: perdido, lost, cancelado, recusado, desistiu
 *   OPEN → everything else
 *
 * Fallback: if a pipeline has no WON stage after heuristics, the stage with
 * the highest `order` is marked WON.
 *
 * Usage: npx tsx scripts/backfill-pipeline-stage-type.ts [--dry-run]
 */

import { prisma } from '@/lib/prisma'
import { PipelineStageType } from '@prisma/client'

const WON_KEYWORDS = ['ganho', 'fechado', 'won', 'vendido', 'aprovado', 'pago', 'concluído', 'finalizado', 'concluido']
const LOST_KEYWORDS = ['perdido', 'lost', 'cancelado', 'recusado', 'desistiu']

function classifyStage(name: string): PipelineStageType {
  const lower = name.toLowerCase()
  if (WON_KEYWORDS.some(k => lower.includes(k))) return 'WON'
  if (LOST_KEYWORDS.some(k => lower.includes(k))) return 'LOST'
  return 'OPEN'
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  if (isDryRun) console.log('[backfill] DRY RUN — no changes will be written')

  const pipelines = await prisma.pipeline.findMany({
    select: {
      id: true,
      name: true,
      organizationId: true,
      stages: {
        select: { id: true, name: true, order: true, type: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  console.log(`[backfill] Found ${pipelines.length} pipelines`)

  let updatedCount = 0

  for (const pipeline of pipelines) {
    const classifications = pipeline.stages.map(s => ({
      ...s,
      newType: classifyStage(s.name),
    }))

    // Fallback: if no WON stage from heuristics, mark highest-order stage as WON
    const hasWon = classifications.some(s => s.newType === 'WON')
    if (!hasWon && classifications.length > 0) {
      const lastStage = classifications[classifications.length - 1]
      lastStage.newType = 'WON'
      console.log(`  [fallback] Pipeline "${pipeline.name}": marking "${lastStage.name}" (order ${lastStage.order}) as WON`)
    }

    for (const stage of classifications) {
      if (stage.type === stage.newType) continue // already correct

      console.log(`  [update] "${pipeline.name}" > "${stage.name}": ${stage.type} → ${stage.newType}`)
      updatedCount++

      if (!isDryRun) {
        await prisma.pipelineStage.update({
          where: { id: stage.id },
          data: { type: stage.newType },
        })
      }
    }
  }

  console.log(`\n[backfill] Done. ${updatedCount} stage(s) ${isDryRun ? 'would be' : 'were'} updated.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
