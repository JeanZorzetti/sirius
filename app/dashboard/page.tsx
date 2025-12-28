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

    const rawStages = await prisma.pipelineStage.findMany({
        where: {
            organizationId: user.organizationId
        },
        include: {
            deals: {
                where: { organizationId: user.organizationId },
                include: { contact: true }
            },
        },
        orderBy: {
            order: 'asc',
        },
    })

    const contacts = await prisma.contact.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { name: 'asc' }
    })

    const stages = rawStages.map(stage => ({
        ...stage,
        deals: stage.deals.map(deal => ({
            ...deal,
            value: deal.value ? Number(deal.value) : null
        }))
    }))

    const dealCount = stages.flatMap(stage => stage.deals).length
    const hasDeals = dealCount > 0
    const isPro = user.organization.plan === 'PRO'

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Pipeline</h2>
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
