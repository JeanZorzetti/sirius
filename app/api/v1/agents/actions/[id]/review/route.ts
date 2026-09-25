import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { uuidSchema } from '@/lib/api-validators'
import { revisarAcaoDeAgente } from '@/lib/agaas-aprovacao'
import logger from '@/lib/logger'

/**
 * PATCH /api/v1/agents/actions/[id]/review
 * Approve or reject a pending agent action (human-in-the-loop).
 * `reviewedBy` must be a user of the API key's organization; otherwise the review is recorded without a reviewer.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiMiddleware(request, async (req, context) => {
    const paramsData = await params
    try {
      const idValidation = uuidSchema.safeParse(paramsData.id)
      if (!idValidation.success) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid action ID format'
          }),
          { status: 400 }
        )
      }

      const { decision, reviewedBy } = await req.json()

      if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'decision is required and must be "APPROVED" or "REJECTED"'
          }),
          { status: 400 }
        )
      }

      const resultado = await revisarAcaoDeAgente({
        id: paramsData.id,
        organizationId: context.organizationId,
        decisao: decision,
        revisorId: typeof reviewedBy === 'string' ? reviewedBy : null,
      })

      if (!resultado.ok) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: resultado.status === 404 ? 'NOT_FOUND' : 'CONFLICT',
            message: resultado.erro
          }),
          { status: resultado.status }
        )
      }

      logger.info({ actionId: resultado.acao.id, decision, status: resultado.acao.status }, 'Agent action reviewed via API')

      return NextResponse.json(
        apiResponse(context.requestId, {
          ...resultado.acao,
          createdAt: resultado.acao.createdAt.toISOString(),
          reviewedAt: resultado.acao.reviewedAt?.toISOString() || null,
        })
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error reviewing agent action via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to review agent action'
        }),
        { status: 500 }
      )
    }
  })
}
