import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
    _migrated: boolean
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
})

globalForPrisma.prisma = prisma

// Auto-apply pending column additions on first load
if (!globalForPrisma._migrated) {
    globalForPrisma._migrated = true
    prisma.$executeRawUnsafe(
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canViewDealClosings" BOOLEAN NOT NULL DEFAULT true`
    ).catch(() => {})
}
