import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'

/**
 * GET /api/v1/pipelines/[id]
 * Get a specific pipeline by ID with its stages and deals count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(request, async (req, context) => {
    const paramsData = await params
    try {
      // Validate ID format
      const idValidation = uuidSchema.safeParse(paramsData.id)
      if (!idValidation.success) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'VALIDATION_ERROR',
              message: 'Invalid pipeline ID format'
            }
          ),
          { status: 400 }
        )
      }

      const pipeline = await prisma.pipeline.findFirst({
        where: {
          id: paramsData.id,
          organizationId: context.organizationId
        },
        include: {
          stages: {
            select: {
              id: true,
              name: true,
              order: true,
              _count: {
                select: { deals: true }
              }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { deals: true }
          }
        }
      })

      if (!pipeline) {
        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'NOT_FOUND',
              message: 'Pipeline not found'
            }
          ),
          { status: 404 }
        )
      }

      // Format response
      const formattedPipeline = {
        id: pipeline.id,
        name: pipeline.name,
        isDefault: pipeline.isDefault,
        stages: pipeline.stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          order: stage.order,
          dealsCount: stage._count.deals
        })),
        dealsCount: pipeline._count.deals,
        createdAt: pipeline.createdAt.toISOString(),
        updatedAt: pipeline.updatedAt.toISOString()
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        pipelineId: pipeline.id
      }, 'Pipeline retrieved via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedPipeline)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error retrieving pipeline via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve pipeline'
          }
        ),
        { status: 500 }
      )
    }
  })
}
