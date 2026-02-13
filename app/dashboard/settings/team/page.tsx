import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trash2 } from "lucide-react"
import { InviteDialog } from "./invite-dialog"
import { RemoveMemberButton, RevokeInviteButton } from "./team-actions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export const metadata = { title: "Equipe | Sirius CRM" }

export default async function TeamSettingsPage() {
    const session = await getSession()
    if (!session?.user?.email) return null

    // Get current user strict data
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: true }
    })

    if (!currentUser) return <div>Acesso negado</div>

    const isOwner = currentUser.orgRole === "OWNER"

    // Fetch Team Members
    const members = await prisma.user.findMany({
        where: { organizationId: currentUser.organizationId },
        orderBy: { createdAt: 'asc' }
    })

    // Fetch Pending Invites
    const invites = await prisma.invite.findMany({
        where: { organizationId: currentUser.organizationId },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">TIME</h2>
                    <p className="text-sm text-zinc-500">Gerencie quem tem acesso à sua organização.</p>
                </div>
                {isOwner && <InviteDialog />}
            </div>

            <div className="grid gap-6">
                {/* Active Members */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Membros Ativos</CardTitle>
                        <CardDescription>Usuários com acesso ao Sirius CRM.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Função</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id} className="border-zinc-100 dark:border-zinc-800">
                                        <TableCell className="font-medium text-zinc-900 dark:text-zinc-200">
                                            {member.name}
                                            {member.id === currentUser.id && <span className="ml-2 text-zinc-500 text-xs">(Você)</span>}
                                        </TableCell>
                                        <TableCell className="text-zinc-500">{member.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                member.orgRole === 'OWNER'
                                                    ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                                    : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                                            }>
                                                {member.orgRole}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isOwner && member.id !== currentUser.id && (
                                                <RemoveMemberButton userId={member.id} />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pending Invites */}
                {invites.length > 0 && (
                    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg">Convites Pendentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                        <TableHead>Email</TableHead>
                                        <TableHead>Enviado em</TableHead>
                                        <TableHead>Expira em</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invites.map((invite) => (
                                        <TableRow key={invite.id} className="border-zinc-100 dark:border-zinc-800">
                                            <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
                                                {invite.email}
                                            </TableCell>
                                            <TableCell className="text-zinc-500">
                                                {format(invite.createdAt, "dd MMM yyyy", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell className="text-zinc-500">
                                                {format(invite.expiresAt, "dd MMM yyyy", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isOwner && (
                                                    <RevokeInviteButton inviteId={invite.id} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
