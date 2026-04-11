'use client'

import { Contact } from '@prisma/client'
import { Row } from '@tanstack/react-table'
import { DataTable } from '@/components/contacts/data-table'
import { columns } from '@/components/contacts/columns'
import { ContactMobileCard } from '@/components/contacts/contact-mobile-card'

interface ContactsDataTableClientProps {
  data: Contact[]
}

export function ContactsDataTableClient({ data }: ContactsDataTableClientProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      renderMobileCard={(row: Row<Contact>) => (
        <ContactMobileCard
          contact={row.original}
          selected={row.getIsSelected()}
          onToggleSelected={value => row.toggleSelected(value)}
        />
      )}
    />
  )
}
