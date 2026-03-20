'use server'

import logger from '@/lib/logger'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculatePlatformKPIs } from '@/lib/analytics/kpis'

/**
 * Verifica se o usuário é ADMIN
 */
async function requireAdminRole() {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN')
  }

  return user
}

/**
 * Busca KPIs da plataforma para um mês específico
 */
export async function getPlatformKPIs(month: number, year: number) {
  try {
    await requireAdminRole()

    const kpis = await calculatePlatformKPIs(month, year)

    return {
      success: true,
      data: kpis,
    }
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acesso negado. Apenas administradores podem acessar esta página.',
      }
    }

    logger.error({ err: error }, 'Error getting platform KPIs')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar KPIs da plataforma',
    }
  }
}

/**
 * Busca snapshots de receita históricos (últimos N meses)
 */
export async function getRevenueSnapshots(months: number = 6) {
  try {
    await requireAdminRole()

    const snapshots = await prisma.revenueSnapshot.findMany({
      where: {
        organizationId: null, // Global snapshots
      },
      orderBy: {
        date: 'desc',
      },
      take: months,
    })

    // Inverter ordem para mostrar cronologicamente
    const sortedSnapshots = snapshots.reverse().map((snapshot) => ({
      date: snapshot.date,
      month: snapshot.month,
      year: snapshot.year,
      mrr: parseFloat(snapshot.mrr.toString()),
      arr: parseFloat(snapshot.arr.toString()),
      totalOrganizations: snapshot.totalOrganizations,
      proOrganizations: snapshot.proOrganizations,
      freeOrganizations: snapshot.freeOrganizations,
      newOrganizations: snapshot.newOrganizations,
      churnedOrganizations: snapshot.churnedOrganizations,
      avgLtv: snapshot.avgLtv ? parseFloat(snapshot.avgLtv.toString()) : null,
      avgCac: snapshot.avgCac ? parseFloat(snapshot.avgCac.toString()) : null,
      forecastNext30d: snapshot.forecastNext30d
        ? parseFloat(snapshot.forecastNext30d.toString())
        : null,
      forecastNext60d: snapshot.forecastNext60d
        ? parseFloat(snapshot.forecastNext60d.toString())
        : null,
      forecastNext90d: snapshot.forecastNext90d
        ? parseFloat(snapshot.forecastNext90d.toString())
        : null,
    }))

    return {
      success: true,
      data: sortedSnapshots,
    }
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acesso negado. Apenas administradores podem acessar esta página.',
      }
    }

    logger.error({ err: error }, 'Error getting revenue snapshots')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar snapshots de receita',
    }
  }
}

/**
 * Busca snapshot mais recente para exibir forecast
 */
export async function getLatestForecast() {
  try {
    await requireAdminRole()

    const latestSnapshot = await prisma.revenueSnapshot.findFirst({
      where: {
        organizationId: null, // Global snapshots
      },
      orderBy: {
        date: 'desc',
      },
    })

    if (!latestSnapshot) {
      return {
        success: true,
        data: null,
      }
    }

    return {
      success: true,
      data: {
        date: latestSnapshot.date,
        month: latestSnapshot.month,
        year: latestSnapshot.year,
        currentMrr: parseFloat(latestSnapshot.mrr.toString()),
        forecastNext30d: latestSnapshot.forecastNext30d
          ? parseFloat(latestSnapshot.forecastNext30d.toString())
          : null,
        forecastNext60d: latestSnapshot.forecastNext60d
          ? parseFloat(latestSnapshot.forecastNext60d.toString())
          : null,
        forecastNext90d: latestSnapshot.forecastNext90d
          ? parseFloat(latestSnapshot.forecastNext90d.toString())
          : null,
      },
    }
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acesso negado. Apenas administradores podem acessar esta página.',
      }
    }

    logger.error({ err: error }, 'Error getting latest forecast')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar previsão de receita',
    }
  }
}

/**
 * Busca estatísticas gerais da plataforma
 */
export async function getPlatformStats() {
  try {
    await requireAdminRole()

    const [totalOrgs, proOrgs, totalUsers, totalDeals] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { tier: { in: ['STARTER', 'PRO', 'BUSINESS'] } } }),
      prisma.user.count(),
      prisma.deal.count(),
    ])

    const freeOrgs = totalOrgs - proOrgs

    return {
      success: true,
      data: {
        totalOrganizations: totalOrgs,
        proOrganizations: proOrgs,
        freeOrganizations: freeOrgs,
        totalUsers,
        totalDeals,
        conversionRate:
          totalOrgs > 0 ? ((proOrgs / totalOrgs) * 100).toFixed(1) : '0.0',
      },
    }
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acesso negado. Apenas administradores podem acessar esta página.',
      }
    }

    logger.error({ err: error }, 'Error getting platform stats')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar estatísticas da plataforma',
    }
  }
}

/**
 * Busca todas as organizações pagas
 */
export async function getPaidOrganizations() {
  try {
    await requireAdminRole()

    const organizations = await prisma.organization.findMany({
      where: {
        tier: { in: ['STARTER', 'PRO', 'BUSINESS'] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        tier: true,
        isTestAccount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: organizations,
    }
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acesso negado.',
      }
    }
    logger.error({ err: error }, 'Error getting paid organizations')
    return {
      success: false,
      error: 'FETCH_ERROR',
      message: 'Erro ao buscar organizações pagas',
    }
  }
}

/**
 * Alterna a flag de conta teste (isTestAccount)
 */
export async function toggleTestAccount(organizationId: string, isTestAccount: boolean) {
  try {
    await requireAdminRole()

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: { isTestAccount },
    })

    return {
      success: true,
      data: organization,
    }
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Acesso negado.',
      }
    }
    logger.error({ err: error }, 'Error updating test account flag')
    return {
      success: false,
      error: 'UPDATE_ERROR',
      message: 'Erro ao atualizar flag de conta teste',
    }
  }
}
