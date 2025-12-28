import { PrismaClient } from "@prisma/client"
import { Metadata } from "next"
import { KanbanBoard } from "@/components/kanban-board"
import { CreateDealDialog } from "@/components/deals/create-deal-dialog"

const prisma = new PrismaClient()

export const metadata: Metadata = {
    title: "Dashboard - CRM",
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
                where: { organizationId: user.organizationId } // redundant but safe
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

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <CreateDealDialog stages={stages} contacts={contacts} />
                </div>
            </div>
            <KanbanBoard stages={stages} contacts={contacts} />
        </div>
    )
}
