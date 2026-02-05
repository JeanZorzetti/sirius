/**
 * Script de Migração v2.0 - Modular Plans
 *
 * Este script migra todos os clientes existentes para a nova estrutura v2.0:
 * 1. Migra clientes PRO → BUSINESS (com grandfathering)
 * 2. Aplica Soft Archive em clientes FREE >50 deals
 * 3. Inicializa ScrapingCredit e AgiQuota para todos
 *
 * Uso:
 *   tsx scripts/migrate-to-v2.ts --dry-run  # Preview sem alterar dados
 *   tsx scripts/migrate-to-v2.ts            # Executar migração
 */

import { prisma } from '../lib/prisma'
import { getQuota } from '../lib/entitlements'
import { SubscriptionTier } from '@prisma/client'
import { sendEmail } from '../lib/email'

// Configurações
const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')
const GRANDFATHERING_MONTHS = 6
const GRANDFATHERING_EXPIRES_AT = new Date()
GRANDFATHERING_EXPIRES_AT.setMonth(
  GRANDFATHERING_EXPIRES_AT.getMonth() + GRANDFATHERING_MONTHS
)
const FREE_DEAL_LIMIT_CUTOFF_DATE = new Date('2026-01-01') // Clientes antes desta data: grandfathering

interface MigrationStats {
  totalOrganizations: number
  proToBusiness: number
  freeWithGrandfathering: number
  freeWithSoftArchive: number
  scrapingCreditsCreated: number
  agiQuotasCreated: number
  errors: number
}

const stats: MigrationStats = {
  totalOrganizations: 0,
  proToBusiness: 0,
  freeWithGrandfathering: 0,
  freeWithSoftArchive: 0,
  scrapingCreditsCreated: 0,
  agiQuotasCreated: 0,
  errors: 0,
}

/**
 * Logging helper
 */
function log(message: string, data?: any) {
  if (VERBOSE || !DRY_RUN) {
    console.log(`[${new Date().toISOString()}] ${message}`, data || '')
  }
}

function warn(message: string, data?: any) {
  console.warn(`[WARN] ${message}`, data || '')
}

function error(message: string, err?: any) {
  console.error(`[ERROR] ${message}`, err || '')
  stats.errors++
}

/**
 * 1. Migrar clientes PRO → BUSINESS
 */
async function migrateProToBusiness() {
  log('\n=== 1. Migrar PRO → BUSINESS ===')

  // Buscar todas as organizações PRO
  const proOrgs = await prisma.organization.findMany({
    where: {
      // Usar o campo antigo "plan" para compatibilidade
      OR: [{ plan: 'PRO' }, { tier: 'PRO' }],
    },
    include: {
      users: {
        where: { orgRole: 'OWNER' },
        take: 1,
      },
    },
  })

  log(`Encontradas ${proOrgs.length} organizações PRO`)

  for (const org of proOrgs) {
    try {
      if (DRY_RUN) {
        log(`[DRY RUN] Migraria: ${org.name} (${org.id}) PRO → BUSINESS`)
        log(`  - Grandfathering: R$ 97,00 até ${GRANDFATHERING_EXPIRES_AT.toLocaleDateString('pt-BR')}`)
        stats.proToBusiness++
        continue
      }

      // Atualizar para BUSINESS com grandfathering
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          tier: 'BUSINESS',
          plan: 'BUSINESS', // Manter compatibilidade
          customPricing: 97.0, // Preço grandfathered
          customPricingExpiresAt: GRANDFATHERING_EXPIRES_AT,
        },
      })

      log(`✓ Migrado: ${org.name} → BUSINESS (grandfathered R$ 97)`)
      stats.proToBusiness++

      // Enviar email de comunicação
      const owner = org.users[0]
      if (owner) {
        try {
          await sendEmail({
            to: owner.email,
            subject: '🎉 Você foi promovido para o Plano BUSINESS!',
            html: `
              <h2>Olá ${owner.name || 'Usuário'},</h2>

              <p>Temos uma ótima notícia! Como agradecimento pela sua confiança,
              promovemos sua conta para o <strong>Plano BUSINESS</strong> (valor R$ 149/mês)
              GRATUITAMENTE por 6 meses.</p>

              <h3>Novas features que você já pode usar:</h3>
              <ul>
                <li>💬 Chat Center (WhatsApp integrado)</li>
                <li>🕵️ 50 créditos de prospecção/mês</li>
                <li>🎯 Distribuição automática de leads (Round-robin)</li>
                <li>📊 Relatórios de equipe</li>
              </ul>

              <p>Seu preço continua <strong>R$ 97/mês</strong> até
              ${GRANDFATHERING_EXPIRES_AT.toLocaleDateString('pt-BR')}.</p>

              <p>Aproveite!</p>
              <p>Equipe Sirius CRM</p>
            `,
          })

          log(`  → Email enviado para ${owner.email}`)
        } catch (emailError) {
          warn(`  → Falha ao enviar email para ${owner.email}`, emailError)
        }
      }
    } catch (err) {
      error(`Erro ao migrar ${org.name}:`, err)
    }
  }

  log(`\n✓ Migrados ${stats.proToBusiness} organizações PRO → BUSINESS`)
}

