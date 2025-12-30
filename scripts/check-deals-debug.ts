import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDeals() {
    console.log("=== CHECKING DEALS AND ORGANIZATIONS ===\n")

    // Get all organizations
    const orgs = await prisma.organization.findMany({
        include: {
            pipelineStages: {
                include: {
                    deals: true
                }
            },
            deals: true,
            users: true
        }
    })

    console.log(`Found ${orgs.length} organization(s)\n`)

    for (const org of orgs) {
        console.log(`\n📊 Organization: ${org.name}`)
        console.log(`   ID: ${org.id}`)
        console.log(`   Users: ${org.users.length}`)
        org.users.forEach(u => console.log(`     - ${u.email} (role: ${u.orgRole})`))

        console.log(`   Pipeline Stages: ${org.pipelineStages.length}`)
        org.pipelineStages.forEach(s => {
            console.log(`     - ${s.name} (order: ${s.order}) - ${s.deals.length} deals`)
        })

        console.log(`   Total Deals in Org: ${org.deals.length}`)
    }

    // Get all deals with full details
    console.log("\n\n=== ALL DEALS IN DATABASE ===\n")
    const allDeals = await prisma.deal.findMany({
        include: {
            stage: {
                include: {
                    organization: true
                }
            },
            organization: true,
            user: true,
            contact: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    console.log(`Total deals: ${allDeals.length}\n`)

    for (const deal of allDeals) {
        console.log(`\n💰 Deal: ${deal.title}`)
        console.log(`   ID: ${deal.id}`)
        console.log(`   Value: ${deal.value}`)
        console.log(`   Created: ${deal.createdAt}`)
        console.log(`   Deal.organizationId: ${deal.organizationId}`)
        console.log(`   Deal.organization: ${deal.organization.name} (${deal.organization.id})`)
        console.log(`   Deal.stageId: ${deal.stageId}`)
        console.log(`   Stage.name: ${deal.stage.name}`)
        console.log(`   Stage.organizationId: ${deal.stage.organizationId}`)
        console.log(`   Stage.organization: ${deal.stage.organization.name} (${deal.stage.organization.id})`)
        console.log(`   Assigned User: ${deal.user.email}`)
        console.log(`   Contact: ${deal.contact?.name || 'None'}`)

        // Check for mismatches
        if (deal.organizationId !== deal.stage.organizationId) {
            console.log(`   ⚠️  MISMATCH: Deal org (${deal.organizationId}) != Stage org (${deal.stage.organizationId})`)
        }
    }

    // Check for orphaned deals
    console.log("\n\n=== CHECKING FOR ORPHANED DEALS ===\n")
    const dealsWithMismatch = allDeals.filter(d => d.organizationId !== d.stage.organizationId)
    if (dealsWithMismatch.length > 0) {
        console.log(`⚠️  Found ${dealsWithMismatch.length} deal(s) with organization mismatch!`)
        dealsWithMismatch.forEach(d => {
            console.log(`   - "${d.title}" (Deal org: ${d.organization.name}, Stage org: ${d.stage.organization.name})`)
        })
    } else {
        console.log("✓ No orphaned deals found")
    }
}

checkDeals()
    .catch(e => {
        console.error("Error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
