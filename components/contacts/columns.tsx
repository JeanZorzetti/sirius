'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageCircle, Trash2, Loader2, Kanban, User } from "lucide-react"
import { deleteContact } from '@/app/[locale]/dashboard/contacts/actions'
import { EditContactDialog } from '@/components/contacts/edit-contact-dialog'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import type { EnrichedContact } from './contacts-data-table-client'

function DeleteContactButton({ contact }: { contact: EnrichedContact }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    async function handleDelete() {
        setLoading(true)
        try {
            const result = await deleteContact(contact.id)
            if (result.success) {
                toast.success('Contato excluído com sucesso')
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Falha ao excluir contato')
            }
        } catch {
            toast.error('Erro ao excluir contato')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Excluir contato"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir contato</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir <strong>{contact.name}</strong>?
                        Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>
                        ) : 'Excluir'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

interface GetColumnsOptions {
    onOpenProfile?: (contact: EnrichedContact) => void
}

export function getColumns({ onOpenProfile }: GetColumnsOptions = {}): ColumnDef<EnrichedContact>[] {
    return [
        {
            id: 'select',
            header: ({ table }) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Selecionar todos"
                        className="border-zinc-300 dark:border-zinc-600"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Selecionar linha"
                    className="border-zinc-300 dark:border-zinc-600"
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: 'Nome',
            cell: ({ row }) => {
                const name = row.getValue('name') as string
                const initials = name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()

                return (
                    <div
                        className="flex items-center gap-3 cursor-pointer group/name"
                        onClick={() => onOpenProfile?.(row.original)}
                    >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-white/10 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                            {initials}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover/name:text-indigo-600 dark:group-hover/name:text-indigo-400 transition-colors">
                            {name}
                        </span>
                    </div>
                )
            }
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }) => {
                const email = row.getValue('email') as string | null
                return <span className="text-zinc-600 dark:text-zinc-500">{email || '-'}</span>
            },
        },
        {
            accessorKey: 'phone',
            header: 'Telefone',
            cell: ({ row }) => {
                const phone = row.getValue('phone') as string | null
                if (!phone) return <span className="text-zinc-500">-</span>
                return (
                    <div className="flex items-center gap-3 group/phone">
                        <span className="text-zinc-600 dark:text-zinc-400 font-mono text-xs">{phone}</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 transition-all opacity-0 group-hover/phone:opacity-100 hover:scale-110"
                            onClick={(e) => {
                                e.stopPropagation()
                                window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank')
                            }}
                            title="Abrir no WhatsApp"
                        >
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
        {
            accessorKey: 'company',
            header: 'Empresa',
            cell: ({ row }) => {
                const company = row.getValue('company') as string | null
                if (!company) return <span className="text-zinc-600">-</span>
                return (
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5">
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-400">{company}</span>
                    </div>
                )
            },
        },
        {
            id: 'activeStageName',
            accessorKey: 'activeStageName',
            header: 'Etapa',
            cell: ({ row }) => {
                const stage = row.original.activeStageName
                if (!stage) return <span className="text-zinc-400 dark:text-zinc-600">—</span>
                return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40">
                        <Kanban className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                        <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap">{stage}</span>
                    </div>
                )
            },
        },
        {
            id: 'assigneeName',
            accessorKey: 'assigneeName',
            header: 'Responsável',
            cell: ({ row }) => {
                const name = row.original.assigneeName
                if (!name) return <span className="text-zinc-400 dark:text-zinc-600">—</span>
                const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                return (
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-[10px] font-bold text-violet-500 dark:text-violet-400 ring-1 ring-violet-200 dark:ring-violet-800/40 shrink-0">
                            {initials}
                        </div>
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{name}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: 'city',
            header: 'Cidade',
            cell: ({ row }) => {
                const city = row.getValue('city') as string | null
                const state = row.original.state
                if (!city && !state) return <span className="text-zinc-500">-</span>
                return (
                    <span className="text-zinc-600 dark:text-zinc-500">
                        {[city, state].filter(Boolean).join(', ')}
                    </span>
                )
            },
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const contact = row.original
                return (
                    <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <EditContactDialog contact={contact} />
                        <DeleteContactButton contact={contact} />
                    </div>
                )
            },
        },
    ]
}

// Exportação legada para compatibilidade (columns estático sem profile handler)
export const columns = getColumns()
