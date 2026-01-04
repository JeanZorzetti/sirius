import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteUserData(email: string) {
  console.log(`🔍 Buscando dados relacionados ao email: ${email}`)

  try {
    // 1. Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    })

    if (!user) {
      console.log(`❌ Nenhum usuário encontrado com o email: ${email}`)
      return
    }

    console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id})`)
    console.log(`   Organização: ${user.organization.name} (ID: ${user.organizationId})`)

    // 2. Verificar se é o único usuário da organização
    const usersInOrg = await prisma.user.count({
      where: { organizationId: user.organizationId },
    })

    console.log(`\n📊 Total de usuários na organização: ${usersInOrg}`)

    // 3. Listar dados relacionados
    const [deals, notes, activities, emailLogs, invites, contacts] = await Promise.all([
      prisma.deal.count({ where: { userId: user.id } }),
      prisma.note.count({ where: { userId: user.id } }),
      prisma.activity.count({ where: { userId: user.id } }),
      prisma.emailLog.count({ where: { userId: user.id } }),
      prisma.invite.count({ where: { email } }),
      prisma.contact.count({ where: { email } }),
    ])

    console.log(`\n📋 Dados relacionados ao usuário:`)
    console.log(`   - Deals: ${deals}`)
    console.log(`   - Notes: ${notes}`)
    console.log(`   - Activities: ${activities}`)
    console.log(`   - Email Logs: ${emailLogs}`)
    console.log(`   - Invites: ${invites}`)
    console.log(`   - Contacts com este email: ${contacts}`)

    // 4. Confirmar exclusão
    console.log(`\n⚠️  ATENÇÃO: Iniciando exclusão de dados...`)

    // 5. Deletar dados em cascata
    await prisma.$transaction(async (tx) => {
      // Deletar notes do usuário
      if (notes > 0) {
        await tx.note.deleteMany({ where: { userId: user.id } })
        console.log(`✅ ${notes} notas deletadas`)
      }

      // Deletar activities do usuário
      if (activities > 0) {
        await tx.activity.deleteMany({ where: { userId: user.id } })
        console.log(`✅ ${activities} atividades deletadas`)
      }

      // Deletar email logs do usuário
      if (emailLogs > 0) {
        await tx.emailLog.deleteMany({ where: { userId: user.id } })
        console.log(`✅ ${emailLogs} email logs deletados`)
      }

      // Deletar invites com este email
      if (invites > 0) {
        await tx.invite.deleteMany({ where: { email } })
        console.log(`✅ ${invites} convites deletados`)
      }

      // Deletar contacts com este email (opcional - pode ter contatos com mesmo email)
      if (contacts > 0) {
        await tx.contact.deleteMany({ where: { email } })
        console.log(`✅ ${contacts} contatos deletados`)
      }

      // Deletar deals do usuário primeiro
      if (deals > 0) {
        await tx.deal.deleteMany({ where: { userId: user.id } })
        console.log(`✅ ${deals} deals deletados`)
      }

      // Deletar o usuário
      await tx.user.delete({
        where: { id: user.id },
      })
      console.log(`✅ Usuário deletado`)

      // Se for o único usuário, deletar a organização inteira
      if (usersInOrg === 1) {
        console.log(`\n⚠️  Este era o único usuário da organização. Deletando organização completa...`)

        // Deletar dados da organização em ordem correta (respeitando foreign keys)

        // 1. Deletar Tags (relacionadas com Deals via many-to-many)
        await tx.tag.deleteMany({ where: { organizationId: user.organizationId } })
        console.log(`✅ Tags deletadas`)

        // 2. Deletar PipelineStages (relacionadas com Deals)
        await tx.pipelineStage.deleteMany({ where: { organizationId: user.organizationId } })
        console.log(`✅ Pipeline Stages deletados`)

        // 3. Deletar Pipelines
        await tx.pipeline.deleteMany({ where: { organizationId: user.organizationId } })
        console.log(`✅ Pipelines deletados`)

        // 4. Deletar Contacts
        await tx.contact.deleteMany({ where: { organizationId: user.organizationId } })
        console.log(`✅ Contacts deletados`)

        // 5. Deletar Email Automation Settings
        await tx.emailAutomationSetting.deleteMany({ where: { organizationId: user.organizationId } })
        console.log(`✅ Email Automation Settings deletados`)

        // 6. Deletar Email Logs restantes
        await tx.emailLog.deleteMany({ where: { organizationId: user.organizationId } })
        console.log(`✅ Email Logs deletados`)

        // 7. Deletar Invites restantes
        await tx.invite.deleteMany({ where: { organizationId: user.organizationId } })
        console.log(`✅ Invites deletados`)

        // 8. Finalmente, deletar a organização
        await tx.organization.delete({
          where: { id: user.organizationId },
        })
        console.log(`✅ Organização "${user.organization.name}" deletada`)
      }
    })

    console.log(`\n✅ CONCLUÍDO: Todos os dados relacionados ao email ${email} foram deletados!`)
  } catch (error) {
    console.error(`❌ Erro ao deletar dados:`, error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar
const emailToDelete = 'verticecomp@gmail.com'
deleteUserData(emailToDelete)
