import { DashboardTabs } from "./dashboard-tabs"
import { prisma } from "@/lib/prisma"
import { carregarAcesso, escopoNegocio, escopoPipeline } from "@/lib/visibilidade"

function normalize(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

interface DashboardTabsWrapperProps {
  userId: string
  userName: string
  organizationId: string
  vsearch?: string
  csearch?: string
  buscas?: React.ReactNode
}

export async function DashboardTabsWrapper({
  userId,
  userName,
  organizationId,
  vsearch,
  csearch,
  buscas,
}: DashboardTabsWrapperProps) {
  // Who sees which pipelines comes from the one shared rule (lib/visibilidade)
  const [acesso, permissoes] = await Promise.all([
    carregarAcesso({ id: userId }),
    prisma.user.findUnique({ where: { id: userId }, select: { canViewDealClosings: true } }),
  ])
  if (!acesso || acesso.organizationId !== organizationId) throw new Error('Unauthorized')
  const canViewClosings = permissoes?.canViewDealClosings ?? true
  const negociosVisiveis = escopoNegocio(acesso)

  // Fetch tudo em queries planas para evitar INSUFFICIENT_PATH com include aninhado
  const [rawPipelines, rawStages, rawDeals, dealContacts, contacts, stageMoves, organization] = await Promise.all([
    prisma.pipeline.findMany({
      where: escopoPipeline(acesso),
      include: {
        _count: {
          select: {
            stages: true,
            deals: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    // Stages SEM deals — evita o include triplo que causa INSUFFICIENT_PATH
    prisma.pipelineStage.findMany({
      where: { organizationId, pipeline: escopoPipeline(acesso) },
      include: { pipeline: true },
      orderBy: { order: "asc" },
    }),
    // Deals em query separada
    prisma.deal.findMany({
      where: {
        ...negociosVisiveis,
        ...(vsearch ? { value: { equals: Number(vsearch) } as any } : {}),
      },
      select: {
        id: true,
        title: true,
        value: true,
        stageId: true,
        contactId: true,
        order: true,
        closeDate: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        userId: true,
        observations: true,
        status: true,
        lostReason: true,
        pipelineId: true,
        archived: true,
        archivedReason: true,
        archivedAt: true,
        wonAt: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
    // Contacts dos deals em query separada
    prisma.contact.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
      },
    }),
    // Contacts para CreateDealDialog
    prisma.contact.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        company: true,
      },
      orderBy: { name: "asc" },
    }),
    // When each deal entered its current stage (spec 009): the last STAGE_CHANGE, else its creation
    prisma.activity.groupBy({
      by: ["dealId"],
      where: { type: "STAGE_CHANGE", deal: negociosVisiveis },
      _max: { createdAt: true },
    }),
    prisma.organization.findUnique({ where: { id: organizationId }, select: { createdAt: true } }),
  ])

  // Montar lookup de contatos por id
  const contactById = new Map(dealContacts.map((c) => [c.id, c]))
  const lastMoveByDeal = new Map(stageMoves.map((m) => [m.dealId, m._max.createdAt]))
  // Signup seeds every new account with example deals in the same minute (lib/pipeline-defaults.ts)
  const seededUntil = organization ? organization.createdAt.getTime() + 5 * 60_000 : 0

  // Transform data to serializable format
  const pipelines = rawPipelines.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const csearchNorm = csearch ? normalize(csearch) : null

  // Join deals → contact em memória (evita include aninhado no Prisma)
  const dealsWithContact = rawDeals.map((deal) => ({
    ...deal,
    value: deal.value ? Number(deal.value) : null,
    closeDate: deal.closeDate ? deal.closeDate.toISOString() : null,
    dueDate: deal.dueDate ? deal.dueDate.toISOString() : null,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
    wonAt: deal.wonAt ? deal.wonAt.toISOString() : null,
    stageEnteredAt: (lastMoveByDeal.get(deal.id) ?? deal.createdAt).toISOString(),
    exemplo: deal.createdAt.getTime() <= seededUntil,
    contact: deal.contactId ? (contactById.get(deal.contactId) ?? null) : null,
  }))

  const stages = rawStages.map((stage) => ({
    ...stage,
    createdAt: stage.createdAt.toISOString(),
    updatedAt: stage.updatedAt.toISOString(),
    pipelineId: stage.pipelineId,
    deals: dealsWithContact
      .filter((deal) => {
        if (deal.stageId !== stage.id) return false
        if (!csearchNorm) return true
        const c = deal.contact
        if (!c) return false
        return (
          normalize(c.name ?? '').includes(csearchNorm) ||
          normalize(c.company ?? '').includes(csearchNorm) ||
          normalize(c.email ?? '').includes(csearchNorm)
        )
      }),
  }))

  return (
    <DashboardTabs
      pipelines={pipelines}
      stages={stages}
      contacts={contacts}
      userId={userId}
      userName={userName}
      organizationId={organizationId}
      canViewClosings={canViewClosings}
      buscas={buscas}
    />
  )
}
