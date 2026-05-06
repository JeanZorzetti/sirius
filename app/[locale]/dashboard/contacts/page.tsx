import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ContactsDataTableClient } from "@/components/contacts/contacts-data-table-client"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { ImportContactsDialog } from "@/components/contacts/import-contacts-dialog"
import { ContactsPageClient } from "@/components/contacts/contacts-page-client"
import { EmptyState } from "@/components/ui/empty-state"
import { ExportButtons } from "@/components/ui/export-buttons"
import { Users } from "lucide-react"
import { getSession } from "@/lib/auth"

export const metadata: Metadata = {
    title: "Contatos - CRM",
}

export const dynamic = 'force-dynamic'

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

    const orgId = user.organizationId

    // Queries planas para evitar INSUFFICIENT_PATH
    const [contacts, activeDeals, stages, orgUsers] = await Promise.all([
        prisma.contact.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
        }),
        // Um deal ativo por contato (mais recente, não arquivado)
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

    // Monta lookup: contactId → primeiro deal ativo
    const dealByContact = new Map<string, typeof activeDeals[0]>()
    for (const deal of activeDeals) {
        if (deal.contactId && !dealByContact.has(deal.contactId)) {
            dealByContact.set(deal.contactId, deal)
        }
    }

    const stageById = new Map(stages.map(s => [s.id, s.name]))
    const userById = new Map(orgUsers.map(u => [u.id, u.name ?? '']))

    // Enriquece cada contato com stage e assignee do deal ativo
    const enrichedContacts = contacts.map(c => {
        const deal = dealByContact.get(c.id)
        return {
            ...c,
            activeStageName: deal ? (stageById.get(deal.stageId) ?? null) : null,
            assigneeName: deal
                ? (userById.get(deal.userId) ?? null)
                : null,
        }
    })

    return (
        <div className="flex-1 space-y-4">
            <ContactsPageClient contactCount={contacts.length} />

            <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Contatos</h2>
                    <p className="text-sm text-zinc-500">Gerencie sua base de clientes e leads.</p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {contacts.length > 0 && <ExportButtons resourceType="contacts" />}
                    <ImportContactsDialog />
                    <CreateContactDialog />
                </div>
            </div>

            {contacts.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Nenhum contato encontrado"
                    description="Comece adicionando clientes, leads ou parceiros para organizar seu relacionamento."
                    action={<CreateContactDialog />}
                />
            ) : (
                <div className="h-full flex-1 flex-col space-y-8 flex">
                    <ContactsDataTableClient data={enrichedContacts} />
                </div>
            )}
        </div>
    )
}
