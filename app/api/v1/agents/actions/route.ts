import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { getPaginationParams } from '@/lib/api-helpers'
import { checkAgaasQuota, incrementAgaasUsage } from '@/lib/agaas-quota'
import logger from '@/lib/logger'

/**
 * POST /api/v1/agents/actions
 * Register an agent action (audit log). Used by Sofia IA agents after each autonomous operation.
 */
export async function POST(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      const body = await req.json()
      const { agentName, actionType, entityType, entityId, reasoning, confidence, input, output, status } = body

      // Validate required fields
      if (!agentName || !actionType || !entityType || !entityId || !reasoning || confidence === undefined || !input) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'Required fields: agentName, actionType, entityType, entityId, reasoning, confidence, input'
          }),
          { status: 400 }
        )
      }

      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'confidence must be a number between 0 and 1'
          }),
          { status: 400 }
        )
      }

      // Check AgaaS quota before allowing the action
      const quota = await checkAgaasQuota(context.organizationId)
      if (!quota.allowed) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'QUOTA_EXCEEDED',
            message: quota.reason || 'AgaaS quota exceeded',
          }),
          { status: 429 }
        )
      }

      // Determine status based on confidence threshold
      const actionStatus = status || (confidence >= 0.7 ? 'SUCCESS' : 'NEEDS_APPROVAL')

      const action = await prisma.agentAction.create({
        data: {
          organizationId: context.organizationId,
          agentName,
          actionType,
          entityType,
          entityId,
          reasoning,
          confidence,
          input,
          output: output || null,
          status: actionStatus
        }
      })

      // Increment usage counter
      await incrementAgaasUsage(context.organizationId)

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        actionId: action.id,
        agentName,
        actionType,
        confidence,
        status: actionStatus
      }, 'Agent action logged via API')

      return NextResponse.json(
        apiResponse(context.requestId, {
          ...action,
          createdAt: action.createdAt.toISOString(),
          reviewedAt: action.reviewedAt?.toISOString() || null
        }),
        { status: 201 }
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error logging agent action via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to log agent action'
        }),
        { status: 500 }
      )
    }
  })
}

/**
 * GET /api/v1/agents/actions
 * List agent actions with filtering and pagination.
 * Used by the /IA feed interface and Sofia IA for context.
 *
 * Query params:
 * - status: filter by status (PENDING, NEEDS_APPROVAL, SUCCESS, FAILED)
 * - agentName: filter by agent name
 * - entityType: filter by entity type
 * - entityId: filter by entity ID
 * - page, limit: pagination
 */
export async function GET(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const { page, limit, offset } = getPaginationParams(req)

      const status = searchParams.get('status')
      const agentName = searchParams.get('agentName')
      const entityType = searchParams.get('entityType')
      const entityId = searchParams.get('entityId')

      const where: any = { organizationId: context.organizationId }
      if (status) where.status = status
      if (agentName) where.agentName = agentName
      if (entityType) where.entityType = entityType
      if (entityId) where.entityId = entityId

      const [actions, total] = await Promise.all([
        prisma.agentAction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.agentAction.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)
      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        total,
        filters: { status, agentName, entityType }
      }, 'Agent actions listed via API')

      return NextResponse.json({
        ...apiResponse(context.requestId, actions.map(a => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          reviewedAt: a.reviewedAt?.toISOString() || null
        }))),
        pagination
      })
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error listing agent actions via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list agent actions'
        }),
        { status: 500 }
      )
    }
  })
}
