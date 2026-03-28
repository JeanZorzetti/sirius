/**
 * Grandfathering Script
 *
 * Protege os 3 clientes existentes (2 PRO a R$97 + 1 Business a R$149)
 * mantendo o preço antigo por 6 meses via customPricing + customPricingExpiresAt.
 *
 * Idempotente — não regranfather quem já tem customPricing definido.
 *
 * Usage: npx tsx scripts/grandfather-existing-customers.ts [--dry-run]
 */

import { PrismaClient, SubscriptionTier } from '@prisma/client'

const prisma = new PrismaClient()

const OLD_PRICES: Record<string, number> = {
  STARTER: 49,
  PRO: 97,
  BUSINESS: 149,
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')

  if (isDryRun) {
    console.log('🔍 DRY RUN — nenhuma alteração será feita\n')
  }

  // Buscar orgs pagas que NÃO são fundadores e NÃO têm customPricing já definido
  const orgs = await prisma.organization.findMany({
    where: {
      tier: { in: [SubscriptionTier.STARTER, SubscriptionTier.PRO, SubscriptionTier.BUSINESS] },
      isFounder: false,
      customPricing: null,
    },
    select: {
      id: true,
      name: true,
      tier: true,
      customPricing: true,
      customPricingExpiresAt: true,
      grandfatheredAt: true,
    },
  })

  if (orgs.length === 0) {
    console.log('✅ Nenhuma organização elegível para grandfathering.')
    return
  }

  console.log(`📋 ${orgs.length} organização(ões) elegível(is):\n`)

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 6)

  for (const org of orgs) {
    const oldPrice = OLD_PRICES[org.tier] || 0
    console.log(`  → ${org.name} (${org.tier}) — customPricing: R$${oldPrice} até ${expiresAt.toLocaleDateString('pt-BR')}`)

    if (!isDryRun) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          customPricing: oldPrice,
          customPricingExpiresAt: expiresAt,
          grandfatheredAt: new Date(),
        },
      })
    }
  }

  console.log(`\n${isDryRun ? '🔍 Dry run completo.' : '✅ Grandfathering aplicado com sucesso.'}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
