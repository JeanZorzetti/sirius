'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageCircle, Trash2, Pencil, User, Briefcase, Clock, ArrowUpDown } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { EnrichedContact } from './contacts-data-table-client'
import { CONTACT_STATUSES } from './contacts-filters'

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active:      { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  prospect:    { bg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40',           text: 'text-blue-700 dark:text-blue-300',           dot: 'bg-blue-500' },
  inactive:    { bg: 'bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40',           text: 'text-zinc-500 dark:text-zinc-400',           dot: 'bg-zinc-400' },
  researching: { bg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40',       text: 'text-amber-700 dark:text-amber-300',         dot: 'bg-amber-500' },
  trash:       { bg: 'bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-800/40',               text: 'text-red-600 dark:text-red-400',             dot: 'bg-red-500' },
}

interface GetColumnsOptions {
    onOpenProfile?: (contact: EnrichedContact) => void
    onEdit?: (contact: EnrichedContact) => void
    onDelete?: (contact: EnrichedContact) => void
    t?: (key: string) => string
}

export function getColumns({ onOpenProfile, onEdit, onDelete, t }: GetColumnsOptions = {}): ColumnDef<EnrichedContact>[] {
    const label = (key: string, fallback: string) => t ? t(key) : fallback
    return [
        {
            id: 'select',
            size: 40,
            header: ({ table }) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label={label('selectAll', 'Select all')}
                        className="border-zinc-300 dark:border-zinc-600"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label={label('selectRow', 'Select row')}
                        className="border-zinc-300 dark:border-zinc-600"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            size: 220,
            header: label('name', 'Name'),
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
            size: 240,
            header: label('email', 'Email'),
            cell: ({ row }) => {
                const email = row.getValue('email') as string | null
                return <span className="text-zinc-600 dark:text-zinc-500 block truncate">{email || '-'}</span>
            },
        },
        {
            accessorKey: 'phone',
            size: 180,
            header: label('phone', 'Phone'),
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
            size: 180,
            header: label('company', 'Company'),
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
            id: 'status',
            accessorKey: 'status',
            size: 160,
            header: label('status', 'Status'),
            cell: ({ row }) => {
                const status = row.original.status
                if (!status) return <span className="text-zinc-400 dark:text-zinc-600">—</span>
                const style = STATUS_STYLES[status]
                const label2 = CONTACT_STATUSES.find(s => s.value === status)?.label ?? status
                return (
                    <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full', style?.bg)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style?.dot)} />
                        <span className={cn('text-xs font-medium whitespace-nowrap', style?.text)}>{label2}</span>
                    </div>
                )
            },
        },
        {
            id: 'assigneeName',
            accessorKey: 'assigneeName',
            size: 180,
            header: label('owner', 'Owner'),
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
            id: 'openDealsCount',
            accessorKey: 'openDealsCount',
            size: 120,
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {label('openDeals', 'Open Deals')}
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                </button>
            ),
            cell: ({ row }) => {
                const count = row.original.openDealsCount
                if (count === 0) return <span className="text-zinc-400 dark:text-zinc-600">—</span>
                return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
                        <Briefcase className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{count}</span>
                    </div>
                )
            },
            sortingFn: 'basic',
        },
        {
            id: 'lastActivityAt',
            accessorKey: 'lastActivityAt',
            size: 160,
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {label('lastActivity', 'Last Activity')}
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                </button>
            ),
            cell: ({ row }) => {
                const date = row.original.lastActivityAt
                if (!date) return <span className="text-zinc-400 dark:text-zinc-600">—</span>
                const d = new Date(date)
                const relative = formatDistanceToNow(d, { locale: ptBR, addSuffix: true })
                const isRecent = Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000
                return (
                    <div className="flex items-center gap-1.5" title={d.toLocaleString('pt-BR')}>
                        <Clock className={`h-3 w-3 shrink-0 ${isRecent ? 'text-emerald-500' : 'text-zinc-400'}`} />
                        <span className={`text-xs whitespace-nowrap ${isRecent ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-500 dark:text-zinc-500'}`}>
                            {relative}
                        </span>
                    </div>
                )
            },
            sortingFn: (rowA, rowB) => {
                const a = rowA.original.lastActivityAt ? new Date(rowA.original.lastActivityAt).getTime() : 0
                const b = rowB.original.lastActivityAt ? new Date(rowB.original.lastActivityAt).getTime() : 0
                return a - b
            },
        },
        {
            accessorKey: 'city',
            size: 140,
            header: label('city', 'City'),
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
            size: 100,
            header: '',
            cell: ({ row }) => {
                const contact = row.original
                return (
                    <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title={label('editContact', 'Edit contact')}
                            onClick={() => onEdit?.(contact)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title={label('deleteContact', 'Delete contact')}
                            onClick={() => onDelete?.(contact)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            },
        },
    ]
}

export const columns = getColumns()
