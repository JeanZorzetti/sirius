import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, withProPlan } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { formatDecimal } from '@/lib/api-helpers'
import logger from '@/lib/logger'

/**
 * GET /api/v1/analytics/pro
 * Get advanced analytics for PRO organizations
 */
export async function GET(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    // Enforce PRO plan
    return withProPlan(req, context, async (req, ctx) => {
      try {
        const searchParams = req.nextUrl.searchParams
        const days = Math.min(365, Math.max(7, parseInt(searchParams.get('days') || '30', 10)))

        const now = new Date()
        const startDate = new Date(now)
        startDate.setDate(startDate.getDate() - days)

        // Get daily snapshots
        const snapshots = await prisma.dealSnapshot.findMany({
          where: {
            organizationId: ctx.organizationId,
            date: {
              gte: startDate
            }
          },
          orderBy: { date: 'asc' },
          select: {
            date: true,
            totalDeals: true,
            totalValue: true,
            dealsByStage: true
          }
        })

        // Get revenue snapshots
        const revenueSnapshots = await prisma.revenueSnapshot.findMany({
          where: {
            organizationId: ctx.organizationId
          },
          orderBy: [
            { year: 'desc' },
            { month: 'desc' }
          ],
          take: 12,
          select: {
            year: true,
            month: true,
            mrr: true,
            arr: true,
            totalOrganizations: true,
            freeOrganizations: true,
            proOrganizations: true
          }
        })

        // Get user activities summary
        const activities = await prisma.userActivity.groupBy({
          by: ['type'],
          where: {
            organizationId: ctx.organizationId,
            createdAt: {
              gte: startDate
            }
          },
          _count: {
            type: true
          }
        })

        // Get conversion metrics (deals by stage)
        const stageMetrics = await prisma.pipelineStage.findMany({
          where: { organizationId: ctx.organizationId },
          select: {
            id: true,
            name: true,
            order: true,
            _count: {
              select: { deals: true }
            },
            deals: {
              where: {
                value: { not: null }
              },
              select: { value: true }
            }
          },
          orderBy: { order: 'asc' }
        })

        const stageAnalytics = stageMetrics.map(stage => {
          const totalValue = stage.deals.reduce((sum, deal) => {
            return sum + (formatDecimal(deal.value) || 0)
          }, 0)

          return {
            stageId: stage.id,
            stageName: stage.name,
            order: stage.order,
            dealsCount: stage._count.deals,
            totalValue: Math.round(totalValue * 100) / 100,
            averageValue: stage._count.deals > 0
              ? Math.round((totalValue / stage._count.deals) * 100) / 100
              : 0
          }
        })

        // Format snapshots
        const formattedSnapshots = snapshots.map(snapshot => ({
          date: snapshot.date.toISOString().split('T')[0],
          totalDeals: snapshot.totalDeals,
          totalValue: formatDecimal(snapshot.totalValue) || 0,
          dealsByStage: snapshot.dealsByStage
        }))

        // Format revenue snapshots
        const formattedRevenue = revenueSnapshots.reverse().map(snapshot => ({
          period: `${snapshot.year}-${String(snapshot.month).padStart(2, '0')}`,
          mrr: formatDecimal(snapshot.mrr) || 0,
          arr: formatDecimal(snapshot.arr) || 0,
          totalOrganizations: snapshot.totalOrganizations,
          freeOrganizations: snapshot.freeOrganizations,
          proOrganizations: snapshot.proOrganizations
        }))

        // Format activities
        const activitySummary = activities.map(activity => ({
          type: activity.type,
          count: activity._count.type
        }))

        const proAnalytics = {
          timeRange: {
            start: startDate.toISOString(),
            end: now.toISOString(),
            days
          },
          snapshots: formattedSnapshots,
          revenue: formattedRevenue,
          stageAnalytics,
          activitySummary,
          trends: {
            dealsChange: formattedSnapshots.length >= 2
              ? formattedSnapshots[formattedSnapshots.length - 1].totalDeals -
                formattedSnapshots[0].totalDeals
              : 0,
            valueChange: formattedSnapshots.length >= 2
              ? Math.round(
                  (formattedSnapshots[formattedSnapshots.length - 1].totalValue -
                    formattedSnapshots[0].totalValue) *
                    100
                ) / 100
              : 0
          }
        }

        logger.info({
          requestId: ctx.requestId,
          organizationId: ctx.organizationId,
          days
        }, 'PRO analytics retrieved via API')

        return NextResponse.json(
          apiResponse(ctx.requestId, proAnalytics)
        )
      } catch (error) {
        logger.error({
          requestId: context.requestId,
          organizationId: context.organizationId,
          error
        }, 'Error retrieving PRO analytics via API')

        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'INTERNAL_ERROR',
              message: 'Failed to retrieve PRO analytics'
            }
          ),
          { status: 500 }
        )
      }
    })
  })
}
