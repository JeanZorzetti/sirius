/**
 * Spec 014: the one door for creating a deal and for changing its stage, pipeline or status. Every path (kanban,
 * edit dialog, won/lost buttons, pipeline switch, API v1, the AI agent) calls these, so history, status and
 * automations follow the same rule everywhere. Webhooks stay with the callers: the dashboard and API v1 publish
 * different payload shapes that integrations already read.
 *
 * Imports, examples and seeds write deals directly and never come here, so they never fire automations (FR-006).
 */

import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { executeDealAutomations } from '@/lib/automations/engine'
import { sendEmailAsync, sendDealStageChangedEmail } from '@/lib/email-automations'
import { sendDealWonNotification } from '@/lib/push-notifications'

export type TipoAutor = 'USER' | 'API' | 'IA' | 'AUTOMACAO'
export type Autor = { userId: string; tipo: TipoAutor }
type Status = 'ACTIVE' | 'WON' | 'LOST'
type TipoEtapa = 'OPEN' | 'WON' | 'LOST'

/**
 * Status after a move (FR-003): an explicit status wins; a WON/LOST stage sets it; leaving a WON/LOST stage for an
 * open one reopens the deal; otherwise it stays.
 */
export function statusDepoisDoMovimento(p: {
  atual: Status
  explicito?: Status
  etapaAnterior: TipoEtapa
  etapaNova: TipoEtapa
  mudouEtapa: boolean
}): Status {
  if (p.explicito) return p.explicito
  if (!p.mudouEtapa) return p.atual
  if (p.etapaNova === 'WON') return 'WON'
  if (p.etapaNova === 'LOST') return 'LOST'
  if (p.etapaAnterior !== 'OPEN') return 'ACTIVE'
  return p.atual
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function contextoDaAutomacao(deal: {
  organizationId: string; value: unknown; stageId: string; pipelineId: string; title: string; userId: string
  contactId: string | null
}, extra: Record<string, unknown>) {
  return {
    organizationId: deal.organizationId,
    value: deal.value != null ? Number(deal.value) : 0,
    stageId: deal.stageId,
    pipelineId: deal.pipelineId,
    title: deal.title,
    userId: deal.userId,
    contactId: deal.contactId,
    ...extra,
  }
}

export type ResultadoMovimento =
  | { ok: true; mudou: boolean; status: Status; activityId: string | null; deAnterior: { stageId: string; stageName: string; pipelineId: string } }
  | { ok: false; erro: 'NAO_ENCONTRADO' | 'ETAPA_INVALIDA' }

/** FR-002: validates account, stage and pipeline; writes the move and its history in one transaction; then fires automations. */
export async function moverNegocio(p: {
  organizationId: string
  dealId: string
  paraEtapaId?: string
  /** Only for a pipeline switch; otherwise the stage must be in the deal's pipeline. */
  paraPipelineId?: string
  status?: Status
  motivoPerda?: string
  autor: Autor
}): Promise<ResultadoMovimento> {
  const deal = await prisma.deal.findFirst({
    where: { id: p.dealId, organizationId: p.organizationId },
    include: { stage: true, pipeline: true, user: { select: { id: true, name: true, email: true } } },
  })
  if (!deal) return { ok: false, erro: 'NAO_ENCONTRADO' }

  const pipelineId = p.paraPipelineId ?? deal.pipelineId
  let etapa = deal.stage
  if (p.paraEtapaId && p.paraEtapaId !== deal.stageId) {
    const nova = await prisma.pipelineStage.findFirst({
      where: { id: p.paraEtapaId, organizationId: p.organizationId, pipelineId },
    })
    if (!nova) return { ok: false, erro: 'ETAPA_INVALIDA' }
    etapa = nova
  } else if (p.paraPipelineId && p.paraPipelineId !== deal.pipelineId) {
    return { ok: false, erro: 'ETAPA_INVALIDA' }
  }

  const mudouEtapa = etapa.id !== deal.stageId
  const mudouPipeline = pipelineId !== deal.pipelineId
  const status = statusDepoisDoMovimento({
    atual: deal.status as Status,
    explicito: p.status,
    etapaAnterior: deal.stage.type as TipoEtapa,
    etapaNova: etapa.type as TipoEtapa,
    mudouEtapa,
  })
  const mudouStatus = status !== deal.status
  const deAnterior = { stageId: deal.stageId, stageName: deal.stage.name, pipelineId: deal.pipelineId }
  if (!mudouEtapa && !mudouStatus) return { ok: true, mudou: false, status, activityId: null, deAnterior }

  const novoPipeline = mudouPipeline
    ? await prisma.pipeline.findFirst({ where: { id: pipelineId, organizationId: p.organizationId }, select: { name: true } })
    : null
  const descricao = mudouPipeline
    ? `Moveu de "${deal.pipeline.name} - ${deal.stage.name}" para "${novoPipeline?.name ?? ''} - ${etapa.name}"`
    : mudouEtapa
      ? `Moveu de "${deal.stage.name}" para "${etapa.name}"`
      : status === 'WON' ? 'Marcou como ganho' : status === 'LOST' ? `Marcou como perdido${p.motivoPerda ? `: ${p.motivoPerda}` : ''}` : 'Reabriu o negócio'

  const [, activity] = await prisma.$transaction([
    // isolamento: deal loaded with organizationId above; stage and pipeline checked inside the same organization
    prisma.deal.update({
      where: { id: deal.id },
      data: {
        stageId: etapa.id,
        pipelineId,
        status,
        ...(mudouStatus && status === 'WON' ? { wonAt: new Date() } : {}),
        ...(mudouStatus && status === 'ACTIVE' ? { wonAt: null, lostReason: null } : {}),
        ...(status === 'LOST' && p.motivoPerda ? { lostReason: p.motivoPerda } : {}),
      },
    }),
    prisma.activity.create({
      data: {
        type: mudouPipeline ? 'PIPELINE_CHANGE' : mudouEtapa ? 'STAGE_CHANGE' : 'STATUS_CHANGE',
        description: descricao,
        dealId: deal.id,
        userId: p.autor.userId,
        fromStageId: deal.stageId,
        toStageId: etapa.id,
        actorType: p.autor.tipo,
      },
    }),
  ])

  const ctx = contextoDaAutomacao({ ...deal, stageId: etapa.id, pipelineId }, {
    activityId: activity.id,
    fromStageId: deal.stageId,
    actorType: p.autor.tipo,
  })
  // Fire-and-forget: a failing automation never undoes the move (engine never throws)
  if (mudouEtapa) void executeDealAutomations(deal.id, 'DEAL_MOVED', ctx)
  if (mudouStatus && status === 'WON') {
    void executeDealAutomations(deal.id, 'DEAL_WON', ctx)
    sendDealWonNotification(p.organizationId, deal.title, deal.value != null ? Number(deal.value) : undefined).catch(() => {})
  }
  if (mudouStatus && status === 'LOST') void executeDealAutomations(deal.id, 'DEAL_LOST', ctx)

  // FR-007: the owner hears about a move only when someone else made it
  if (mudouEtapa && deal.user.id !== p.autor.userId && deal.user.name) {
    sendEmailAsync(sendDealStageChangedEmail({
      to: deal.user.email,
      assigneeName: deal.user.name,
      dealTitle: deal.title,
      dealValue: Number(deal.value || 0),
      oldStage: mudouPipeline ? `${deal.pipeline.name} - ${deal.stage.name}` : deal.stage.name,
      newStage: mudouPipeline ? `${novoPipeline?.name ?? ''} - ${etapa.name}` : etapa.name,
      dealUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deal=${deal.id}`,
      organizationId: p.organizationId,
      userId: deal.user.id,
    }))
  }

  logger.info({ dealId: deal.id, mudouEtapa, mudouPipeline, status, autor: p.autor.tipo }, '[PIPELINE] Deal moved')
  return { ok: true, mudou: true, status, activityId: activity.id, deAnterior }
}

/** FR-001: history + DEAL_CREATED for a deal just created by a person, the API or the AI (never by an import). */
export async function aoCriarNegocio(p: {
  deal: {
    id: string; organizationId: string; title: string; value: unknown; stageId: string; pipelineId: string
    userId: string; contactId: string | null
  }
  nomeDaEtapa: string
  autor: Autor
}) {
  const valor = p.deal.value != null ? Number(p.deal.value) : null
  // isolamento: the deal was just created inside p.deal.organizationId by the caller
  const activity = await prisma.activity.create({
    data: {
      type: 'CREATE',
      description: `Criou o negócio em "${p.nomeDaEtapa}"${valor ? ` com valor ${brl(valor)}` : ''}`,
      dealId: p.deal.id,
      userId: p.autor.userId,
      toStageId: p.deal.stageId,
      actorType: p.autor.tipo,
    },
  })
  void executeDealAutomations(p.deal.id, 'DEAL_CREATED', contextoDaAutomacao(p.deal, {
    activityId: activity.id,
    actorType: p.autor.tipo,
  }))
  return activity.id
}
