'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Contact } from '@prisma/client'

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
            return phone || '-'
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