/**
 * 2. Aplicar Soft Archive em FREE >50 deals
 */
async function applySoftArchive() {
  log('\n=== 2. Aplicar Soft Archive (FREE >50 deals) ===')

  // Buscar organizações FREE
  const freeOrgs = await prisma.organization.findMany({
    where: {
      OR: [{ plan: 'FREE' }, { tier: 'FREE' }],
    },
    include: {
      deals: {
        where: { archived: false },
        orderBy: { updatedAt: 'desc' },
      },
      users: {
        where: { orgRole: 'OWNER' },
        take: 1,
      },
    },
  })

  log(`Encontradas ${freeOrgs.length} organizações FREE`)

  for (const org of freeOrgs) {
    try {
      const activeDealCount = org.deals.length

      if (activeDealCount <= 50) {
        if (VERBOSE) {
          log(`  - ${org.name}: ${activeDealCount} deals (OK, sem ação)`)
        }
        continue
      }

      // Cliente criado antes de 01/01/2026 → Grandfathering
      if (org.createdAt < FREE_DEAL_LIMIT_CUTOFF_DATE) {
        if (DRY_RUN) {
          log(
            `[DRY RUN] Grandfathering: ${org.name} (${activeDealCount} deals)`
          )
          stats.freeWithGrandfathering++
          continue
        }

        // Aplicar grandfathering (mantém todos os deals)
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            grandfatheredDealLimit: activeDealCount,
            grandfatheredAt: new Date(),
          },
        })

        log(
          `✓ Grandfathering: ${org.name} (limite: ${activeDealCount} deals)`
        )
        stats.freeWithGrandfathering++

        // Enviar email
        const owner = org.users[0]
        if (owner) {
          await sendEmail({
            to: owner.email,
            subject: '🎁 Você ganhou um upgrade de cortesia!',
            html: `
              <h2>Olá ${owner.name || 'Usuário'},</h2>

              <p>Temos boas notícias! Como agradecimento por ser um dos nossos
              primeiros clientes, você vai manter TODOS os seus <strong>${activeDealCount} deals ativos</strong>
              no plano FREE. 🎉</p>

              <h3>Mudança no plano FREE (a partir de hoje):</h3>
              <ul>
                <li>Novos clientes: Limite de 50 deals</li>
                <li>Você (cliente antigo): Mantém seus ${activeDealCount} deals</li>
              </ul>

              <p>Você não precisa fazer nada. Continue usando normalmente!</p>

              <p>Quer ainda mais? Conheça o <a href="https://siriuscrm.com.br/pricing">plano STARTER</a> (R$ 49/mês):</p>
              <ul>
                <li>Deals ilimitados</li>
                <li>Gestão de contatos avançada</li>
                <li>Analytics melhorados</li>
              </ul>

              <p>Obrigado pela confiança,</p>
              <p>Equipe Sirius CRM</p>
            `,
          })
        }
      } else {
        // Cliente recente → Soft Archive
        const dealsToArchive = org.deals.slice(50) // Deals 51+

        if (DRY_RUN) {
          log(
            `[DRY RUN] Soft Archive: ${org.name} (arquivar ${dealsToArchive.length} deals)`
          )
          stats.freeWithSoftArchive++
          continue
        }

        // Arquivar deals excedentes
        await prisma.deal.updateMany({
          where: {
            id: { in: dealsToArchive.map((d) => d.id) },
          },
          data: {
            archived: true,
            archivedReason: 'PLAN_LIMIT',
            archivedAt: new Date(),
          },
        })

        log(
          `✓ Soft Archive: ${org.name} (${dealsToArchive.length} deals arquivados)`
        )
        stats.freeWithSoftArchive++

        // Enviar email
        const owner = org.users[0]
        if (owner) {
          await sendEmail({
            to: owner.email,
            subject: '⚠️ Ação necessária: Seus deals foram arquivados',
            html: `
              <h2>Olá ${owner.name || 'Usuário'},</h2>

              <p>A partir de hoje, o plano FREE tem limite de 50 deals ativos.</p>

              <p>Sua conta tinha <strong>${activeDealCount} deals</strong>. Para se adequar ao limite:</p>
              <ul>
                <li>✅ 50 deals mais recentes: <strong>ATIVOS</strong> (você pode editar)</li>
                <li>📦 ${dealsToArchive.length} deals antigos: <strong>ARQUIVADOS</strong> (você pode ver)</li>
              </ul>

              <h3>Como reativar um deal arquivado:</h3>
              <ol>
                <li>Arquivar manualmente outro deal ativo, OU</li>
                <li>Upgrade para STARTER (R$ 49/mês) - Deals ilimitados</li>
              </ol>

              <p><a href="https://siriuscrm.com.br/app/deals?tab=archived">Ver deals arquivados</a></p>

              <p>Dúvidas? Responda este email.</p>

              <p>Equipe Sirius CRM</p>
            `,
          })
        }
      }
    } catch (err) {
      error(`Erro ao processar ${org.name}:`, err)
    }
  }

  log(
    `\n✓ Grandfathering aplicado: ${stats.freeWithGrandfathering} organizações`
  )
  log(`✓ Soft Archive aplicado: ${stats.freeWithSoftArchive} organizações`)
}

