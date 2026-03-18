'use server'

import logger from '@/lib/logger'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  calculateOrganizationKPIs,
  calculateConversionRate,
  calculateWinRate,
  calculateAvgDealValue,
  calculateSalesCycleLength,
  calculatePipelineVelocity,
} from '@/lib/analytics/kpis'

/**
 * Verifica se o usuário tem plano PRO
 */
async function requireProPlan() {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  })

  if (!user || !user.organization) {
    throw new Error('User or organization not found')
  }

  if (!['PRO', 'BUSINESS'].includes(user.organization.tier)) {
    throw new Error('UPGRADE_REQUIRED')
  }

  return { user, organization: user.organization }
}

/**
 * Busca KPIs da organização para um período específico
 */
export async function getOrganizationKPIs(
  startDate: Date,
  endDate: Date,
  pipelineId?: string
) {
  try {
    const { organization } = await requireProPlan()

    const kpis = await calculateOrganizationKPIs(
      organization.id,
      startDate,
      endDate,
      pipelineId
    )

    return {
      success: true,
      data: kpis,
    }
  } catch (error: any) {
    if (error.message === 'UPGRADE_REQUIRED') {
      return {
        success: false,
        error: 'UPGRADE_REQUIRED',
        message: 'Analytics avançado é exclusivo para o plano PRO',
      }
    }

    logger.error({ err: error }, 'Error getting organization KPIs')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar KPIs',
    }
  }
}

/**
 * Busca snapshots diários para gráfico de tendência
 */
export async function getDealSnapshots(
  startDate: Date,
  endDate: Date,
  pipelineId?: string
) {
  try {
    const { organization } = await requireProPlan()

    const snapshots = await prisma.dealSnapshot.findMany({
      where: {
        organizationId: organization.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Filtrar por pipeline se necessário
    const filteredSnapshots = pipelineId
      ? snapshots.map((snapshot) => {
          const pipelineData = (snapshot.dealsByPipeline as any)[pipelineId]
          return {
            date: snapshot.date,
            totalDeals: pipelineData?.count || 0,
            totalValue: pipelineData?.value || 0,
            dealsCreated: snapshot.dealsCreated,
            dealsClosed: snapshot.dealsClosed,
          }
        })
      : snapshots.map((snapshot) => ({
          date: snapshot.date,
          totalDeals: snapshot.totalDeals,
          totalValue: parseFloat(snapshot.totalValue.toString()),
          dealsCreated: snapshot.dealsCreated,
          dealsClosed: snapshot.dealsClosed,
        }))

    return {
      success: true,
      data: filteredSnapshots,
    }
  } catch (error: any) {
    if (error.message === 'UPGRADE_REQUIRED') {
      return {
        success: false,
        error: 'UPGRADE_REQUIRED',
        message: 'Analytics avançado é exclusivo para o plano PRO',
      }
    }

    logger.error({ err: error }, 'Error getting deal snapshots')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar snapshots',
    }
  }
}

/**
 * Busca dados para o funil de conversão
 */
export async function getConversionFunnelData(
  startDate: Date,
  endDate: Date,
  pipelineId?: string
) {
  try {
    const { organization } = await requireProPlan()

    const where: any = {
      organizationId: organization.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (pipelineId) {
      where.pipelineId = pipelineId
    }

    // Buscar todas as stages do pipeline
    const stages = await prisma.pipelineStage.findMany({
      where: {
        organizationId: organization.id,
        ...(pipelineId ? { pipelineId } : {}),
      },
      orderBy: {
        order: 'asc',
      },
    })

    // Contar deals em cada stage
    const funnelData = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.deal.count({
          where: {
            ...where,
            stageId: stage.id,
          },
        })

        return {
          stageName: stage.name,
          stageOrder: stage.order,
          count,
        }
      })
    )

    return {
      success: true,
      data: funnelData,
    }
  } catch (error: any) {
    if (error.message === 'UPGRADE_REQUIRED') {
      return {
        success: false,
        error: 'UPGRADE_REQUIRED',
        message: 'Analytics avançado é exclusivo para o plano PRO',
      }
    }

    logger.error({ err: error }, 'Error getting conversion funnel data')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar dados do funil',
    }
  }
}

/**
 * Busca distribuição de deals won/lost
 */
export async function getWinLossData(
  startDate: Date,
  endDate: Date,
  pipelineId?: string
) {
  try {
    const { organization } = await requireProPlan()

    const where: any = {
      organizationId: organization.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (pipelineId) {
      where.pipelineId = pipelineId
    }

    const [wonDeals, lostDeals, inProgressDeals] = await Promise.all([
      prisma.deal.count({
        where: {
          ...where,
          stage: {
            isClosedWon: true,
          },
        },
      }),
      prisma.deal.count({
        where: {
          ...where,
          stage: {
            isClosedLost: true,
          },
        },
      }),
      prisma.deal.count({
        where: {
          ...where,
          stage: {
            isClosedWon: false,
            isClosedLost: false,
          },
        },
      }),
    ])

    return {
      success: true,
      data: [
        { name: 'Ganhos', value: wonDeals, color: '#22c55e' },
        { name: 'Perdidos', value: lostDeals, color: '#ef4444' },
        { name: 'Em Progresso', value: inProgressDeals, color: '#3b82f6' },
      ],
    }
  } catch (error: any) {
    if (error.message === 'UPGRADE_REQUIRED') {
      return {
        success: false,
        error: 'UPGRADE_REQUIRED',
        message: 'Analytics avançado é exclusivo para o plano PRO',
      }
    }

    logger.error({ err: error }, 'Error getting win/loss data')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar dados de win/loss',
    }
  }
}

/**
 * Busca lista de pipelines da organização
 */
export async function getOrganizationPipelines() {
  try {
    const { organization } = await requireProPlan()

    const pipelines = await prisma.pipeline.findMany({
      where: {
        organizationId: organization.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        name: true,
        isDefault: true,
      },
    })

    return {
      success: true,
      data: pipelines,
    }
  } catch (error: any) {
    if (error.message === 'UPGRADE_REQUIRED') {
      return {
        success: false,
        error: 'UPGRADE_REQUIRED',
        message: 'Analytics avançado é exclusivo para o plano PRO',
      }
    }

    logger.error({ err: error }, 'Error getting organization pipelines')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar pipelines',
    }
  }
}
