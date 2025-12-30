import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ORG_ID_TO_DELETE = 'a22d92c4-464e-4d59-a3b8-7c1823108c2f'

async function deleteDuplicateOrg() {
    console.log("=== CHECKING ORGANIZATION BEFORE DELETION ===\n")

    const org = await prisma.organization.findUnique({
        where: { id: ORG_ID_TO_DELETE },
        include: {
            users: true,
            contacts: true,
            deals: true,
            pipelineStages: {
                include: {
                    deals: true
                }
            },
            invites: true,
            tags: true
        }
    })

    if (!org) {
        console.log(`❌ Organization ${ORG_ID_TO_DELETE} not found`)
        return
    }

    console.log(`📊 Organization: ${org.name}`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Slug: ${org.slug}`)
    console.log(`   Plan: ${org.plan}`)
    console.log(`   Created: ${org.createdAt}`)
    console.log(`\n📈 Organization Data:`)
    console.log(`   Users: ${org.users.length}`)
    org.users.forEach(u => console.log(`     - ${u.email} (${u.orgRole})`))
    console.log(`   Contacts: ${org.contacts.length}`)
    console.log(`   Deals: ${org.deals.length}`)
    console.log(`   Pipeline Stages: ${org.pipelineStages.length}`)
    org.pipelineStages.forEach(s => {
        console.log(`     - ${s.name} (${s.deals.length} deals)`)
    })
    console.log(`   Invites: ${org.invites.length}`)
    console.log(`   Tags: ${org.tags.length}`)

    // Check if safe to delete
    const hasImportantData = org.deals.length > 0 || org.contacts.length > 0
    const totalDealsInStages = org.pipelineStages.reduce((sum, s) => sum + s.deals.length, 0)

    if (hasImportantData || totalDealsInStages > 0) {
        console.log(`\n⚠️  CANNOT DELETE: Organization has ${org.deals.length} deals and ${org.contacts.length} contacts`)
        console.log(`   Please review the data before deleting.`)
        return
    }

    console.log(`\n✓ Organization appears safe to delete (no deals or contacts)`)
    console.log(`\nProceeding with deletion...\n`)

    // Delete in order due to foreign key constraints
    console.log("Deleting invites...")
    await prisma.invite.deleteMany({
        where: { organizationId: ORG_ID_TO_DELETE }
    })
    console.log(`✓ Deleted ${org.invites.length} invite(s)`)

    console.log("\nDeleting tags...")
    await prisma.tag.deleteMany({
        where: { organizationId: ORG_ID_TO_DELETE }
    })
    console.log(`✓ Deleted ${org.tags.length} tag(s)`)

    console.log("\nDeleting pipeline stages...")
    await prisma.pipelineStage.deleteMany({
        where: { organizationId: ORG_ID_TO_DELETE }
    })
    console.log(`✓ Deleted ${org.pipelineStages.length} pipeline stage(s)`)

    console.log("\nDeleting users...")
    await prisma.user.deleteMany({
        where: { organizationId: ORG_ID_TO_DELETE }
    })
    console.log(`✓ Deleted ${org.users.length} user(s)`)

    console.log("\nDeleting organization...")
    await prisma.organization.delete({
        where: { id: ORG_ID_TO_DELETE }
    })
    console.log(`✓ Deleted organization: ${org.name}`)

    console.log("\n✨ Duplicate organization successfully deleted!")
}

deleteDuplicateOrg()
    .catch(e => {
        console.error("Error deleting organization:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