/**
 * 3. Inicializar ScrapingCredit para todas as organizações
 */
async function initializeScrapingCredits() {
  log('\n=== 3. Inicializar ScrapingCredit ===')

  const orgs = await prisma.organization.findMany({
    include: {
      scrapingCredit: true,
    },
  })

  log(`Processando ${orgs.length} organizações`)

  for (const org of orgs) {
    try {
      // Pular se já tem ScrapingCredit
      if (org.scrapingCredit) {
        if (VERBOSE) {
          log(`  - ${org.name}: já tem ScrapingCredit`)
        }
        continue
      }

      const tier = (org.tier || org.plan) as SubscriptionTier
      const monthlyQuota = getQuota(tier, 'scraping_monthly_credits')

      // FREE: 5 créditos iniciais (apenas uma vez)
      const initialBalance =
        tier === 'FREE'
          ? getQuota(tier, 'scraping_initial_credits')
          : monthlyQuota

      if (DRY_RUN) {
        log(
          `[DRY RUN] Criaria ScrapingCredit: ${org.name} (tier: ${tier}, balance: ${initialBalance})`
        )
        stats.scrapingCreditsCreated++
        continue
      }

      await prisma.scrapingCredit.create({
        data: {
          organizationId: org.id,
          balance: initialBalance,
          monthlyQuota,
          usedThisMonth: 0,
          lastRefill: new Date(),
        },
      })

      log(`✓ ScrapingCredit criado: ${org.name} (balance: ${initialBalance})`)
      stats.scrapingCreditsCreated++
    } catch (err) {
      error(`Erro ao criar ScrapingCredit para ${org.name}:`, err)
    }
  }

  log(`\n✓ Criados ${stats.scrapingCreditsCreated} ScrapingCredits`)
}

