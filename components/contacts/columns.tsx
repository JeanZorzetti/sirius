'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Contact } from '@prisma/client'
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

export const columns: ColumnDef<Contact>[] = [
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
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">
                        {initials}
                    </div>
                    <span className="font-medium text-zinc-200">{name}</span>
                </div>
            )
        }
    },
    {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
            const email = row.getValue('email') as string | null
            return <span className="text-zinc-500">{email || '-'}</span>
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
                    <span className="text-zinc-400 font-mono text-xs">{phone}</span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 transition-all opacity-0 group-hover/phone:opacity-100 hover:scale-110"
                        onClick={() => {
                            const cleanPhone = phone.replace(/\D/g, '')
                            window.open(`https://wa.me/${cleanPhone}`, '_blank')
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
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-800/50 border border-white/5">
                    <span className="text-xs font-medium text-zinc-400">{company}</span>
                </div>
            )
        },
    },
]
