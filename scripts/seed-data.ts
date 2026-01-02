import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Create Stages
    const stagesData = [
        { name: 'Prospecção', order: 1 },
        { name: 'Qualificação', order: 2 },
        { name: 'Proposta', order: 3 },
        { name: 'Fechamento', order: 4 },
    ]

    console.log("Seeding stages...")
    for (const s of stagesData) {
        await prisma.pipelineStage.upsert({
            where: { id: s.name }, // Using name as ID for simplicity in upsert logic check if acceptable, wait schema id is uuid. Need findFirst.
            // Correction: Schema id is UUID. Can't easy upsert by name unless unique. 
            // Workaround: delete all and recreate or just create if count is 0. 
            // For MVP script, let's just create if not exists.
        })
    }
}
// Rewriting for safety:
const stagesList = ['Prospecção', 'Qualificação', 'Proposta', 'Fechamento']

async function seed() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@crm.com' },
        include: { organization: true }
    })
    if (!user) throw new Error("User admin not found")
    if (!user.organizationId) throw new Error("User has no organization")

    for (let i = 0; i < stagesList.length; i++) {
        const name = stagesList[i]
        const existing = await prisma.pipelineStage.findFirst({
            where: {
                name,
                organizationId: user.organizationId
            }
        })
        let stageId = existing?.id

        if (!existing) {
            // Get default pipeline
            const defaultPipeline = await prisma.pipeline.findFirst({
                where: {
                    organizationId: user.organizationId,
                    isDefault: true
                }
            })

            if (!defaultPipeline) {
                throw new Error("No default pipeline found")
            }

            const created = await prisma.pipelineStage.create({
                data: {
                    name,
                    order: i + 1,
                    organizationId: user.organizationId,
                    pipelineId: defaultPipeline.id
                }
            })
            stageId = created.id
            console.log(`Created stage: ${name}`)
        } else {
            console.log(`Stage exists: ${name}`)
        }

        // Create a sample deal in the first stage
        if (i === 0 && existing) {
            await prisma.deal.create({
                data: {
                    title: 'Venda de Licença Enterprise',
                    value: 5000.00,
                    stageId: stageId!,
                    pipelineId: existing.pipelineId,
                    userId: user.id,
                    organizationId: user.organizationId
                }
            })
            console.log("Created sample deal")
        }
    }
}

seed()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