/**
 * 4. Inicializar AgiQuota para todas as organizações
 */
async function initializeAgiQuotas() {
  log('\n=== 4. Inicializar AgiQuota ===')

  const orgs = await prisma.organization.findMany({
    include: {
      agiQuota: true,
    },
  })

  log(`Processando ${orgs.length} organizações`)

  for (const org of orgs) {
    try {
      // Pular se já tem AgiQuota
      if (org.agiQuota) {
        if (VERBOSE) {
          log(`  - ${org.name}: já tem AgiQuota`)
        }
        continue
      }

      const tier = (org.tier || org.plan) as SubscriptionTier
      const monthlyLimit = getQuota(tier, 'agi_monthly_quota')

      if (DRY_RUN) {
        log(
          `[DRY RUN] Criaria AgiQuota: ${org.name} (tier: ${tier}, limit: ${monthlyLimit})`
        )
        stats.agiQuotasCreated++
        continue
      }

      await prisma.agiQuota.create({
        data: {
          organizationId: org.id,
          monthlyLimit,
          usedThisMonth: 0,
          lastReset: new Date(),
        },
      })

      log(`✓ AgiQuota criado: ${org.name} (limit: ${monthlyLimit})`)
      stats.agiQuotasCreated++
    } catch (err) {
      error(`Erro ao criar AgiQuota para ${org.name}:`, err)
    }
  }

  log(`\n✓ Criados ${stats.agiQuotasCreated} AgiQuotas`)
}

/**
 * 5. Executar migração completa
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║   🚀 Migração v2.0 - Modular Plans                    ║')
  console.log('╚════════════════════════════════════════════════════════╝')

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - Nenhum dado será alterado\n')
  } else {
    console.log('\n⚠️  EXECUTANDO MIGRAÇÃO REAL - Dados serão alterados\n')
    console.log('Pressione Ctrl+C nos próximos 5 segundos para cancelar...\n')
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  const startTime = Date.now()

  try {
    // Contar organizações
    stats.totalOrganizations = await prisma.organization.count()
    log(`Total de organizações: ${stats.totalOrganizations}`)

    // Executar migrações
    await migrateProToBusiness()
    await applySoftArchive()
    await initializeScrapingCredits()
    await initializeAgiQuotas()

    // Resumo
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n╔════════════════════════════════════════════════════════╗')
    console.log('║   ✅ Migração Concluída                               ║')
    console.log('╚════════════════════════════════════════════════════════╝\n')

    console.log('Estatísticas:')
    console.log(`  Total de organizações: ${stats.totalOrganizations}`)
    console.log(`  PRO → BUSINESS: ${stats.proToBusiness}`)
    console.log(
      `  FREE Grandfathering: ${stats.freeWithGrandfathering}`
    )
    console.log(`  FREE Soft Archive: ${stats.freeWithSoftArchive}`)
    console.log(
      `  ScrapingCredits criados: ${stats.scrapingCreditsCreated}`
    )
    console.log(`  AgiQuotas criados: ${stats.agiQuotasCreated}`)
    console.log(`  Erros: ${stats.errors}`)
    console.log(`  Duração: ${duration}s`)

    if (DRY_RUN) {
      console.log(
        '\n💡 Execute sem --dry-run para aplicar as mudanças de verdade'
      )
    } else {
      console.log('\n🎉 Migração concluída com sucesso!')
    }
  } catch (err) {
    error('Erro fatal durante migração:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
main().catch((err) => {
  error('Erro não tratado:', err)
  process.exit(1)
})
