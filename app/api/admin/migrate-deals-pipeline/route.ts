import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/admin/migrate-deals-pipeline?token=sirius-migrate-2024
// Moves deals from Roilabs Lead+Prospecção into pipeline "antigo" / stage "clientes antigos"
const SOURCE_STAGE_IDS = [
  '76182ad6-cac2-4d0d-8a63-e06393df2155', // Lead
  'd03f77f1-5569-40ff-a943-325202f9fd54', // Prospecção
]
const TARGET_PIPELINE_ID = '1630c534-facb-4085-9d08-f12c8b86060c' // antigo
const TARGET_STAGE_ID    = '94b0d441-1da0-4062-ac65-7c4d7db00524' // clientes antigos

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token !== 'sirius-migrate-2024') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const dealsToMigrate = await prisma.deal.findMany({
      where: { stageId: { in: SOURCE_STAGE_IDS }, archived: false },
      select: { id: true, title: true, stageId: true },
    })

    if (dealsToMigrate.length === 0) {
      return NextResponse.json({ message: 'Nenhum deal encontrado nas etapas Lead/Prospecção' })
    }

    const maxOrderDeal = await prisma.deal.findFirst({
      where: { stageId: TARGET_STAGE_ID },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = (maxOrderDeal?.order ?? 0) + 1

    const updateResults = await prisma.$transaction(
      dealsToMigrate.map((deal, idx) =>
        prisma.deal.update({
          where: { id: deal.id },
          data: {
            pipelineId: TARGET_PIPELINE_ID,
            stageId: TARGET_STAGE_ID,
            order: nextOrder + idx,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      migrated: updateResults.length,
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
