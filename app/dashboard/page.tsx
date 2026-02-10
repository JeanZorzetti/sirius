import { PrismaClient } from "@prisma/client"
import { Metadata } from "next"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { getSession } from "@/lib/auth"
import { getOrganizationPlanLimits } from "@/lib/plan-limits"

const prisma = new PrismaClient()

export const metadata: Metadata = {
    title: "Pipelines - CRM",
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    console.log("[DASHBOARD_PAGE] [1] Iniciando renderização...")
    
    try {
        // CRITICAL FIX: Get authenticated user from session
        console.log("[DASHBOARD_PAGE] [2] Buscando sessão...")
        const session = await getSession()
        console.log(`[DASHBOARD_PAGE] [3] Sessão: ${session?.user?.email || 'null'}`)
        
        if (!session || !session.user || !session.user.email) {
            console.log("[DASHBOARD_PAGE] [ERRO] Usuário não autenticado")
            return <div>Não autorizado. Faça login novamente.</div>
        }

        // Optimized query: Only select necessary user fields to reduce payload
        console.log("[DASHBOARD_PAGE] [4] Buscando usuário no banco...")
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
            console.log(`[DASHBOARD_PAGE] [5] Usuário encontrado: ${user?.id}, org: ${user?.organizationId}`)
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] [ERRO] Falha ao buscar usuário:", err.message)
            return <div>Erro ao buscar usuário: {err.message}</div>
        }

        if (!user || !user.organizationId) {
            console.log("[DASHBOARD_PAGE] [ERRO] Usuário sem organização")
            return <div>Usuário não pertence a uma organização.</div>
        }

        const isMember = user.orgRole === 'MEMBER'
        console.log(`[DASHBOARD_PAGE] [6] isMember: ${isMember}`)

        const shouldShowOnboarding = !user.onboarding || user.onboarding.status === 'IN_PROGRESS'
        console.log(`[DASHBOARD_PAGE] [7] shouldShowOnboarding: ${shouldShowOnboarding}`)

        // Fetch all pipelines for the selector
        console.log("[DASHBOARD_PAGE] [8] Buscando pipelines...")
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
            console.log(`[DASHBOARD_PAGE] [9] Pipelines encontrados: ${rawPipelines.length}`)
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] [ERRO] Falha ao buscar pipelines:", err.message)
            return <div>Erro ao buscar pipelines: {err.message}</div>
        }

        // Optimized query: Use select on contact to only fetch required fields
        console.log("[DASHBOARD_PAGE] [10] Buscando stages...")
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
            console.log(`[DASHBOARD_PAGE] [11] Stages encontrados: ${rawStages.length}`)
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] [ERRO] Falha ao buscar stages:", err.message)
            return <div>Erro ao buscar stages: {err.message}</div>
        }

        console.log("[DASHBOARD_PAGE] [12] Buscando contatos...")
        let rawContacts
        try {
            rawContacts = await prisma.contact.findMany({
                where: { organizationId: user.organizationId },
                orderBy: { name: 'asc' }
            })
            console.log(`[DASHBOARD_PAGE] [13] Contatos encontrados: ${rawContacts.length}`)
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] [ERRO] Falha ao buscar contatos:", err.message)
            return <div>Erro ao buscar contatos: {err.message}</div>
        }

        console.log("[DASHBOARD_PAGE] [14] Convertendo dados...")
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
        console.log(`[DASHBOARD_PAGE] [15] Total de deals: ${dealCount}`)

        console.log("[DASHBOARD_PAGE] [16] Buscando limites do plano...")
        let planLimits
        try {
            planLimits = await getOrganizationPlanLimits(user.organizationId)
            console.log(`[DASHBOARD_PAGE] [17] Limites obtidos: ${JSON.stringify(planLimits)}`)
        } catch (err: any) {
            console.error("[DASHBOARD_PAGE] [ERRO] Falha ao buscar limites:", err.message)
            // Continua mesmo sem limites
            planLimits = null
        }

        console.log("[DASHBOARD_PAGE] [18] Renderizando componentes...")
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
        console.error("[DASHBOARD_PAGE] [ERRO CRÍTICO]", error.message)
        console.error("[DASHBOARD_PAGE] [STACK]", error.stack)
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
