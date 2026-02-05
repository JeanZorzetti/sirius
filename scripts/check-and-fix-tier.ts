/**
 * Script para verificar e corrigir o tier da organização
 *
 * Uso: npx tsx scripts/check-and-fix-tier.ts <email-do-usuario>
 */

import { prisma } from '../lib/prisma'

async function main() {
  const userEmail = process.argv[2]

  if (!userEmail) {
    console.error('❌ Uso: npx tsx scripts/check-and-fix-tier.ts <email-do-usuario>')
    process.exit(1)
  }

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      organization: true
    }
  })

  if (!user) {
    console.error(`❌ Usuário não encontrado: ${userEmail}`)
    process.exit(1)
  }

  if (!user.organization) {
    console.error(`❌ Usuário não tem organização`)
    process.exit(1)
  }

  console.log('\n📊 Status atual:')
  console.log(`   Email: ${user.email}`)
  console.log(`   Nome: ${user.name}`)
  console.log(`   Organização: ${user.organization.name}`)
  console.log(`   Tier atual: ${user.organization.tier}`)
  console.log(`   WhatsApp Instances: ${user.organization.whatsappInstances}`)

  // Verificar se precisa corrigir
  if (user.organization.tier === 'PRO') {
    console.log('\n✅ Tier já está correto (PRO)')
    console.log('   Acesso ao Chat Center: HABILITADO')
  } else {
    console.log(`\n⚠️  Tier incorreto: ${user.organization.tier}`)
    console.log('   Deseja atualizar para PRO? (Ctrl+C para cancelar)')

    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Atualizar para PRO
    await prisma.organization.update({
      where: { id: user.organization.id },
      data: {
        tier: 'PRO',
        whatsappInstances: 1 // PRO tem 1 instância WhatsApp
      }
    })

    console.log('\n✅ Tier atualizado para PRO!')
    console.log('   Acesso ao Chat Center: HABILITADO')
    console.log('   WhatsApp Instances: 1')
    console.log('\n🔄 Faça logout e login novamente no app para atualizar a sessão')
  }

  await prisma.$disconnect()
}

main().catch(console.error)
