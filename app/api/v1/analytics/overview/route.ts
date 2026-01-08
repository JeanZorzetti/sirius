import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { formatDecimal } from '@/lib/api-helpers'
import logger from '@/lib/logger'

/**
 * GET /api/v1/analytics/overview
 * Get basic KPIs for the authenticated organization
 */
export async function GET(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      // Get total counts
      const [
        totalDeals,
        totalContacts,
        totalUsers,
        dealsThisMonth,
        dealsLastMonth,
        contactsThisMonth
      ] = await Promise.all([
        // Total deals
        prisma.deal.count({
          where: { organizationId: context.organizationId }
        }),

        // Total contacts
        prisma.contact.count({
          where: { organizationId: context.organizationId }
        }),

        // Total users
        prisma.user.count({
          where: { organizationId: context.organizationId }
        }),

        // Deals this month
        prisma.deal.count({
          where: {
            organizationId: context.organizationId,
            createdAt: { gte: startOfMonth }
          }
        }),

        // Deals last month
        prisma.deal.count({
          where: {
            organizationId: context.organizationId,
            createdAt: {
              gte: startOfLastMonth,
              lte: endOfLastMonth
            }
          }
        }),

        // Contacts this month
        prisma.contact.count({
          where: {
            organizationId: context.organizationId,
            createdAt: { gte: startOfMonth }
          }
        })
      ])

      // Get total value of all deals
      const dealsWithValue = await prisma.deal.findMany({
        where: {
          organizationId: context.organizationId,
          value: { not: null }
        },
        select: { value: true }
      })

      const totalValue = dealsWithValue.reduce((sum, deal) => {
        return sum + (formatDecimal(deal.value) || 0)
      }, 0)

      // Get deals by stage
      const dealsByStage = await prisma.pipelineStage.findMany({
        where: { organizationId: context.organizationId },
        select: {
          id: true,
          name: true,
          _count: {
            select: { deals: true }
          }
        },
        orderBy: { order: 'asc' }
      })

      // Calculate growth
      const dealsGrowth = dealsLastMonth > 0
        ? ((dealsThisMonth - dealsLastMonth) / dealsLastMonth) * 100
        : 0

      const overview = {
        summary: {
          totalDeals,
          totalContacts,
          totalUsers,
          totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimals
          dealsThisMonth,
          contactsThisMonth,
          dealsGrowth: Math.round(dealsGrowth * 100) / 100
        },
        dealsByStage: dealsByStage.map(stage => ({
          stageId: stage.id,
          stageName: stage.name,
          count: stage._count.deals
        })),
        period: {
          currentMonth: {
            start: startOfMonth.toISOString(),
            end: now.toISOString()
          },
          lastMonth: {
            start: startOfLastMonth.toISOString(),
            end: endOfLastMonth.toISOString()
          }
        }
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId
      }, 'Analytics overview retrieved via API')

      return NextResponse.json(
        apiResponse(context.requestId, overview)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error retrieving analytics overview via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve analytics overview'
          }
        ),
        { status: 500 }
      )
    }
  })
}
