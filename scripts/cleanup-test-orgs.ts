/**
 * Script para limpar organizações de teste do banco de dados
 *
 * Remove todas as organizações que contêm "Test Org" no nome
 * e todos os dados relacionados (cascade delete).
 *
 * Uso:
 * npx tsx scripts/cleanup-test-orgs.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestOrgs() {
  try {
    console.log('🔍 Buscando organizações de teste...\n')

    // Buscar organizações de teste
    const testOrgs = await prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: 'Test Org', mode: 'insensitive' } },
          { name: { contains: 'test-org', mode: 'insensitive' } },
          { slug: { contains: 'test-org', mode: 'insensitive' } },
        ],
      },
      include: {
        users: true,
        contacts: true,
        deals: true,
        pipelines: true,
        pipelineStages: true,
        emailLogs: true,
        dealSnapshots: true,
        userActivities: true,
      },
    })

    if (testOrgs.length === 0) {
      console.log('✅ Nenhuma organização de teste encontrada.')
      return
    }

    console.log(`📊 Encontradas ${testOrgs.length} organizações de teste:\n`)

    // Mostrar o que será deletado
    for (const org of testOrgs) {
      console.log(`Organization: ${org.name} (${org.slug})`)
      console.log(`  - Usuários: ${org.users.length}`)
      console.log(`  - Contatos: ${org.contacts.length}`)
      console.log(`  - Deals: ${org.deals.length}`)
      console.log(`  - Pipelines: ${org.pipelines.length}`)
      console.log(`  - Stages: ${org.pipelineStages.length}`)
      console.log(`  - Email Logs: ${org.emailLogs.length}`)
      console.log(`  - Deal Snapshots: ${org.dealSnapshots.length}`)
      console.log(`  - User Activities: ${org.userActivities.length}`)
      console.log('')
    }

    // Calcular totais
    const totals = {
      organizations: testOrgs.length,
      users: testOrgs.reduce((sum, org) => sum + org.users.length, 0),
      contacts: testOrgs.reduce((sum, org) => sum + org.contacts.length, 0),
      deals: testOrgs.reduce((sum, org) => sum + org.deals.length, 0),
      pipelines: testOrgs.reduce((sum, org) => sum + org.pipelines.length, 0),
      stages: testOrgs.reduce((sum, org) => sum + org.pipelineStages.length, 0),
      emailLogs: testOrgs.reduce((sum, org) => sum + org.emailLogs.length, 0),
      dealSnapshots: testOrgs.reduce((sum, org) => sum + org.dealSnapshots.length, 0),
      userActivities: testOrgs.reduce((sum, org) => sum + org.userActivities.length, 0),
    }

    console.log('📈 TOTAIS A DELETAR:')
    console.log(`  - ${totals.organizations} organizações`)
    console.log(`  - ${totals.users} usuários`)
    console.log(`  - ${totals.contacts} contatos`)
    console.log(`  - ${totals.deals} deals`)
    console.log(`  - ${totals.pipelines} pipelines`)
    console.log(`  - ${totals.stages} stages`)
    console.log(`  - ${totals.emailLogs} email logs`)
    console.log(`  - ${totals.dealSnapshots} deal snapshots`)
    console.log(`  - ${totals.userActivities} user activities`)
    console.log('')

    // Confirmar deleção
    console.log('⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!\n')
    console.log('Deletando organizações de teste em 3 segundos...\n')

    // Aguardar 3 segundos
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Deletar em transação
    console.log('🗑️  Deletando...\n')

    const testOrgIds = testOrgs.map((org) => org.id)

    const result = await prisma.$transaction(async (tx) => {
      // Deletar na ordem correta das dependências

      // 1. Activities (depende de deals e users)
      const deletedActivities = await tx.activity.deleteMany({
        where: { deal: { organizationId: { in: testOrgIds } } },
      })
      console.log(`  ✓ Deletadas ${deletedActivities.count} activities`)

      // 2. Notes (depende de deals)
      const deletedNotes = await tx.note.deleteMany({
        where: { deal: { organizationId: { in: testOrgIds } } },
      })
      console.log(`  ✓ Deletadas ${deletedNotes.count} notes`)

      // 3. Deals (depende de stages, contacts, users, pipelines)
      const deletedDeals = await tx.deal.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedDeals.count} deals`)

      // 4. Pipeline Stages (depende de pipelines)
      const deletedStages = await tx.pipelineStage.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedStages.count} pipeline stages`)

      // 5. Pipelines
      const deletedPipelines = await tx.pipeline.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedPipelines.count} pipelines`)

      // 6. Contacts
      const deletedContacts = await tx.contact.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedContacts.count} contatos`)

      // 7. Tags
      const deletedTags = await tx.tag.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletadas ${deletedTags.count} tags`)

      // 8. Invites
      const deletedInvites = await tx.invite.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedInvites.count} invites`)

      // 9. Email Logs
      const deletedEmailLogs = await tx.emailLog.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedEmailLogs.count} email logs`)

      // 10. Email Automation Settings
      const deletedEmailSettings = await tx.emailAutomationSetting.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedEmailSettings.count} email settings`)

      // 11. Deal Snapshots
      const deletedDealSnapshots = await tx.dealSnapshot.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedDealSnapshots.count} deal snapshots`)

      // 12. User Activities
      const deletedUserActivities = await tx.userActivity.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletadas ${deletedUserActivities.count} user activities`)

      // 13. Revenue Snapshots
      const deletedRevenueSnapshots = await tx.revenueSnapshot.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedRevenueSnapshots.count} revenue snapshots`)

      // 14. Users
      const deletedUsers = await tx.user.deleteMany({
        where: { organizationId: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletados ${deletedUsers.count} usuários`)

      // 15. Organizations (finalmente!)
      const deletedOrgs = await tx.organization.deleteMany({
        where: { id: { in: testOrgIds } },
      })
      console.log(`  ✓ Deletadas ${deletedOrgs.count} organizações`)

      return {
        organizations: deletedOrgs.count,
        users: deletedUsers.count,
        pipelines: deletedPipelines.count,
        stages: deletedStages.count,
        deals: deletedDeals.count,
      }
    })

    console.log(`\n✅ Cleanup concluído com sucesso!`)
    console.log(`  - ${result.users} usuários deletados`)
    console.log(`  - ${result.organizations} organizações deletadas`)
    console.log('  - Todos os dados relacionados removidos via cascade delete\n')
  } catch (error) {
    console.error('❌ Erro ao limpar organizações de teste:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
cleanupTestOrgs()
  .then(() => {
    console.log('✅ Cleanup concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
