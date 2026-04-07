/**
 * Re-enroll missing leads into the leads pipeline.
 *
 * Run: npx tsx scripts/re-enroll-missing-leads.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const LEADS_ORG_ID = '09c166c7-b3d9-4eda-bfe3-f5bf83fc3ab5'

async function main() {
  // 1. Get the default pipeline + first stage
  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: LEADS_ORG_ID, isDefault: true },
    include: { stages: { orderBy: { order: 'asc' }, take: 1 } }
  })

  if (!pipeline || !pipeline.stages.length) {
    console.error('Pipeline or first stage not found')
    process.exit(1)
  }

  const firstStage = pipeline.stages[0]

  // 2. Get the OWNER of the leads org
  const owner = await prisma.user.findFirst({
    where: { organizationId: LEADS_ORG_ID, orgRole: 'OWNER' }
  })

  if (!owner) {
    console.error('Owner not found for leads org')
    process.exit(1)
  }

  // 3. Get all OWNER users (new signups) excluding internal accounts
  const allOwners = await prisma.user.findMany({
    where: { orgRole: 'OWNER' },
    select: { name: true, email: true, createdAt: true, organization: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  })

  // 4. Get emails that already have deals in the pipeline
  const existingDeals = await prisma.deal.findMany({
    where: { organizationId: LEADS_ORG_ID, pipelineId: pipeline.id },
    include: { contact: { select: { email: true } } }
  })
  const existingEmails = new Set(existingDeals.map(d => d.contact?.email).filter(Boolean))

  // 5. Filter to missing leads (exclude internal accounts)
  const internalEmails = new Set(['jeanzorzetti@gmail.com', 'demo.agent@roilabs.com.br'])
  const missing = allOwners.filter(u => !existingEmails.has(u.email) && !internalEmails.has(u.email))

  if (missing.length === 0) {
    console.log('No missing leads found. All good!')
    return
  }

  console.log(`Found ${missing.length} missing leads to re-enroll:\n`)

  for (const user of missing) {
    console.log(`  - ${user.createdAt.toISOString().slice(0, 10)} | ${user.name} | ${user.email} | ${user.organization?.name}`)
  }

  console.log('')

  // 6. Create contacts + deals
  let created = 0
  for (const user of missing) {
    // Upsert contact
    let contact = await prisma.contact.findFirst({
      where: { organizationId: LEADS_ORG_ID, email: user.email }
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: user.name || 'Sem nome',
          email: user.email,
          company: user.organization?.name || null,
          organizationId: LEADS_ORG_ID,
        }
      })
      console.log(`  [+] Contact created: ${user.email}`)
    } else {
      console.log(`  [=] Contact already exists: ${user.email}`)
    }

    // Create deal
    await prisma.deal.create({
      data: {
        title: `Lead: ${user.name || user.email}`,
        stageId: firstStage.id,
        pipelineId: pipeline.id,
        organizationId: LEADS_ORG_ID,
        userId: owner.id,
        contactId: contact.id,
      }
    })
    console.log(`  [+] Deal created: Lead: ${user.name}`)
    created++
  }

  console.log(`\nDone! ${created} leads re-enrolled.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
