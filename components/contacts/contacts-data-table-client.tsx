'use client'

import { Row } from '@tanstack/react-table'
import { DataTable } from '@/components/contacts/data-table'
import { getColumns } from '@/components/contacts/columns'
import { ContactMobileCard } from '@/components/contacts/contact-mobile-card'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteContact } from '@/app/[locale]/dashboard/contacts/actions'
import { useTranslations } from 'next-intl'
import {
  ContactsFilters,
  applyContactFilters,
  EMPTY_FILTERS,
  type ContactFilters,
} from '@/components/contacts/contacts-filters'
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
  openDealsCount: number
  lastActivityAt: Date | null
}

interface ContactsDataTableClientProps {
  data: EnrichedContact[]
}

export function ContactsDataTableClient({ data }: ContactsDataTableClientProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.contacts')
  const router = useRouter()
  const renderCountRef = useRef(0)
  const firstRenderTimeRef = useRef(performance.now())
  renderCountRef.current++

  useEffect(() => {
    const elapsed = performance.now() - firstRenderTimeRef.current
    console.log(
      `%c[PERF-CLIENT] ContactsDataTableClient hydrated`,
      'color: #4f46e5; font-weight: bold',
      `\n  rows: ${data.length}`,
      `\n  hydration time: ${elapsed.toFixed(1)}ms`,
      `\n  render count: ${renderCountRef.current}`
    )
  }, [])

  useEffect(() => {
    if (renderCountRef.current > 1) {
      console.log(
        `%c[PERF-CLIENT] ContactsDataTableClient re-rendered`,
        'color: #f59e0b',
        `count: ${renderCountRef.current}`
      )
    }
  })

  const [profileContact, setProfileContact] = useState<EnrichedContact | null>(null)
  const [editContact, setEditContact] = useState<EnrichedContact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EnrichedContact | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filters, setFilters] = useState<ContactFilters>(EMPTY_FILTERS)

  const filteredData = useMemo(() => applyContactFilters(data, filters), [data, filters])

  const handleOpenProfile = useCallback((c: EnrichedContact) => setProfileContact(c), [])
  const handleEdit = useCallback((c: EnrichedContact) => setEditContact(c), [])
  const handleDelete = useCallback((c: EnrichedContact) => setDeleteTarget(c), [])

  const columns = useMemo(() => {
    const t0 = performance.now()
    const cols = getColumns({ onOpenProfile: handleOpenProfile, onEdit: handleEdit, onDelete: handleDelete, t: (key: string) => t(key as Parameters<typeof t>[0]) })
    console.log(`%c[PERF-CLIENT] getColumns()`, 'color: #6366f1', `${(performance.now() - t0).toFixed(1)}ms`)
    return cols
  }, [handleOpenProfile, handleEdit, handleDelete])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await deleteContact(deleteTarget.id)
      if (result.success) {
        toast.success(t('deleteSuccess'))
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error(result.error || tCommon('toasts.failedDelete'))
      }
    } catch {
      toast.error(tCommon('toasts.failedDelete'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <ContactsFilters data={data} value={filters} onChange={setFilters} />
      <DataTable
        columns={columns}
        data={filteredData}
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
            <AlertDialogTitle>{t('deleteContact')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')} <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tCommon('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{tCommon('buttons.loading')}</>
              ) : tCommon('buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
