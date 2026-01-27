import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, withProPlan } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { validateRequest, createPipelineSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'

/**
 * GET /api/v1/pipelines
 * List all pipelines for the authenticated organization
 */
export async function GET(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      const pipelines = await prisma.pipeline.findMany({
        where: {
          organizationId: context.organizationId
        },
        include: {
          stages: {
            select: {
              id: true,
              name: true,
              order: true
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { deals: true }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'asc' }
        ]
      })

      // Format response
      const formattedPipelines = pipelines.map(pipeline => ({
        id: pipeline.id,
        name: pipeline.name,
        isDefault: pipeline.isDefault,
        stages: pipeline.stages,
        dealsCount: pipeline._count.deals,
        createdAt: pipeline.createdAt.toISOString(),
        updatedAt: pipeline.updatedAt.toISOString()
      }))

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        count: pipelines.length
      }, 'Pipelines listed via API')

      return NextResponse.json(
        apiResponse(context.requestId, formattedPipelines)
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error listing pipelines via API')

      return NextResponse.json(
        apiResponse(
          context.requestId,
          undefined,
          {
            code: 'INTERNAL_ERROR',
            message: 'Failed to list pipelines'
          }
        ),
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/v1/pipelines
 * Create a new pipeline with stages (PRO only)
 */
export async function POST(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    // Check PRO plan
    return withProPlan(req, context, async (req, ctx) => {
      try {
        // Validate request body
        const validation = await validateRequest(req, createPipelineSchema)

        if (!validation.success) {
          return NextResponse.json(
            apiResponse(
              ctx.requestId,
              undefined,
              {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: validation.errors
              }
            ),
            { status: 400 }
          )
        }

        const data = validation.data

        // Check if pipeline name already exists
        const existing = await prisma.pipeline.findFirst({
          where: {
            organizationId: ctx.organizationId,
            name: data.name
          }
        })

        if (existing) {
          return NextResponse.json(
            apiResponse(
              ctx.requestId,
              undefined,
              {
                code: 'CONFLICT',
                message: 'A pipeline with this name already exists in your organization'
              }
            ),
            { status: 409 }
          )
        }

        // If isDefault is true, unset other default pipelines
        if (data.isDefault) {
          await prisma.pipeline.updateMany({
            where: {
              organizationId: ctx.organizationId,
              isDefault: true
            },
            data: {
              isDefault: false
            }
          })
        }

        // Create pipeline with stages in a transaction
        const pipeline = await prisma.$transaction(async (tx) => {
          // Create pipeline
          const newPipeline = await tx.pipeline.create({
            data: {
              name: data.name,
              isDefault: data.isDefault || false,
              organizationId: ctx.organizationId
            }
          })

          // Create stages
          const stagesData = data.stages.map(stage => ({
            name: stage.name,
            order: stage.order,
            pipelineId: newPipeline.id,
            organizationId: ctx.organizationId
          }))

          await tx.pipelineStage.createMany({
            data: stagesData
          })

          // Return pipeline with stages
          return await tx.pipeline.findUnique({
            where: { id: newPipeline.id },
            include: {
              stages: {
                select: {
                  id: true,
                  name: true,
                  order: true
                },
                orderBy: { order: 'asc' }
              }
            }
          })
        })

        if (!pipeline) {
          throw new Error('Failed to create pipeline')
        }

        // Format response
        const formattedPipeline = {
          id: pipeline.id,
          name: pipeline.name,
          isDefault: pipeline.isDefault,
          stages: pipeline.stages,
          createdAt: pipeline.createdAt.toISOString(),
          updatedAt: pipeline.updatedAt.toISOString()
        }

        logger.info({
          requestId: ctx.requestId,
          organizationId: ctx.organizationId,
          pipelineId: pipeline.id,
          stagesCount: pipeline.stages.length
        }, 'Pipeline created via API')

        return NextResponse.json(
          apiResponse(ctx.requestId, formattedPipeline),
          { status: 201 }
        )
      } catch (error) {
        logger.error({
          requestId: context.requestId,
          organizationId: context.organizationId,
          error
        }, 'Error creating pipeline via API')

        return NextResponse.json(
          apiResponse(
            context.requestId,
            undefined,
            {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create pipeline'
            }
          ),
          { status: 500 }
        )
      }
    })
  })
}
