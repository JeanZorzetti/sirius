'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Contact } from '@prisma/client'
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

export const columns: ColumnDef<Contact>[] = [
    {
        accessorKey: 'name',
        header: 'Nome',
    },
    {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
            const email = row.getValue('email') as string | null
            return email || '-'
        },
    },
    {
        accessorKey: 'phone',
        header: 'Telefone',
        cell: ({ row }) => {
            const phone = row.getValue('phone') as string | null
            if (!phone) return '-'

            return (
                <div className="flex items-center gap-2">
                    <span>{phone}</span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
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
            return company || '-'
        },
    },
]
