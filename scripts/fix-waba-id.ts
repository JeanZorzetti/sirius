/**
 * View or fix wabaBusinessAccountId for an organization.
 *
 * Usage:
 *   npx tsx scripts/fix-waba-id.ts                          → list orgs with WABA data
 *   npx tsx scripts/fix-waba-id.ts <organizationId> <wabaBusinessAccountId>  → set it
 *
 * Converted from the former /api/admin/fix-waba-id route (002-remove-dead-code, US5).
 */

import { prisma } from '@/lib/prisma'

async function list() {
  const orgs = await prisma.organization.findMany({
    where: { OR: [{ wabaEnabled: true }, { wabaBusinessAccountId: { not: null } }] },
    select: { id: true, name: true, wabaBusinessAccountId: true, wabaPhoneNumberId: true, wabaEnabled: true },
  })
  console.log(orgs)
}

async function fix(organizationId: string, wabaBusinessAccountId: string) {
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { wabaBusinessAccountId },
    select: { id: true, name: true, wabaBusinessAccountId: true },
  })
  console.log('Updated:', org)
}

async function main() {
  const [organizationId, wabaBusinessAccountId] = process.argv.slice(2)
  if (organizationId && wabaBusinessAccountId) {
    await fix(organizationId, wabaBusinessAccountId)
  } else {
    await list()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
