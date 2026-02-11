import { DashboardTabs } from "./dashboard-tabs"
import { prisma } from "@/lib/prisma"

interface DashboardTabsWrapperProps {
  userId: string
  userName: string
  organizationId: string
  isMember: boolean
}

export async function DashboardTabsWrapper({
  userId,
  userName,
  organizationId,
  isMember,
}: DashboardTabsWrapperProps) {
  // Fetch pipelines
  const rawPipelines = await prisma.pipeline.findMany({
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
  })

  // Fetch stages with deals
  const rawStages = await prisma.pipelineStage.findMany({
    where: {
      organizationId,
    },
    include: {
      pipeline: true,
      deals: {
        where: {
          organizationId,
          ...(isMember ? { userId } : {}),
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
  })

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
      userId={userId}
      userName={userName}
      organizationId={organizationId}
    />
  )
}
