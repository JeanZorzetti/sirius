'use client'

import { Contact } from '@prisma/client'
import { Row } from '@tanstack/react-table'
import { DataTable } from '@/components/contacts/data-table'
import { getColumns } from '@/components/contacts/columns'
import { ContactMobileCard } from '@/components/contacts/contact-mobile-card'
import { useState } from 'react'
import { ContactProfileModal } from '@/components/contacts/contact-profile-modal'

export type EnrichedContact = Contact & {
  activeStageName: string | null
  assigneeName: string | null
  // Address fields (added via schema — available after next DB migration)
  zipCode?: string | null
  street?: string | null
  streetNumber?: string | null
  complement?: string | null
}

interface ContactsDataTableClientProps {
  data: EnrichedContact[]
}

export function ContactsDataTableClient({ data }: ContactsDataTableClientProps) {
  const [selectedContact, setSelectedContact] = useState<EnrichedContact | null>(null)

  const columns = getColumns({ onOpenProfile: setSelectedContact })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        onRowClick={(row) => setSelectedContact(row.original)}
        renderMobileCard={(row: Row<EnrichedContact>) => (
          <ContactMobileCard
            contact={row.original}
            selected={row.getIsSelected()}
            onToggleSelected={value => row.toggleSelected(value)}
            onOpenProfile={() => setSelectedContact(row.original)}
          />
        )}
      />
      {selectedContact && (
        <ContactProfileModal
          contact={selectedContact}
          open={!!selectedContact}
          onOpenChange={(open) => { if (!open) setSelectedContact(null) }}
        />
      )}
    </>
  )
}
