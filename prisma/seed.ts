
import { PrismaClient } from '@prisma/client'
import { PrismaClient as WaClient } from '.prisma/client-wa'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()
const prismaWa = new WaClient()

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

    // 3. Create Default Pipeline
    const pipeline = await prisma.pipeline.create({
        data: {
            name: 'Pipeline Principal',
            isDefault: true,
            organizationId: org.id
        }
    })
    console.log('Created Pipeline:', pipeline.name)

    // 4. Create Pipeline Stages linked to Org and Pipeline
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
                organizationId: org.id,
                pipelineId: pipeline.id
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
            pipelineId: pipeline.id,
            userId: user.id,
            contactId: contact.id,
            organizationId: org.id
        }
    })
    console.log('Created Deal')

    // 6. Create Quick Replies (templates padrão)
    const quickRepliesData = [
        {
            shortcut: '/saudacao',
            title: 'Saudação Inicial',
            content: 'Olá {contato.nome}! Tudo bem? Como posso te ajudar?',
            category: 'saudacao',
        },
        {
            shortcut: '/obrigado',
            title: 'Agradecimento',
            content: 'Obrigado pelo contato, {contato.nome}! Qualquer dúvida, estou à disposição.',
            category: 'fechamento',
        },
        {
            shortcut: '/followup',
            title: 'Follow-up',
            content: 'Oi {contato.nome}, passando para dar continuidade ao nosso assunto. Conseguiu analisar?',
            category: 'followup',
        },
        {
            shortcut: '/horario',
            title: 'Horário de Atendimento',
            content: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.',
            category: 'saudacao',
        },
        {
            shortcut: '/pix',
            title: 'Dados PIX',
            content: 'Segue nossos dados para pagamento via PIX:\n\nChave PIX: contato@empresa.com\nBeneficiário: Empresa LTDA\nCNPJ: 00.000.000/0001-00',
            category: 'fechamento',
        },
    ]

    for (const qr of quickRepliesData) {
        await prismaWa.quickReply.create({
            data: {
                ...qr,
                organizationId: org.id,
            },
        })
    }
    console.log('Created Quick Replies')

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
        await prismaWa.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        await prismaWa.$disconnect()
        process.exit(1)
    })
