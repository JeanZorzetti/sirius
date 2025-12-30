import { PrismaClient } from "@prisma/client"
import { Metadata } from "next"
import { KanbanBoard } from "@/components/kanban-board"
import { CreateDealDialog } from "@/components/deals/create-deal-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { DollarSign } from "lucide-react"

const prisma = new PrismaClient()

export const metadata: Metadata = {
    title: "Pipelines - CRM",
}

// Force dynamic rendering so we always get fresh data
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const user = await prisma.user.findFirst({
        include: { organization: true }
    })

    if (!user || !user.organizationId) {
        return <div>Usuário não pertence a uma organização.</div>
    }

    const isMember = user.orgRole === 'MEMBER'

    const rawStages = await prisma.pipelineStage.findMany({
        where: {
            organizationId: user.organizationId
        },
        include: {
            deals: {
                where: {
                    organizationId: user.organizationId,
                    ...(isMember ? { userId: user.id } : {})
                },
                include: { contact: true }
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

    const stages = rawStages.map(stage => ({
        ...stage,
        createdAt: stage.createdAt.toISOString(),
        updatedAt: stage.updatedAt.toISOString(),
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
    const hasDeals = dealCount > 0
    const isPro = user.organization.plan === 'PRO'

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight">Pipeline</h2>
                    {isMember ? (
                        <span className="px-2 py-1 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400 border border-zinc-700">
                            👤 Meus Negócios
                        </span>
                    ) : (
                        <span className="px-2 py-1 rounded-full bg-indigo-500/10 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                            🏢 Visão Global
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <CreateDealDialog
                        stages={stages}
                        contacts={contacts}
                        dealCount={dealCount}
                        isPro={isPro}
                    />
                </div>
            </div>

            {hasDeals ? (
                <KanbanBoard stages={stages} contacts={contacts} />
            ) : (
                <EmptyState
                    icon={DollarSign}
                    title="Seu pipeline está vazio"
                    description="Crie seu primeiro negócio para começar a visualizar seu funil de vendas."
                    action={<CreateDealDialog
                        stages={stages}
                        contacts={contacts}
                        dealCount={dealCount}
                        isPro={isPro}
                    />}
                />
            )}
        </div>
    )
}
