import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestUsers() {
  try {
    console.log('🔍 Procurando dados de teste com "Test User"...\n')

    // 1. Buscar usuários com "Test User" no nome
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Test User', mode: 'insensitive' } },
          { email: { contains: 'test', mode: 'insensitive' } },
        ],
      },
      include: {
        organization: true,
      },
    })

    console.log(`📊 Encontrados ${testUsers.length} usuários de teste`)

    if (testUsers.length === 0) {
      console.log('✅ Nenhum dado de teste encontrado!')
      return
    }

    // 2. Buscar organizações com "Test" no nome ou que pertencem a test users
    const testOrgIds = new Set(testUsers.map((u) => u.organizationId))

    const testOrgs = await prisma.organization.findMany({
      where: {
        OR: [
          { id: { in: Array.from(testOrgIds) } },
          { name: { contains: 'Test', mode: 'insensitive' } },
        ],
      },
      include: {
        users: true,
        contacts: true,
        deals: true,
        pipelines: true,
        pipelineStages: true,
        invites: true,
        tags: true,
      },
    })

    console.log(`📊 Encontradas ${testOrgs.length} organizações de teste\n`)

    // 3. Mostrar resumo do que será deletado
    console.log('📋 RESUMO DOS DADOS QUE SERÃO DELETADOS:')
    console.log('═'.repeat(50))

    let totalUsers = 0
    let totalContacts = 0
    let totalDeals = 0
    let totalPipelines = 0
    let totalStages = 0
    let totalInvites = 0
    let totalTags = 0

    testOrgs.forEach((org, index) => {
      console.log(`\n${index + 1}. Organização: "${org.name}"`)
      console.log(`   ID: ${org.id}`)
      console.log(`   Usuários: ${org.users.length}`)
      console.log(`   Contatos: ${org.contacts.length}`)
      console.log(`   Deals: ${org.deals.length}`)
      console.log(`   Pipelines: ${org.pipelines.length}`)
      console.log(`   Stages: ${org.pipelineStages.length}`)
      console.log(`   Convites: ${org.invites.length}`)
      console.log(`   Tags: ${org.tags.length}`)

      totalUsers += org.users.length
      totalContacts += org.contacts.length
      totalDeals += org.deals.length
      totalPipelines += org.pipelines.length
      totalStages += org.pipelineStages.length
      totalInvites += org.invites.length
      totalTags += org.tags.length
    })

    console.log('\n' + '═'.repeat(50))
    console.log('📊 TOTAIS:')
    console.log(`   Organizações: ${testOrgs.length}`)
    console.log(`   Usuários: ${totalUsers}`)
    console.log(`   Contatos: ${totalContacts}`)
    console.log(`   Deals: ${totalDeals}`)
    console.log(`   Pipelines: ${totalPipelines}`)
    console.log(`   Stages: ${totalStages}`)
    console.log(`   Convites: ${totalInvites}`)
    console.log(`   Tags: ${totalTags}`)
    console.log('═'.repeat(50))

    // 4. Confirmar deleção
    console.log('\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!')
    console.log('⚠️  Todos os dados listados acima serão PERMANENTEMENTE deletados.')
    console.log('\n💡 Para confirmar, execute o script com --confirm:')
    console.log('   npx tsx scripts/cleanup-test-users.ts --confirm\n')

    const confirmFlag = process.argv.includes('--confirm')

    if (!confirmFlag) {
      console.log('❌ Operação cancelada (sem --confirm flag)')
      return
    }

    // 5. Executar deleção
    console.log('\n🗑️  Iniciando deleção em etapas...\n')

    const orgIds = testOrgs.map((org) => org.id)

    // Etapa 1: Deletar usuários (não tem cascade)
    console.log('1️⃣ Deletando usuários...')
    const deletedUsers = await prisma.user.deleteMany({
      where: { organizationId: { in: orgIds } },
    })
    console.log(`   ✅ ${deletedUsers.count} usuários deletados`)

    // Etapa 2: Deletar pipelines (cascade deleta stages)
    console.log('2️⃣ Deletando pipelines e stages...')
    const deletedPipelines = await prisma.pipeline.deleteMany({
      where: { organizationId: { in: orgIds } },
    })
    console.log(`   ✅ ${deletedPipelines.count} pipelines deletados (stages via cascade)`)

    // Etapa 3: Deletar organizações (cascade deleta o resto)
    console.log('3️⃣ Deletando organizações...')
    const deleteResult = await prisma.organization.deleteMany({
      where: { id: { in: orgIds } },
    })
    console.log(`   ✅ ${deleteResult.count} organizações deletadas`)
    console.log('   ✅ Contacts, Deals, Tags, Invites, EmailLogs deletados (cascade)')

    console.log('\n🎉 Limpeza concluída com sucesso!\n')
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
cleanupTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
