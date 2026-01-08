import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupRegularUsers() {
  try {
    console.log('🔍 Procurando dados com "Regular User"...\n')

    // 1. Buscar usuários com "Regular User" no nome
    const regularUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'Regular User', mode: 'insensitive' } },
          { email: { contains: 'regular', mode: 'insensitive' } },
        ],
      },
      include: {
        organization: true,
      },
    })

    console.log(`📊 Encontrados ${regularUsers.length} usuários regulares`)

    if (regularUsers.length === 0) {
      console.log('✅ Nenhum dado encontrado!')
      return
    }

    // 2. Buscar organizações com "Regular" no nome ou que pertencem a regular users
    const regularOrgIds = new Set(regularUsers.map((u) => u.organizationId))

    const regularOrgs = await prisma.organization.findMany({
      where: {
        OR: [
          { id: { in: Array.from(regularOrgIds) } },
          { name: { contains: 'Regular', mode: 'insensitive' } },
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

    console.log(`📊 Encontradas ${regularOrgs.length} organizações\n`)

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

    regularOrgs.forEach((org, index) => {
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
    console.log(`   Organizações: ${regularOrgs.length}`)
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
    console.log('   npx tsx scripts/cleanup-regular-users.ts --confirm\n')

    const confirmFlag = process.argv.includes('--confirm')

    if (!confirmFlag) {
      console.log('❌ Operação cancelada (sem --confirm flag)')
      return
    }

    // 5. Executar deleção
    console.log('\n🗑️  Iniciando deleção em etapas...\n')

    const orgIds = regularOrgs.map((org) => org.id)

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
    console.error('❌ Erro ao limpar dados:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
cleanupRegularUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
