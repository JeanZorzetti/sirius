
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // 1. Create Organization
    const org = await prisma.organization.create({
        data: {
            name: 'ROI Labs',
            slug: 'roi-labs',
        }
    })
    console.log('Created Organization:', org.name)

    // 2. Create User linked to Org
    const password = await hash('123456', 10)
    const user = await prisma.user.upsert({
        where: { email: 'admin@roilabs.com' },
        update: {},
        create: {
            email: 'admin@roilabs.com',
            name: 'Jean',
            password,
            organizationId: org.id
        },
    })
    console.log('Created User:', user.email)

    // 3. Create Pipeline Stages linked to Org
    const stagesData = [
        { name: 'Lead', order: 1 },
        { name: 'Qualificação', order: 2 },
        { name: 'Proposta', order: 3 },
        { name: 'Negociação', order: 4 },
        { name: 'Fechado', order: 5 },
    ]

    for (const stage of stagesData) {
        await prisma.pipelineStage.create({
            data: {
                ...stage,
                organizationId: org.id
            }
        })
    }
    console.log('Created Pipeline Stages')

    // Re-fetch stages to get IDs
    const stages = await prisma.pipelineStage.findMany({ where: { organizationId: org.id } })
    const qualifStage = stages.find(s => s.name === 'Qualificação') || stages[0]

    // 4. Create Contact linked to Org
    const contact = await prisma.contact.create({
        data: {
            name: 'Cliente Exemplo',
            email: 'cliente@exemplo.com',
            company: 'Acme Corp',
            organizationId: org.id
        }
    })
    console.log('Created Contact')

    // 5. Create Deal linked to Org
    await prisma.deal.create({
        data: {
            title: 'Contrato Anual SaaS',
            value: 5000.00,
            stageId: qualifStage.id,
            userId: user.id,
            contactId: contact.id,
            organizationId: org.id
        }
    })
    console.log('Created Deal')

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
