/**
 * Backfill PipelineStage.type based on stage name heuristics.
 *
 * Rules (name-only, no fallback):
 *   WON  → name contains: ganho, fechado, won, vendido, aprovado, concluído, finalizado, concluido, fechamento, venda realizada
 *   LOST → name contains: perdido, lost, cancelado, recusado, desistiu, inativo, sem interesse, descartado, arquivado
 *   OPEN → everything else (stays OPEN — no forced fallback)
 *
 * Usage: npx tsx scripts/backfill-pipeline-stage-type.ts [--dry-run] [--reset]
 *   --reset  → resets ALL stages back to OPEN before applying heuristics
 */

import { prisma } from '@/lib/prisma'
import { PipelineStageType } from '@prisma/client'

const WON_KEYWORDS = ['ganho', 'fechado', 'fechamento', 'won', 'vendido', 'aprovado', 'concluído', 'concluido', 'finalizado', 'finalizado e ganho', 'venda realizada', 'negócio pago', 'negocio pago', 'contrato pago', 'cliente pago']
const LOST_KEYWORDS = ['perdido', 'lost', 'cancelado', 'recusado', 'desistiu', 'inativo', 'sem interesse', 'descartado', 'arquivado']

function classifyStage(name: string): PipelineStageType {
  const lower = name.toLowerCase()
  if (WON_KEYWORDS.some(k => lower.includes(k))) return 'WON'
  if (LOST_KEYWORDS.some(k => lower.includes(k))) return 'LOST'
  return 'OPEN'
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  const isReset = process.argv.includes('--reset')
  if (isDryRun) console.log('[backfill] DRY RUN — no changes will be written')

  // Step 1: Reset all stages to OPEN if --reset flag passed
  if (isReset) {
    console.log('[backfill] Resetting all stages to OPEN...')
    if (!isDryRun) {
      const { count } = await prisma.pipelineStage.updateMany({ data: { type: 'OPEN' } })
      console.log(`[backfill] Reset ${count} stages to OPEN`)
    } else {
      const count = await prisma.pipelineStage.count()
      console.log(`[backfill] Would reset ${count} stages to OPEN`)
    }
  }

  // Step 2: Apply heuristics (name-only, no fallback)
  const stages = await prisma.pipelineStage.findMany({
    select: { id: true, name: true, type: true, pipeline: { select: { name: true } } },
  })

  console.log(`[backfill] Classifying ${stages.length} stages by name...`)

  let updatedCount = 0

  for (const stage of stages) {
    const newType = classifyStage(stage.name)
    if (stage.type === newType) continue

    console.log(`  [update] "${stage.pipeline.name}" > "${stage.name}": ${stage.type} → ${newType}`)
    updatedCount++

    if (!isDryRun) {
      await prisma.pipelineStage.update({ where: { id: stage.id }, data: { type: newType } })
    }
  }

  console.log(`\n[backfill] Done. ${updatedCount} stage(s) ${isDryRun ? 'would be' : 'were'} updated.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
