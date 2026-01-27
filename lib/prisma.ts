import { PrismaClient } from '@prisma/client'
import { checkAndCompleteStep } from './onboarding-service'

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof prismaBase.$extends> | PrismaClient | undefined
}

// ✅ Prisma Client Base (sem extensions)
const prismaBase = new PrismaClient()

// ✅ Prisma Client com Extensions (Onboarding auto-detection)
const prismaWithExtensions = prismaBase.$extends({
  query: {
    // ✅ Organization.update → detecta conclusão de "organization"
    organization: {
      async update({ args, query }) {
        const result = await query(args)

        // Chamar service de forma SÍNCRONA (garante conclusão antes da Lambda morrer)
        if (result.id) {
          await checkAndCompleteStep(prismaBase, result.id, 'organization').catch(err => {
            console.error('[Prisma Extension] Error completing organization step:', err)
          })
        }

        return result
      },
    },

    // ✅ Pipeline.create → detecta conclusão de "pipeline"
    pipeline: {
      async create({ args, query }) {
        const result = await query(args)

        if (result.organizationId) {
          await checkAndCompleteStep(prismaBase, result.organizationId, 'pipeline').catch(err => {
            console.error('[Prisma Extension] Error completing pipeline step:', err)
          })
        }

        return result
      },
    },

    // ✅ Contact.create → detecta conclusão de "first_contact"
    contact: {
      async create({ args, query }) {
        const result = await query(args)

        if (result.organizationId) {
          await checkAndCompleteStep(prismaBase, result.organizationId, 'first_contact').catch(err => {
            console.error('[Prisma Extension] Error completing first_contact step:', err)
          })
        }

        return result
      },
    },

    // ✅ Deal.create → detecta conclusão de "first_deal"
    deal: {
      async create({ args, query }) {
        const result = await query(args)

        if (result.organizationId) {
          await checkAndCompleteStep(prismaBase, result.organizationId, 'first_deal').catch(err => {
            console.error('[Prisma Extension] Error completing first_deal step:', err)
          })
        }

        return result
      },
    },
  },
})

// ✅ Export principal (com extensions para onboarding auto-detection)
// Type assertion para manter compatibilidade total com PrismaClient
export const prisma = (globalForPrisma.prisma ?? prismaWithExtensions) as unknown as PrismaClient

// ✅ Export do Prisma Base (sem extensions) para queries complexas
// Use quando tiver conflitos de tipo com extensions (groupBy, aggregate, $transaction)
export const prismaRaw = prismaBase

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma as any
