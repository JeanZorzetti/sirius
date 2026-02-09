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
import { Building2, Users, BarChart3 } from "lucide-react"

export const dynamic = "force-dynamic"

// Plan badge colors
const PLAN_STYLES: Record<string, string> = {
    FREE: "border-slate-600 text-slate-400 bg-slate-600/10",
    STARTER: "border-blue-500 text-blue-400 bg-blue-500/10",
    PRO: "border-purple-500 text-purple-400 bg-purple-500/10",
    BUSINESS: "border-amber-500 text-amber-400 bg-amber-500/10",
}

const PLAN_LABELS: Record<string, string> = {
    FREE: "Grátis",
    STARTER: "Starter",
    PRO: "Pro",
    BUSINESS: "Business",
}

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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-red-500" />
                        Gerenciar Organizações
                    </h2>
                    <p className="text-zinc-500 mt-1">
                        Gerencie planos, assinaturas e configurações de todas as empresas cadastradas.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-600" />
                        <span>Free: {organizations.filter(o => o.tier === 'FREE').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Starter: {organizations.filter(o => o.tier === 'STARTER').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span>Pro: {organizations.filter(o => o.tier === 'PRO').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span>Business: {organizations.filter(o => o.tier === 'BUSINESS').length}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-950">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400">Empresa</TableHead>
                            <TableHead className="text-zinc-400">Slug</TableHead>
                            <TableHead className="text-zinc-400">Plano</TableHead>
                            <TableHead className="text-zinc-400">
                                <Users className="inline w-4 h-4 mr-1" />
                                Usuários
                            </TableHead>
                            <TableHead className="text-zinc-400">
                                <BarChart3 className="inline w-4 h-4 mr-1" />
                                Deals
                            </TableHead>
                            <TableHead className="text-zinc-400">Criada em</TableHead>
                            <TableHead className="text-zinc-400 text-right">Ações</TableHead>
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
                                    <Badge 
                                        variant="outline" 
                                        className={PLAN_STYLES[org.tier] || PLAN_STYLES.FREE}
                                    >
                                        {PLAN_LABELS[org.tier] || org.tier}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-400">{org._count.users}</TableCell>
                                <TableCell className="text-zinc-400">{org._count.deals}</TableCell>
                                <TableCell className="text-zinc-500">
                                    {format(org.createdAt, "dd MMM yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <OrgActions 
                                        orgId={org.id} 
                                        currentTier={org.tier} 
                                        orgName={org.name}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                {organizations.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma organização encontrada</p>
                    </div>
                )}
            </div>
        </div>
    )
}
