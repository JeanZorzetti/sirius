import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const transactions = await prisma.transaction.findMany({
    where: {
      type: 'PLAN_UPGRADE',
      status: 'COMPLETED'
    },
    select: {
      id: true,
      amount: true,
      feeAmount: true,
      netAmount: true,
      createdAt: true,
      organization: {
        select: {
          slug: true,
          isTestAccount: true,
          users: {
            select: {
              createdAt: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })

  console.log(JSON.stringify(transactions, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
