import { prisma } from "@/lib/prisma"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { OrgActions } from "./org-actions"

export const dynamic = "force-dynamic"

export default async function AdminOrganizationsPage() {
    const organizations = await prisma.organization.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    deals: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Organization Management</h2>
                <p className="text-zinc-500">Manage all registered companies, plans, and subscriptions.</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-950">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400">Organization Name</TableHead>
                            <TableHead className="text-zinc-400">Slug</TableHead>
                            <TableHead className="text-zinc-400">Plan</TableHead>
                            <TableHead className="text-zinc-400">Users</TableHead>
                            <TableHead className="text-zinc-400">Deals</TableHead>
                            <TableHead className="text-zinc-400">Created At</TableHead>
                            <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizations.map((org) => (
                            <TableRow key={org.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableCell className="font-medium text-zinc-200">
                                    {org.name}
                                </TableCell>
                                <TableCell className="text-zinc-500 font-mono text-xs">
                                    {org.slug}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        org.plan === 'PRO'
                                            ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                                            : "border-zinc-700 text-zinc-400"
                                    }>
                                        {org.plan}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-400">{org._count.users}</TableCell>
                                <TableCell className="text-zinc-400">{org._count.deals}</TableCell>
                                <TableCell className="text-zinc-500">
                                    {format(org.createdAt, "dd MMM yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <OrgActions orgId={org.id} currentPlan={org.plan} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
