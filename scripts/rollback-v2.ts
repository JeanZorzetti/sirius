/**
 * Script de Rollback v2.0
 *
 * Reverte a migração v2.0 caso necessário.
 *
 * Uso:
 *   tsx scripts/rollback-v2.ts --dry-run  # Preview
 *   tsx scripts/rollback-v2.ts            # Executar rollback
 */

import { prisma } from '../lib/prisma'

const DRY_RUN = process.argv.includes('--dry-run')

interface RollbackStats {
  businessToPro: number
  dealsUnarchived: number
  grandfatheringRemoved: number
  scrapingCreditsDeleted: number
  agiQuotasDeleted: number
  errors: number
}

const stats: RollbackStats = {
  businessToPro: 0,
  dealsUnarchived: 0,
  grandfatheringRemoved: 0,
  scrapingCreditsDeleted: 0,
  agiQuotasDeleted: 0,
  errors: 0,
}

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

function error(message: string, err?: any) {
  console.error(`[ERROR] ${message}`, err || '')
  stats.errors++
}

/**
 * 1. Reverter BUSINESS → PRO
 */
async function rollbackBusinessToPro() {
  log('\n=== 1. Reverter BUSINESS → PRO ===')

  const businessOrgs = await prisma.organization.findMany({
    where: {
      tier: 'BUSINESS',
      customPricing: { not: null }, // Apenas os grandfathered
    },
  })

  log(`Encontradas ${businessOrgs.length} organizações BUSINESS grandfathered`)

  for (const org of businessOrgs) {
    try {
      if (DRY_RUN) {
        log(`[DRY RUN] Reverteria: ${org.name} BUSINESS → PRO`)
        stats.businessToPro++
        continue
      }

      await prisma.organization.update({
        where: { id: org.id },
        data: {
          tier: 'PRO',
          plan: 'PRO',
          customPricing: null,
          customPricingExpiresAt: null,
        },
      })

      log(`✓ Revertido: ${org.name} → PRO`)
      stats.businessToPro++
    } catch (err) {
      error(`Erro ao reverter ${org.name}:`, err)
    }
  }
}

/**
 * 2. Desarquivar deals (Soft Archive)
 */
async function unarchiveDeals() {
  log('\n=== 2. Desarquivar Deals ===')

  const archivedDeals = await prisma.deal.findMany({
    where: {
      archived: true,
      archivedReason: 'PLAN_LIMIT',
    },
  })

  log(`Encontrados ${archivedDeals.length} deals arquivados por limite de plano`)

  if (DRY_RUN) {
    log(`[DRY RUN] Desarquivaria ${archivedDeals.length} deals`)
    stats.dealsUnarchived = archivedDeals.length
  } else {
    await prisma.deal.updateMany({
      where: {
        archived: true,
        archivedReason: 'PLAN_LIMIT',
      },
      data: {
        archived: false,
        archivedReason: null,
        archivedAt: null,
      },
    })

    log(`✓ Desarquivados ${archivedDeals.length} deals`)
    stats.dealsUnarchived = archivedDeals.length
  }
}

/**
 * 3. Remover grandfathering de FREE
 */
async function removeGrandfathering() {
  log('\n=== 3. Remover Grandfathering (FREE) ===')

  const grandfatheredOrgs = await prisma.organization.findMany({
    where: {
      grandfatheredDealLimit: { not: null },
    },
  })

  log(`Encontradas ${grandfatheredOrgs.length} organizações com grandfathering`)

  for (const org of grandfatheredOrgs) {
    try {
      if (DRY_RUN) {
        log(`[DRY RUN] Removeria grandfathering: ${org.name}`)
        stats.grandfatheringRemoved++
        continue
      }

      await prisma.organization.update({
        where: { id: org.id },
        data: {
          grandfatheredDealLimit: null,
          grandfatheredAt: null,
        },
      })

      log(`✓ Grandfathering removido: ${org.name}`)
      stats.grandfatheringRemoved++
    } catch (err) {
      error(`Erro ao remover grandfathering de ${org.name}:`, err)
    }
  }
}

/**
 * 4. Deletar ScrapingCredits (CUIDADO: perde dados de créditos usados)
 */
async function deleteScrapingCredits() {
  log('\n=== 4. Deletar ScrapingCredits ===')

  const count = await prisma.scrapingCredit.count()

  log(`Encontrados ${count} ScrapingCredits`)

  if (DRY_RUN) {
    log(`[DRY RUN] Deletaria ${count} ScrapingCredits`)
    stats.scrapingCreditsDeleted = count
  } else {
    const result = await prisma.scrapingCredit.deleteMany({})

    log(`✓ Deletados ${result.count} ScrapingCredits`)
    stats.scrapingCreditsDeleted = result.count
  }
}

/**
 * 5. Deletar AgiQuotas
 */
async function deleteAgiQuotas() {
  log('\n=== 5. Deletar AgiQuotas ===')

  const count = await prisma.agiQuota.count()

  log(`Encontrados ${count} AgiQuotas`)

  if (DRY_RUN) {
    log(`[DRY RUN] Deletaria ${count} AgiQuotas`)
    stats.agiQuotasDeleted = count
  } else {
    const result = await prisma.agiQuota.deleteMany({})

    log(`✓ Deletados ${result.count} AgiQuotas`)
    stats.agiQuotasDeleted = result.count
  }
}

/**
 * Main
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║   ⚠️  ROLLBACK v2.0 - Reverter Migração               ║')
  console.log('╚════════════════════════════════════════════════════════╝')

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - Nenhum dado será alterado\n')
  } else {
    console.log('\n⚠️⚠️⚠️  ATENÇÃO: ESTA OPERAÇÃO É DESTRUTIVA ⚠️⚠️⚠️\n')
    console.log('Você está prestes a reverter a migração v2.0.')
    console.log('Isso irá:')
    console.log('  - Reverter BUSINESS → PRO')
    console.log('  - Desarquivar deals')
    console.log('  - Remover grandfathering')
    console.log('  - DELETAR todos os ScrapingCredits e AgiQuotas\n')
    console.log('Pressione Ctrl+C nos próximos 10 segundos para cancelar...\n')
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }

  const startTime = Date.now()

  try {
    await rollbackBusinessToPro()
    await unarchiveDeals()
    await removeGrandfathering()
    await deleteScrapingCredits()
    await deleteAgiQuotas()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n╔════════════════════════════════════════════════════════╗')
    console.log('║   ✅ Rollback Concluído                               ║')
    console.log('╚════════════════════════════════════════════════════════╝\n')

    console.log('Estatísticas:')
    console.log(`  BUSINESS → PRO: ${stats.businessToPro}`)
    console.log(`  Deals desarquivados: ${stats.dealsUnarchived}`)
    console.log(`  Grandfathering removido: ${stats.grandfatheringRemoved}`)
    console.log(`  ScrapingCredits deletados: ${stats.scrapingCreditsDeleted}`)
    console.log(`  AgiQuotas deletados: ${stats.agiQuotasDeleted}`)
    console.log(`  Erros: ${stats.errors}`)
    console.log(`  Duração: ${duration}s`)

    if (DRY_RUN) {
      console.log('\n💡 Execute sem --dry-run para aplicar o rollback')
    }
  } catch (err) {
    error('Erro fatal durante rollback:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  error('Erro não tratado:', err)
  process.exit(1)
})
