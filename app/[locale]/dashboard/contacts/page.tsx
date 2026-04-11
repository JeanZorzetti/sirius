import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { ContactsDataTableClient } from "@/components/contacts/contacts-data-table-client"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { ImportContactsDialog } from "@/components/contacts/import-contacts-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { ExportButtons } from "@/components/ui/export-buttons"
import { Users } from "lucide-react"
import { getSession } from "@/lib/auth"

export const metadata: Metadata = {
    title: "Contatos - CRM",
}

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
    // CRITICAL FIX: Get authenticated user from session
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        return <div>Não autorizado. Faça login novamente.</div>
    }

    // Optimized query: Only select organizationId since that's all we need
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            organizationId: true
        }
    })

    if (!user || !user.organizationId) {
        return <div>Usuário não pertence a uma organização.</div>
    }

    // Query all contacts for this organization (DataTable handles pagination on client)
    const contacts = await prisma.contact.findMany({
        where: { organizationId: user.organizationId },
        orderBy: {
            createdAt: 'desc',
        },
    })

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">CONTATOS</h2>
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
                    <ContactsDataTableClient data={contacts} />
                </div>
            )}
        </div>
    )
}
