import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_ORGANIZATION_SLUGS = [
  'teste-funil-977',
  'v-rtice-marketing-35',
  'zorzetti-979',
  'nux-digital-883',
  'roi-labs-224',
]

async function main() {
  // Últimos 28 dias
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)

  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      organization: {
        slug: {
          notIn: TEST_ORGANIZATION_SLUGS,
        },
      },
    },
    include: {
      organization: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  console.log(`\nEncontrados ${users.length} usuário(s) nos últimos 28 dias:\n`)

  users.forEach((user) => {
    console.log(`Email: ${user.email}`)
    console.log(`Nome: ${user.name || 'N/A'}`)
    console.log(`Organização: ${user.organization.name} (${user.organization.slug})`)
    console.log(`Criado em: ${user.createdAt.toLocaleString('pt-BR')}`)
    console.log(`---`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
