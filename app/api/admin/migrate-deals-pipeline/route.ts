import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/admin/migrate-deals-pipeline?token=sirius-migrate-2024
// Transfers deals from LEAD and PROSPECÇÃO stages of the default pipeline
// to the "escrito antigo" pipeline's "escrito clientes antigos" stage.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token !== 'sirius-migrate-2024') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Find default (main) pipeline
    const mainPipeline = await prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    })

    if (!mainPipeline) {
      return NextResponse.json({ error: 'Pipeline principal não encontrado' }, { status: 404 })
    }

    // Find LEAD and PROSPECÇÃO stages in main pipeline (case-insensitive)
    const sourceStages = mainPipeline.stages.filter(s =>
      ['lead', 'prospecção', 'prospeccao', 'prospecao'].includes(s.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
    )

    if (sourceStages.length === 0) {
      return NextResponse.json({
        error: 'Nenhuma etapa LEAD ou PROSPECÇÃO encontrada no pipeline principal',
        stagesFound: mainPipeline.stages.map(s => s.name),
      }, { status: 404 })
    }

    // Find secondary "escrito antigo" pipeline (case-insensitive)
    const allPipelines = await prisma.pipeline.findMany({
      where: { organizationId: mainPipeline.organizationId },
      include: { stages: true },
    })

    const targetPipeline = allPipelines.find(p =>
      p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes('escrito antigo')
    )

    if (!targetPipeline) {
      return NextResponse.json({
        error: 'Pipeline "escrito antigo" não encontrado',
        pipelinesFound: allPipelines.map(p => p.name),
      }, { status: 404 })
    }

    // Find "escrito clientes antigos" stage in target pipeline
    const targetStage = targetPipeline.stages.find(s =>
      s.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes('escrito clientes antigos')
    )

    if (!targetStage) {
      return NextResponse.json({
        error: 'Etapa "escrito clientes antigos" não encontrada no pipeline de destino',
        stagesFound: targetPipeline.stages.map(s => s.name),
      }, { status: 404 })
    }

    const sourceStageIds = sourceStages.map(s => s.id)

    // Count deals to migrate
    const dealsToMigrate = await prisma.deal.findMany({
      where: {
        stageId: { in: sourceStageIds },
        archived: false,
      },
      select: { id: true, title: true, stageId: true },
    })

    if (dealsToMigrate.length === 0) {
      return NextResponse.json({
        message: 'Nenhum deal encontrado nas etapas LEAD/PROSPECÇÃO',
        sourceStages: sourceStages.map(s => s.name),
      })
    }

    // Get current max order in target stage
    const maxOrderDeal = await prisma.deal.findFirst({
      where: { stageId: targetStage.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    let nextOrder = (maxOrderDeal?.order ?? 0) + 1

    // Transfer all deals to target pipeline + stage
    const updateResults = await prisma.$transaction(
      dealsToMigrate.map((deal, idx) =>
        prisma.deal.update({
          where: { id: deal.id },
          data: {
            pipelineId: targetPipeline.id,
            stageId: targetStage.id,
            order: nextOrder + idx,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      migrated: updateResults.length,
      from: {
        pipeline: mainPipeline.name,
        stages: sourceStages.map(s => s.name),
      },
      to: {
        pipeline: targetPipeline.name,
        stage: targetStage.name,
      },
      deals: dealsToMigrate.map(d => d.title),
    })
  } catch (error) {
    console.error('[migrate-deals-pipeline]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// GET for dry-run inspection
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token !== 'sirius-migrate-2024') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const pipelines = await prisma.pipeline.findMany({
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { deals: true } },
      },
      orderBy: { isDefault: 'desc' },
    })

    const result = await Promise.all(
      pipelines.map(async (p) => ({
        id: p.id,
        name: p.name,
        isDefault: p.isDefault,
        totalDeals: p._count.deals,
        stages: await Promise.all(
          p.stages.map(async (s) => {
            const count = await prisma.deal.count({ where: { stageId: s.id, archived: false } })
            return { id: s.id, name: s.name, order: s.order, activeDeals: count }
          })
        ),
      }))
    )

    return NextResponse.json({ pipelines: result })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
