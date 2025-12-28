import { Metadata } from "next"
import { PrismaClient } from "@prisma/client"
import { DataTable } from "@/components/contacts/data-table"
import { columns } from "@/components/contacts/columns"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Users } from "lucide-react"

const prisma = new PrismaClient()

export const metadata: Metadata = {
    title: "Contatos - CRM",
}

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
    const user = await prisma.user.findFirst({
        include: { organization: true }
    })

    if (!user || !user.organizationId) {
        return <div>Usuário não pertence a uma organização.</div>
    }

    const contacts = await prisma.contact.findMany({
        where: { organizationId: user.organizationId },
        orderBy: {
            createdAt: 'desc',
        },
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Contatos</h2>
                <div className="flex items-center space-x-2">
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
                <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
                    <DataTable columns={columns} data={contacts} />
                </div>
            )}
        </div>
    )
}
