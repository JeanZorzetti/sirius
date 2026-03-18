import { DashboardTabs } from "./dashboard-tabs"
import { prisma } from "@/lib/prisma"

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
  // Fetch pipelines and stages (original queries) + contacts for CreateDealDialog
  const [rawPipelines, rawStages, contacts] = await Promise.all([
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
    prisma.pipelineStage.findMany({
      where: {
        organizationId,
      },
      include: {
        pipeline: true,
        deals: {
          where: {
            organizationId,
            ...(vsearch ? { value: { equals: Number(vsearch) } as any } : {}),
            ...(csearch ? { contact: { name: { contains: csearch, mode: "insensitive" } } } : {}),
          },
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        },
      },
      orderBy: {
        order: "asc",
      },
    }),
    prisma.contact.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  // Transform data to serializable format
  const pipelines = rawPipelines.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  const stages = rawStages.map((stage) => ({
    ...stage,
    createdAt: stage.createdAt.toISOString(),
    updatedAt: stage.updatedAt.toISOString(),
    pipelineId: stage.pipelineId,
    deals: stage.deals.map((deal) => ({
      ...deal,
      value: deal.value ? Number(deal.value) : null,
      closeDate: deal.closeDate ? deal.closeDate.toISOString() : null,
      dueDate: deal.dueDate ? deal.dueDate.toISOString() : null,
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
    })),
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
