import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { InviteDialog } from "./invite-dialog"
import { RemoveMemberButton, RevokeInviteButton, ResendInviteButton } from "./team-actions"
import { PipelineVisibilityDialog } from "./pipeline-visibility-dialog"
import { RoleSelect } from "./role-select"
import { RolePermissionsCard, type RoleTemplateRow } from "./role-permissions-card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    assignableRoles,
    getAllRolePermissions,
    ROLE_LABELS,
    CONFIGURABLE_ROLES,
    normalizeRole,
    canManageRole,
} from "@/lib/role-permissions"
import { OrgRole } from "@prisma/client"

export const metadata = { title: "Equipe | Sirius CRM" }

const ROLE_BADGE_STYLES: Record<OrgRole, string> = {
    OWNER: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    GERENTE: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    COORDENADOR: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    SUPERVISOR: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    VENDEDOR: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
    MEMBER: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
}

export default async function TeamSettingsPage() {
    const session = await getSession()
    if (!session?.user?.email) return null

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: true }
    })

    if (!currentUser) return <div>Acesso negado</div>

    const isOwner = normalizeRole(currentUser.orgRole) === "OWNER"
    const actorRole = currentUser.orgRole

    const [members, invites, pipelines, allRolePerms] = await Promise.all([
        prisma.user.findMany({
            where: { organizationId: currentUser.organizationId },
            orderBy: { createdAt: 'asc' }
        }),
        prisma.invite.findMany({
            where: { organizationId: currentUser.organizationId },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.pipeline.findMany({
            where: { organizationId: currentUser.organizationId },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
            select: { id: true, name: true, isDefault: true }
        }),
        getAllRolePermissions(currentUser.organizationId),
    ])

    const roleTemplate: RoleTemplateRow[] = CONFIGURABLE_ROLES.map((role) => ({
        role,
        label: ROLE_LABELS[role],
        canAccessAgenda: allRolePerms[role].canAccessAgenda,
        canAccessTasks: allRolePerms[role].canAccessTasks,
    }))

    const inviteAssignableRoles = assignableRoles(actorRole)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                </Link>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">TIME</h2>
                    <p className="text-sm text-zinc-500">Gerencie quem tem acesso à sua organização.</p>
                </div>
                {inviteAssignableRoles.length > 0 && (
                    <InviteDialog
                        assignableRoles={inviteAssignableRoles}
                        roleLabels={ROLE_LABELS}
                    />
                )}
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
                                    <TableHead>Pipelines</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => {
                                    const memberRole = member.orgRole as OrgRole
                                    const isSelf = member.id === currentUser.id
                                    const canManageThis = !isSelf && canManageRole(actorRole, memberRole)
                                    const canEditRole = canManageThis
                                    const canEditPipelines = canManageThis && normalizeRole(memberRole) !== 'OWNER'
                                    const memberAssignable = assignableRoles(actorRole)

                                    return (
                                        <TableRow key={member.id} className="border-zinc-100 dark:border-zinc-800">
                                            <TableCell className="font-medium text-zinc-900 dark:text-zinc-200">
                                                {member.name}
                                                {isSelf && <span className="ml-2 text-zinc-500 text-xs">(Você)</span>}
                                            </TableCell>
                                            <TableCell className="text-zinc-500">{member.email}</TableCell>
                                            <TableCell>
                                                {canEditRole ? (
                                                    <RoleSelect
                                                        userId={member.id}
                                                        currentRole={memberRole}
                                                        assignableRoles={memberAssignable}
                                                        roleLabels={ROLE_LABELS}
                                                    />
                                                ) : (
                                                    <Badge variant="outline" className={ROLE_BADGE_STYLES[memberRole] ?? ROLE_BADGE_STYLES.MEMBER}>
                                                        {ROLE_LABELS[memberRole] ?? memberRole}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {normalizeRole(memberRole) === 'OWNER' ? (
                                                    <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Todos</Badge>
                                                ) : canEditPipelines ? (
                                                    <PipelineVisibilityDialog
                                                        userId={member.id}
                                                        userName={member.name ?? member.email}
                                                        pipelines={pipelines}
                                                        currentRestricted={member.pipelineRestricted}
                                                        currentAllowedIds={member.allowedPipelineIds}
                                                    />
                                                ) : (
                                                    <Badge variant="outline" className="text-xs border-zinc-300/30 text-zinc-500">
                                                        {member.pipelineRestricted ? `${member.allowedPipelineIds.length} pipeline(s)` : 'Todos'}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canManageThis && (
                                                    <RemoveMemberButton userId={member.id} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Role permissions template — OWNER only */}
                {isOwner && (
                    <RolePermissionsCard initial={roleTemplate} />
                )}

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
                                        <TableHead>Função</TableHead>
                                        <TableHead>Enviado em</TableHead>
                                        <TableHead>Expira em</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invites.map((invite) => {
                                        const inviteRole = invite.role as OrgRole
                                        const canManage = canManageRole(actorRole, inviteRole)
                                        return (
                                            <TableRow key={invite.id} className="border-zinc-100 dark:border-zinc-800">
                                                <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
                                                    {invite.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={ROLE_BADGE_STYLES[inviteRole] ?? ROLE_BADGE_STYLES.MEMBER}>
                                                        {ROLE_LABELS[inviteRole] ?? inviteRole}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-zinc-500">
                                                    {format(invite.createdAt, "dd MMM yyyy", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell className="text-zinc-500">
                                                    {format(invite.expiresAt, "dd MMM yyyy", { locale: ptBR })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {canManage && (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <ResendInviteButton inviteId={invite.id} />
                                                            <RevokeInviteButton inviteId={invite.id} />
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
