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
        <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">CONTATOS</h2>
                    <p className="text-sm text-zinc-500">Gerencie sua base de clientes e leads.</p>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
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
                    <DataTable columns={columns} data={contacts} />
                </div>
            )}
        </div>
    )
}
