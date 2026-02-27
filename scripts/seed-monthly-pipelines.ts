/**
 * seed-monthly-pipelines.ts
 *
 * Para a org "DFranchise Lab":
 * 1. Encontra a pipeline com 161 deals (pipeline de origem)
 * 2. Cria 14 pipelines mensais: Jan/2025 → Fev/2026
 * 3. Para cada deal da origem com closeDate, copia-o para a pipeline do mês correspondente
 *
 * REGRA: A pipeline de origem NÃO é alterada.
 *
 * Execução: npx tsx scripts/seed-monthly-pipelines.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MONTHS = [
  { year: 2025, month: 1,  name: 'Janeiro 2025' },
  { year: 2025, month: 2,  name: 'Fevereiro 2025' },
  { year: 2025, month: 3,  name: 'Março 2025' },
  { year: 2025, month: 4,  name: 'Abril 2025' },
  { year: 2025, month: 5,  name: 'Maio 2025' },
  { year: 2025, month: 6,  name: 'Junho 2025' },
  { year: 2025, month: 7,  name: 'Julho 2025' },
  { year: 2025, month: 8,  name: 'Agosto 2025' },
  { year: 2025, month: 9,  name: 'Setembro 2025' },
  { year: 2025, month: 10, name: 'Outubro 2025' },
  { year: 2025, month: 11, name: 'Novembro 2025' },
  { year: 2025, month: 12, name: 'Dezembro 2025' },
  { year: 2026, month: 1,  name: 'Janeiro 2026' },
  { year: 2026, month: 2,  name: 'Fevereiro 2026' },
]

async function main() {
  // 1. Encontra a organização
  const org = await prisma.organization.findFirst({
    where: { name: { contains: 'DFranch', mode: 'insensitive' } },
    select: { id: true, name: true },
  })
  if (!org) throw new Error('Organização DFranchise Lab não encontrada')
  console.log(`✓ Org: ${org.name} (${org.id})`)

  // 2. Encontra a pipeline com mais deals (a de origem)
  const allPipelines = await prisma.pipeline.findMany({
    where: { organizationId: org.id },
    select: {
      id: true, name: true, isDefault: true,
      _count: { select: { deals: true } },
    },
  })

  const sourcePipeline = allPipelines
    .filter(p => !MONTHS.some(m => p.name === m.name)) // exclui mensais já criadas
    .sort((a, b) => b._count.deals - a._count.deals)[0]

  if (!sourcePipeline) throw new Error('Pipeline de origem não encontrada')
  console.log(`✓ Pipeline de origem: "${sourcePipeline.name}" — ${sourcePipeline._count.deals} deals`)

  // 3. Busca stages da pipeline de origem (por ordem)
  const sourceStages = await prisma.pipelineStage.findMany({
    where: { pipelineId: sourcePipeline.id },
    orderBy: { order: 'asc' },
  })
  console.log(`✓ Etapas da origem: ${sourceStages.map(s => s.name).join(', ')}`)

  // 4. Busca todos os deals da origem com closeDate
  const sourceDeals = await prisma.deal.findMany({
    where: { pipelineId: sourcePipeline.id, closeDate: { not: null } },
    select: {
      id: true, title: true, value: true, closeDate: true,
      stageId: true, contactId: true, userId: true,
      dueDate: true, status: true, lostReason: true, order: true,
    },
  })
  console.log(`✓ Deals com closeDate: ${sourceDeals.length}`)

  // 5. Para cada mês, cria pipeline + stages + copia deals
  for (const { year, month, name } of MONTHS) {
    // Verifica se já existe
    const existing = await prisma.pipeline.findFirst({
      where: { organizationId: org.id, name },
    })
    if (existing) {
      console.log(`  ↷ Pipeline "${name}" já existe — pulando`)
      continue
    }

    // Cria pipeline mensal com as mesmas etapas
    const newPipeline = await prisma.pipeline.create({
      data: {
        name,
        isDefault: false,
        organizationId: org.id,
        stages: {
          create: sourceStages.map(s => ({
            name: s.name,
            order: s.order,
            organizationId: org.id,
          })),
        },
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    })

    // Mapa: order da etapa origem → id da etapa nova
    const stageOrderToNewId = new Map<number, string>()
    for (const ns of newPipeline.stages) {
      stageOrderToNewId.set(ns.order, ns.id)
    }
    const sourceStageOrderMap = new Map<string, number>()
    for (const ss of sourceStages) {
      sourceStageOrderMap.set(ss.id, ss.order)
    }

    // Filtra deals do mês
    const monthDeals = sourceDeals.filter(d => {
      const cd = new Date(d.closeDate!)
      return cd.getFullYear() === year && cd.getMonth() + 1 === month
    })

    // Copia deals
    let copied = 0
    for (const deal of monthDeals) {
      const srcOrder = sourceStageOrderMap.get(deal.stageId) ?? 1
      const newStageId = stageOrderToNewId.get(srcOrder) ?? newPipeline.stages[0].id

      await prisma.deal.create({
        data: {
          title: deal.title,
          value: deal.value,
          closeDate: deal.closeDate,
          dueDate: deal.dueDate,
          order: deal.order,
          status: deal.status,
          lostReason: deal.lostReason,
          organizationId: org.id,
          pipelineId: newPipeline.id,
          stageId: newStageId,
          contactId: deal.contactId,
          userId: deal.userId,
        },
      })
      copied++
    }

    console.log(`  ✓ "${name}" criada — ${copied} deals copiados`)
  }

  console.log('\n✅ Concluído.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
