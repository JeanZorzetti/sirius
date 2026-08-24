/**
 * One-time migration: adds canViewDealClosings column to User table if it doesn't exist.
 *
 * Usage: npx tsx scripts/add-closings-permission.ts
 *
 * Converted from the former /api/admin/add-closings-permission route (002-remove-dead-code, US5).
 */

import { prisma } from '@/lib/prisma'

async function main() {
  await prisma.$executeRaw`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canViewDealClosings" BOOLEAN NOT NULL DEFAULT true
  `
  console.log('Column canViewDealClosings added (or already existed)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
