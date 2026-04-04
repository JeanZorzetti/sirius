import { PrismaClient } from '.prisma/client-wa'

const globalForPrismaWa = globalThis as unknown as {
  prismaWa: PrismaClient | undefined
}

export const prismaWa = globalForPrismaWa.prismaWa ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrismaWa.prismaWa = prismaWa
