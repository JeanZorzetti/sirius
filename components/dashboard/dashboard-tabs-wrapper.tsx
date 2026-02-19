import { DashboardTabs } from "./dashboard-tabs"
import { prisma } from "@/lib/prisma"
import { getOrganizationPlanLimits } from "@/lib/plan-limits"

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
  // Fetch pipelines, contacts, and plan limits in parallel
  const [rawPipelines, rawStages, contacts, planLimits, org] = await Promise.all([
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
    getOrganizationPlanLimits(organizationId),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true },
    }),
  ])

  const isPro = org?.plan === "PRO"

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

  // Count total deals across all stages
  const dealCount = stages.reduce((acc, stage) => acc + stage.deals.length, 0)

  return (
    <DashboardTabs
      pipelines={pipelines}
      stages={stages}
      contacts={contacts}
      dealCount={dealCount}
      isPro={isPro}
      isMember={isMember}
      planLimits={planLimits}
      userId={userId}
      userName={userName}
      organizationId={organizationId}
    />
  )
}
