import { Metadata } from "next"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { getSession } from "@/lib/auth"
import { getOrganizationPlanLimits } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
    title: "Pipelines - CRM",
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    try {
        const session = await getSession()

        if (!session || !session.user || !session.user.email) {
            return <div>Não autorizado. Faça login novamente.</div>
        }

        let user
        try {
            user = await prisma.user.findUnique({
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
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] Falha ao buscar usuário:", err.message)
            return <div>Erro ao buscar usuário: {err.message}</div>
        }

        if (!user || !user.organizationId) {
            return <div>Usuário não pertence a uma organização.</div>
        }

        const isMember = user.orgRole === 'MEMBER'
        const shouldShowOnboarding = !user.onboarding || user.onboarding.status === 'IN_PROGRESS'

        let rawPipelines
        try {
            rawPipelines = await prisma.pipeline.findMany({
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
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] Falha ao buscar pipelines:", err.message)
            return <div>Erro ao buscar pipelines: {err.message}</div>
        }

        let rawStages
        try {
            rawStages = await prisma.pipelineStage.findMany({
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
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] Falha ao buscar stages:", err.message)
            return <div>Erro ao buscar stages: {err.message}</div>
        }

        let rawContacts
        try {
            rawContacts = await prisma.contact.findMany({
                where: { organizationId: user.organizationId },
                orderBy: { name: 'asc' }
            })
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] Falha ao buscar contatos:", err.message)
            return <div>Erro ao buscar contatos: {err.message}</div>
        }

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

        let planLimits
        try {
            planLimits = await getOrganizationPlanLimits(user.organizationId)
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] Falha ao buscar limites:", err.message)
            planLimits = null
        }

        return (
            <OnboardingWrapper
                userId={user.id}
                userName={user.name || undefined}
                shouldShowOnboarding={shouldShowOnboarding}
            >
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                    </div>

                    <DashboardTabs
                        pipelines={pipelines}
                        stages={stages}
                        userId={user.id}
                        userName={user.name || ''}
                        organizationId={user.organizationId}
                    />
                </div>
            </OnboardingWrapper>
        )
    } catch (error: any) {
        console.error("[DASHBOARD_PAGE] Erro crítico:", error.message)
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar Dashboard</h1>
                <div className="bg-red-50 p-4 rounded text-red-800">
                    <p className="font-mono text-sm">{error.message}</p>
                </div>
            </div>
        )
    }
}
