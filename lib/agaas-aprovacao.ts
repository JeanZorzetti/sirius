import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { executeAgentAction } from '@/lib/agaas-executor'
import logger from '@/lib/logger'

export type DecisaoRevisao = 'APPROVED' | 'REJECTED'

type ResultadoRevisao =
  | { ok: true; acao: Prisma.AgentActionGetPayload<object> }
  | { ok: false; status: 404 | 409; erro: string }

/**
 * Human review of an agent action (spec 011): rejecting closes it; approving applies the stored draft.
 * The status change is conditional, so two clicks (or two tabs) approving at once run the action only once.
 * Used by the /IA feed (session) and by the public API.
 */
export async function revisarAcaoDeAgente(params: {
  id: string
  organizationId: string
  decisao: DecisaoRevisao
  revisorId: string | null
}): Promise<ResultadoRevisao> {
  const { id, organizationId, decisao } = params
  const action = await prisma.agentAction.findFirst({ where: { id, organizationId } })
  if (!action) return { ok: false, status: 404, erro: 'Agent action not found' }

  // The reviewer becomes the author in the deal history: it must be a user of this organization
  const revisor = params.revisorId
    ? await prisma.user.findFirst({ where: { id: params.revisorId, organizationId }, select: { id: true } })
    : null
  const agora = new Date()

  if (decisao === 'REJECTED') {
    const fechada = await prisma.agentAction.updateMany({
      where: { id, organizationId, status: 'NEEDS_APPROVAL' },
      data: { status: 'FAILED', reviewedBy: revisor?.id ?? null, reviewedAt: agora },
    })
    if (fechada.count === 0) return { ok: false, status: 409, erro: `Action is already ${action.status}` }
    return { ok: true, acao: (await prisma.agentAction.findFirst({ where: { id, organizationId } }))! }
  }

  const tomada = await prisma.agentAction.updateMany({
    where: { id, organizationId, status: 'NEEDS_APPROVAL' },
    data: { status: 'PENDING', reviewedBy: revisor?.id ?? null, reviewedAt: agora },
  })
  if (tomada.count === 0) return { ok: false, status: 409, erro: `Action is already ${action.status}` }

  const rascunho = (action.output as Record<string, any> | null)?.rascunho
  let status: 'SUCCESS' | 'FAILED'
  let output: Record<string, any>
  try {
    const resultado = await executeAgentAction(
      {
        id: action.id,
        organizationId: action.organizationId,
        agentName: action.agentName,
        actionType: action.actionType,
        entityType: action.entityType,
        entityId: action.entityId,
        reasoning: action.reasoning,
        confidence: action.confidence,
        input: action.input,
        userId: revisor?.id ?? '',
        output: action.output,
      },
      'aplicar',
    )
    status = resultado.success ? 'SUCCESS' : 'FAILED'
    output = { ...(rascunho ? { rascunho } : {}), ...resultado.output }
  } catch (erro: any) {
    status = 'FAILED'
    output = { ...(rascunho ? { rascunho } : {}), error: erro.message }
  }

  const acao = await prisma.agentAction.update({
    where: { id, organizationId },
    data: { status, output: output as Prisma.InputJsonValue },
  })
  logger.info({ actionId: id, agentName: action.agentName, status }, '[AgaaS] Reviewed action applied')
  return { ok: true, acao }
}
