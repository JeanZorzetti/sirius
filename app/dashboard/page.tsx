import { PrismaClient } from "@prisma/client"
import { Metadata } from "next"
import { DashboardWithPipelineSelector } from "@/components/dashboard-with-pipeline-selector"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { getSession } from "@/lib/auth"

const prisma = new PrismaClient()

export const metadata: Metadata = {
    title: "Pipelines - CRM",
}

// Force dynamic rendering so we always get fresh data
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    // CRITICAL FIX: Get authenticated user from session
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        return <div>Não autorizado. Faça login novamente.</div>
    }

    // Optimized query: Only select necessary user fields to reduce payload
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            name: true,
            organizationId: true,
            orgRole: true,
            organization: {
                select: {
                    plan: true
                }
            },
            onboarding: {
                select: {
                    status: true
                }
            }
        }
    })

    if (!user || !user.organizationId) {
        return <div>Usuário não pertence a uma organização.</div>
    }

    const isMember = user.orgRole === 'MEMBER'

    // Check if user should see onboarding (new user or not completed)
    const shouldShowOnboarding = !user.onboarding || user.onboarding.status === 'IN_PROGRESS'

    // Fetch all pipelines for the selector
    const rawPipelines = await prisma.pipeline.findMany({
        where: { organizationId: user.organizationId },
        include: {
            _count: {
                select: {
                    stages: true,
                    deals: true
                }
            }
        },
        orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
        ]
    })

    // Optimized query: Use select on contact to only fetch required fields
    const rawStages = await prisma.pipelineStage.findMany({
        where: {
            organizationId: user.organizationId
        },
        include: {
            pipeline: true,
            deals: {
                where: {
                    organizationId: user.organizationId,
                    ...(isMember ? { userId: user.id } : {})
                },
                include: {
                    contact: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                },
                orderBy: [
                    { order: 'asc' },
                    { createdAt: 'desc' }
                ]
            },
        },
        orderBy: {
            order: 'asc',
        },
    })

    const rawContacts = await prisma.contact.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { name: 'asc' }
    })

    const contacts = rawContacts.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
    }))

    const pipelines = rawPipelines.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
    }))

    const stages = rawStages.map(stage => ({
        ...stage,
        createdAt: stage.createdAt.toISOString(),
        updatedAt: stage.updatedAt.toISOString(),
        pipelineId: stage.pipelineId,
        deals: stage.deals.map(deal => ({
            ...deal,
            value: deal.value ? Number(deal.value) : null,
            closeDate: deal.closeDate ? deal.closeDate.toISOString() : null,
            dueDate: deal.dueDate ? deal.dueDate.toISOString() : null,
            createdAt: deal.createdAt.toISOString(),
            updatedAt: deal.updatedAt.toISOString(),
        }))
    }))

    const dealCount = stages.flatMap(stage => stage.deals).length
    const isPro = user.organization.plan === 'PRO'

    return (
        <OnboardingWrapper
            userId={user.id}
            userName={user.name || undefined}
            shouldShowOnboarding={shouldShowOnboarding}
        >
            <DashboardWithPipelineSelector
                pipelines={pipelines}
                allStages={stages}
                contacts={contacts}
                dealCount={dealCount}
                isPro={isPro}
                isMember={isMember}
            />
        </OnboardingWrapper>
    )
}
