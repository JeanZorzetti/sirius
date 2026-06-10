import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
})

globalForPrisma.prisma = prisma

// Schema changes belong in prisma/migrations (applied via `prisma migrate deploy`
// in the build script) — never as runtime side effects here.
