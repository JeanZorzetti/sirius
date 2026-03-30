/**
 * enroll-existing-users.ts
 *
 * Backfill script: creates a Contact + Deal in the owner's pipeline
 * for every Organization that signed up before the lead-capture feature was added.
 *
 * Usage:
 *   LEADS_PIPELINE_ORG_ID=<your-org-id> npx tsx scripts/enroll-existing-users.ts
 *
 * Safe to run multiple times (idempotent).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const leadsOrgId = process.env.LEADS_PIPELINE_ORG_ID
  if (!leadsOrgId) {
    console.error('Missing env var LEADS_PIPELINE_ORG_ID')
    process.exit(1)
  }

  // Find owner's default pipeline + first stage
  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: leadsOrgId, isDefault: true },
    include: { stages: { orderBy: { order: 'asc' }, take: 1 } }
  })

  if (!pipeline || !pipeline.stages.length) {
    console.error('No default pipeline with stages found for LEADS_PIPELINE_ORG_ID')
    process.exit(1)
  }

  const firstStage = pipeline.stages[0]

  const owner = await prisma.user.findFirst({
    where: { organizationId: leadsOrgId, orgRole: 'OWNER' }
  })

  if (!owner) {
    console.error('No OWNER user found for LEADS_PIPELINE_ORG_ID')
    process.exit(1)
  }

  // Get all orgs except the leads org itself
  const orgs = await prisma.organization.findMany({
    where: { id: { not: leadsOrgId } },
    include: {
      users: {
        where: { orgRole: 'OWNER' },
        take: 1
      }
    }
  })

  console.log(`Found ${orgs.length} organizations to process`)

  let enrolled = 0
  let skipped = 0

  for (const org of orgs) {
    const ownerUser = org.users[0]
    if (!ownerUser) { skipped++; continue }

    const name = ownerUser.name || org.name
    const email = ownerUser.email

    // Upsert contact
    let contact = await prisma.contact.findFirst({
      where: { organizationId: leadsOrgId, email }
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name,
          email,
          company: org.name,
          organizationId: leadsOrgId,
        }
      })
    }

    // Skip if deal already exists
    const existingDeal = await prisma.deal.findFirst({
      where: { contactId: contact.id, pipelineId: pipeline.id }
    })

    if (existingDeal) { skipped++; continue }

    await prisma.deal.create({
      data: {
        title: `Lead: ${name}`,
        stageId: firstStage.id,
        pipelineId: pipeline.id,
        organizationId: leadsOrgId,
        userId: owner.id,
        contactId: contact.id,
      }
    })

    console.log(`  ✓ Enrolled: ${name} (${email}) — ${org.name}`)
    enrolled++
  }

  console.log(`\nDone. Enrolled: ${enrolled}, Skipped (already exists or no owner): ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
