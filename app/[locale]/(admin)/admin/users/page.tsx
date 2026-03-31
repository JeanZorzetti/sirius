import { prisma } from '@/lib/prisma'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UserActions } from './user-actions'
import { CreateUserModal } from './create-user-modal'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
    const users = await prisma.user.findMany({
        include: {
            organization: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                    <p className="text-zinc-500">List of all registered users across organizations.</p>
                </div>
                <CreateUserModal />
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-950">
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400">User</TableHead>
                            <TableHead className="text-zinc-400">Organization</TableHead>
                            <TableHead className="text-zinc-400">Role</TableHead>
                            <TableHead className="text-zinc-400">Plan</TableHead>
                            <TableHead className="text-zinc-400">Created At</TableHead>
                            <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableCell className="font-medium text-zinc-300">
                                    <div className="flex flex-col">
                                        <span>{user.name}</span>
                                        <span className="text-xs text-zinc-500">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-300">{user.organization?.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={user.role === 'ADMIN' ? 'border-red-500 text-red-500' : 'border-zinc-700 text-zinc-400'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                                        {user.organization?.tier}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-500">
                                    {format(user.createdAt, "dd MMM yyyy", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <UserActions userId={user.id} userName={user.name || 'User'} currentOrgId={user.organizationId} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
