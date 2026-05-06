'use client'

import { Row } from '@tanstack/react-table'
import { DataTable } from '@/components/contacts/data-table'
import { getColumns } from '@/components/contacts/columns'
import { ContactMobileCard } from '@/components/contacts/contact-mobile-card'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load — só carrega o modal de perfil quando o usuário abre um
const ContactProfileModal = dynamic(
  () => import('@/components/contacts/contact-profile-modal').then(m => ({ default: m.ContactProfileModal })),
  { ssr: false }
)

export type EnrichedContact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  street: string | null
  streetNumber: string | null
  complement: string | null
  createdAt: Date
  updatedAt: Date
  organizationId: string
  assignedToId: string | null
  activeStageName: string | null
  assigneeName: string | null
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
