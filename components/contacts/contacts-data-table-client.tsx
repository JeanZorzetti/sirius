'use client'

import { Row } from '@tanstack/react-table'
import { DataTable } from '@/components/contacts/data-table'
import { getColumns } from '@/components/contacts/columns'
import { ContactMobileCard } from '@/components/contacts/contact-mobile-card'
import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteContact } from '@/app/[locale]/dashboard/contacts/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

// Lazy-load — só carrega o modal quando o usuário abre
const ContactProfileModal = dynamic(
  () => import('@/components/contacts/contact-profile-modal').then(m => ({ default: m.ContactProfileModal })),
  { ssr: false }
)
const EditContactDialog = dynamic(
  () => import('@/components/contacts/edit-contact-dialog').then(m => ({ default: m.EditContactDialog })),
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
  const router = useRouter()
  const [profileContact, setProfileContact] = useState<EnrichedContact | null>(null)
  const [editContact, setEditContact] = useState<EnrichedContact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EnrichedContact | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleOpenProfile = useCallback((c: EnrichedContact) => setProfileContact(c), [])
  const handleEdit = useCallback((c: EnrichedContact) => setEditContact(c), [])
  const handleDelete = useCallback((c: EnrichedContact) => setDeleteTarget(c), [])

  const columns = useMemo(
    () => getColumns({ onOpenProfile: handleOpenProfile, onEdit: handleEdit, onDelete: handleDelete }),
    [handleOpenProfile, handleEdit, handleDelete]
  )

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await deleteContact(deleteTarget.id)
      if (result.success) {
        toast.success('Contato excluído com sucesso')
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Falha ao excluir contato')
      }
    } catch {
      toast.error('Erro ao excluir contato')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        onRowClick={(row) => setProfileContact(row.original)}
        renderMobileCard={(row: Row<EnrichedContact>) => (
          <ContactMobileCard
            contact={row.original}
            selected={row.getIsSelected()}
            onToggleSelected={value => row.toggleSelected(value)}
            onOpenProfile={() => setProfileContact(row.original)}
            onEdit={() => setEditContact(row.original)}
          />
        )}
      />

      {profileContact && (
        <ContactProfileModal
          contact={profileContact}
          open={!!profileContact}
          onOpenChange={(open) => { if (!open) setProfileContact(null) }}
          onEdit={() => setEditContact(profileContact)}
        />
      )}

      {editContact && (
        <EditContactDialog
          contact={editContact}
          open={true}
          onOpenChange={(open) => { if (!open) setEditContact(null) }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>
              ) : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
