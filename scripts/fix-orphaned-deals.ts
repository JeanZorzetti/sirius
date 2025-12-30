import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixOrphanedDeals() {
    console.log("=== FIXING ORPHANED DEALS ===\n")

    // Find all deals with organization mismatch
    const allDeals = await prisma.deal.findMany({
        include: {
            stage: true,
            organization: true
        }
    })

    const orphanedDeals = allDeals.filter(d => d.organizationId !== d.stage.organizationId)

    console.log(`Found ${orphanedDeals.length} orphaned deal(s)\n`)

    if (orphanedDeals.length === 0) {
        console.log("✓ No orphaned deals found. Nothing to fix.")
        return
    }

    // Group orphaned deals by their organization
    const dealsByOrg = new Map<string, typeof orphanedDeals>()
    for (const deal of orphanedDeals) {
        const existing = dealsByOrg.get(deal.organizationId) || []
        existing.push(deal)
        dealsByOrg.set(deal.organizationId, existing)
    }

    // Fix each organization's deals
    for (const [orgId, deals] of dealsByOrg) {
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            include: {
                pipelineStages: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        if (!org) {
            console.log(`⚠️  Organization ${orgId} not found, skipping...`)
            continue
        }

        console.log(`\n📊 Processing ${deals.length} deal(s) for organization: ${org.name}`)
        console.log(`   Organization stages available:`)
        org.pipelineStages.forEach(s => console.log(`     - ${s.name} (order: ${s.order})`))

        for (const deal of deals) {
            const wrongStage = deal.stage
            console.log(`\n   💰 Deal: "${deal.title}"`)
            console.log(`      Current stage: ${wrongStage.name} (order: ${wrongStage.order}) from WRONG org`)

            // Try to find a matching stage by order first, then by name
            let correctStage = org.pipelineStages.find(s => s.order === wrongStage.order)

            if (!correctStage) {
                // If no matching order, try to find by similar name
                correctStage = org.pipelineStages.find(s =>
                    s.name.toLowerCase().includes(wrongStage.name.toLowerCase()) ||
                    wrongStage.name.toLowerCase().includes(s.name.toLowerCase())
                )
            }

            if (!correctStage) {
                // Fallback to first stage
                correctStage = org.pipelineStages[0]
                console.log(`      ⚠️  No matching stage found, using first stage: ${correctStage.name}`)
            } else {
                console.log(`      ✓ Found matching stage: ${correctStage.name} (order: ${correctStage.order})`)
            }

            // Update the deal
            await prisma.deal.update({
                where: { id: deal.id },
                data: { stageId: correctStage.id }
            })

            console.log(`      ✅ Updated deal to correct stage`)
        }
    }

    console.log("\n\n✨ Orphaned deals fixed successfully!")
}

fixOrphanedDeals()
    .catch(e => {
        console.error("Error fixing orphaned deals:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
