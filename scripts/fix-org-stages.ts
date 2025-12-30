import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_STAGES = [
    { name: 'Prospecção', order: 1 },
    { name: 'Qualificação', order: 2 },
    { name: 'Proposta', order: 3 },
    { name: 'Fechamento', order: 4 },
]

async function fixOrgStages() {
    console.log("Starting pipeline stage restoration...")

    // Get all organizations
    const organizations = await prisma.organization.findMany({
        include: {
            pipelineStages: true
        }
    })

    console.log(`Found ${organizations.length} organization(s)`)

    for (const org of organizations) {
        console.log(`\nChecking organization: ${org.name} (${org.id})`)
        console.log(`  Current stages: ${org.pipelineStages.length}`)

        if (org.pipelineStages.length === 0) {
            console.log(`  ⚠️  No stages found! Creating default stages...`)

            for (const stageData of DEFAULT_STAGES) {
                const created = await prisma.pipelineStage.create({
                    data: {
                        name: stageData.name,
                        order: stageData.order,
                        organizationId: org.id
                    }
                })
                console.log(`  ✓ Created stage: ${created.name} (order: ${created.order})`)
            }
        } else {
            console.log(`  ✓ Stages already exist`)
            org.pipelineStages.forEach(stage => {
                console.log(`    - ${stage.name} (order: ${stage.order})`)
            })
        }
    }

    console.log("\n✨ Pipeline stage restoration complete!")
}

fixOrgStages()
    .catch(e => {
        console.error("Error fixing pipeline stages:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
