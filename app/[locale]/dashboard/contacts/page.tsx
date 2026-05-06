import { Metadata } from "next"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { ContactsDataTableClient } from "@/components/contacts/contacts-data-table-client"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { ContactsActionsBar } from "@/components/contacts/contacts-actions-bar"
import { ContactsPageClient } from "@/components/contacts/contacts-page-client"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Users } from "lucide-react"
import { getSession } from "@/lib/auth"

export const metadata: Metadata = {
    title: "Contatos - CRM",
}

export const dynamic = 'force-dynamic'

function ContactsTableSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-full max-w-sm rounded-md" />
            </div>
            <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] overflow-hidden">
                <div className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] h-10" />
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border-b border-black/5 dark:border-white/5 px-6 py-3 flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 flex-1 max-w-xs" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        </div>
    )
}

async function ContactsData({ orgId }: { orgId: string }) {
    // Queries planas em paralelo
    const [contacts, activeDeals, stages, orgUsers] = await Promise.all([
        prisma.contact.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                city: true,
                state: true,
                zipCode: true,
                street: true,
                streetNumber: true,
                complement: true,
                createdAt: true,
                updatedAt: true,
                organizationId: true,
                assignedToId: true,
            },
        }),
        prisma.deal.findMany({
            where: {
                organizationId: orgId,
                archived: false,
                status: 'ACTIVE',
                contactId: { not: null },
            },
            select: {
                id: true,
                contactId: true,
                stageId: true,
                userId: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.pipelineStage.findMany({
            where: { organizationId: orgId },
            select: { id: true, name: true },
        }),
        prisma.user.findMany({
            where: { organizationId: orgId },
            select: { id: true, name: true },
        }),
    ])

    // Lookup: contactId → primeiro deal ativo
    const dealByContact = new Map<string, typeof activeDeals[0]>()
    for (const deal of activeDeals) {
        if (deal.contactId && !dealByContact.has(deal.contactId)) {
            dealByContact.set(deal.contactId, deal)
        }
    }

    const stageById = new Map(stages.map(s => [s.id, s.name]))
    const userById = new Map(orgUsers.map(u => [u.id, u.name ?? '']))

    const enrichedContacts = contacts.map(c => {
        const deal = dealByContact.get(c.id)
        return {
            ...c,
            activeStageName: deal ? (stageById.get(deal.stageId) ?? null) : null,
            assigneeName: deal ? (userById.get(deal.userId) ?? null) : null,
        }
    })

    if (enrichedContacts.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="Nenhum contato encontrado"
                description="Comece adicionando clientes, leads ou parceiros para organizar seu relacionamento."
                action={<CreateContactDialog />}
            />
        )
    }

    return (
        <>
            <ContactsPageClient contactCount={enrichedContacts.length} />
            <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Contatos</h2>
                    <p className="text-sm text-zinc-500">Gerencie sua base de clientes e leads.</p>
                </div>
                <ContactsActionsBar />
            </div>
            <div className="h-full flex-1 flex-col space-y-8 flex">
                <ContactsDataTableClient data={enrichedContacts} />
            </div>
        </>
    )
}

export default async function ContactsPage() {
    const session = await getSession()
    if (!session?.user?.email) {
        return <div>Não autorizado. Faça login novamente.</div>
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true }
    })

    if (!user?.organizationId) {
        return <div>Usuário não pertence a uma organização.</div>
    }

    return (
        <div className="flex-1 space-y-4">
            <Suspense fallback={
                <>
                    <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Contatos</h2>
                            <p className="text-sm text-zinc-500">Gerencie sua base de clientes e leads.</p>
                        </div>
                    </div>
                    <ContactsTableSkeleton />
                </>
            }>
                <ContactsData orgId={user.organizationId} />
            </Suspense>
        </div>
    )
}
