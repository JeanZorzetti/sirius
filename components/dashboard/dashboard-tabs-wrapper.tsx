import { DashboardTabs } from "./dashboard-tabs"
import { prisma } from "@/lib/prisma"

function normalize(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

interface DashboardTabsWrapperProps {
  userId: string
  userName: string
  organizationId: string
  vsearch?: string
  csearch?: string
}

export async function DashboardTabsWrapper({
  userId,
  userName,
  organizationId,
  vsearch,
  csearch,
}: DashboardTabsWrapperProps) {
  // Fetch tudo em queries planas para evitar INSUFFICIENT_PATH com include aninhado
  const [rawPipelines, rawStages, rawDeals, dealContacts, contacts] = await Promise.all([
    prisma.pipeline.findMany({
      where: { organizationId },
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
      where: { organizationId },
      include: { pipeline: true },
      orderBy: { order: "asc" },
    }),
    // Deals em query separada
    prisma.deal.findMany({
      where: {
        organizationId,
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
      },
      orderBy: { name: "asc" },
    }),
  ])

  // Montar lookup de contatos por id
  const contactById = new Map(dealContacts.map((c) => [c.id, c]))

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
    />
  )
}
