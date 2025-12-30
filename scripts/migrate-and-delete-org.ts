import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OLD_ORG_ID = 'a22d92c4-464e-4d59-a3b8-7c1823108c2f'
const NEW_ORG_ID = '3434a503-30b9-4b4c-b6d9-4c1386b158b9'

async function migrateAndDeleteOrg() {
    console.log("=== MIGRATING DATA AND DELETING DUPLICATE ORG ===\n")

    // Get old organization
    const oldOrg = await prisma.organization.findUnique({
        where: { id: OLD_ORG_ID },
        include: {
            contacts: true,
            deals: true,
            users: true,
            pipelineStages: true,
            invites: true,
            tags: true
        }
    })

    if (!oldOrg) {
        console.log(`❌ Organization ${OLD_ORG_ID} not found`)
        return
    }

    console.log(`📊 Old Organization: ${oldOrg.name} (${OLD_ORG_ID})`)
    console.log(`   Contacts: ${oldOrg.contacts.length}`)
    console.log(`   Deals (direct): ${oldOrg.deals.length}`)
    console.log(`   Users: ${oldOrg.users.length}`)
    console.log(`   Pipeline Stages: ${oldOrg.pipelineStages.length}`)

    // Check for orphaned deals
    console.log("\n=== CHECKING FOR ORPHANED DEALS ===")
    const allDeals = await prisma.deal.findMany({
        include: {
            stage: true
        }
    })
    const orphaned = allDeals.filter(d => d.organizationId !== d.stage.organizationId)
    console.log(`Found ${orphaned.length} orphaned deal(s)`)

    if (orphaned.length > 0) {
        console.log("⚠️  Please run fix-orphaned-deals.ts first!")
        return
    }

    // Migrate contacts to new organization
    if (oldOrg.contacts.length > 0) {
        console.log(`\n=== MIGRATING CONTACTS ===`)
        for (const contact of oldOrg.contacts) {
            console.log(`Moving contact: ${contact.name}`)
            await prisma.contact.update({
                where: { id: contact.id },
                data: { organizationId: NEW_ORG_ID }
            })
            console.log(`✓ Migrated contact: ${contact.name}`)
        }
    }

    // Now check if old org is clean
    const updatedOrg = await prisma.organization.findUnique({
        where: { id: OLD_ORG_ID },
        include: {
            contacts: true,
            deals: true
        }
    })

    if (updatedOrg && (updatedOrg.contacts.length > 0 || updatedOrg.deals.length > 0)) {
        console.log(`\n⚠️  Organization still has ${updatedOrg.deals.length} deals and ${updatedOrg.contacts.length} contacts`)
        console.log("Cannot proceed with deletion")
        return
    }

    console.log(`\n=== DELETING DUPLICATE ORGANIZATION ===`)

    // Delete in order due to foreign key constraints
    console.log("Deleting invites...")
    const deletedInvites = await prisma.invite.deleteMany({
        where: { organizationId: OLD_ORG_ID }
    })
    console.log(`✓ Deleted ${deletedInvites.count} invite(s)`)

    console.log("\nDeleting tags...")
    const deletedTags = await prisma.tag.deleteMany({
        where: { organizationId: OLD_ORG_ID }
    })
    console.log(`✓ Deleted ${deletedTags.count} tag(s)`)

    console.log("\nDeleting pipeline stages...")
    const deletedStages = await prisma.pipelineStage.deleteMany({
        where: { organizationId: OLD_ORG_ID }
    })
    console.log(`✓ Deleted ${deletedStages.count} pipeline stage(s)`)

    console.log("\nDeleting users...")
    const deletedUsers = await prisma.user.deleteMany({
        where: { organizationId: OLD_ORG_ID }
    })
    console.log(`✓ Deleted ${deletedUsers.count} user(s)`)

    console.log("\nDeleting organization...")
    await prisma.organization.delete({
        where: { id: OLD_ORG_ID }
    })
    console.log(`✓ Deleted organization: ${oldOrg.name}`)

    console.log("\n✨ Migration and deletion complete!")
    console.log("\nFinal status:")
    console.log(`   ✓ Migrated ${oldOrg.contacts.length} contact(s) to correct organization`)
    console.log(`   ✓ Deleted duplicate organization and all its stages/users`)
}

migrateAndDeleteOrg()
    .catch(e => {
        console.error("Error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
