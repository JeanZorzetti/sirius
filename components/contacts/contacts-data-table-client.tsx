'use client'

import { Row } from '@tanstack/react-table'
import { DataTable } from '@/components/contacts/data-table'
import { getColumns } from '@/components/contacts/columns'
import { ContactMobileCard } from '@/components/contacts/contact-mobile-card'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { deleteContact } from '@/app/[locale]/dashboard/contacts/actions'
import { createCustomSegment, deleteCustomSegment } from '@/app/[locale]/dashboard/contacts/segment-actions'
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
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

// Lazy-load — só carrega o modal quando o usuário abre
const ContactProfileModal = dynamic(
  () => import('@/components/contacts/contact-profile-modal').then(m => ({ default: m.ContactProfileModal })),
  { ssr: false }
)
const EditContactDialog = dynamic(
  () => import('@/components/contacts/edit-contact-dialog').then(m => ({ default: m.EditContactDialog })),
  { ssr: false }
)

export type WonDeal = {
  id: string
  title: string
  value: number | null
  wonAt: Date | null
  productName: string | null
  representativeName: string | null
}

export type ClosingEntry = {
  id: string
  dealId: string
  dealTitle: string
  date: string
  value: number
  note: string | null
  productName: string | null
  userName: string | null
}

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
  status: string | null
  createdAt: Date
  updatedAt: Date
  organizationId: string
  assignedToId: string | null
  observations: string | null
  activeStageName: string | null
  activeDealId: string | null
  assigneeName: string | null
  openDealsCount: number
  lastActivityAt: Date | null
  wonDeals: WonDeal[]
  closings: ClosingEntry[]
  notes: string | null
  document: string | null
  segment: string | null
}

interface ContactsDataTableClientProps {
  data: EnrichedContact[]
  orgUsers?: { id: string; name: string | null }[]
  customSegments?: { id: string; name: string }[]
}

export function ContactsDataTableClient({ data, orgUsers = [], customSegments: initialCustomSegments = [] }: ContactsDataTableClientProps) {
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

  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [profileContact, setProfileContact] = useState<EnrichedContact | null>(null)
  const [editContact, setEditContact] = useState<EnrichedContact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EnrichedContact | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filters, setFilters] = useState<ContactFilters>(EMPTY_FILTERS)
  const [search, setSearch] = useState('')
  const [customSegments, setCustomSegments] = useState<{ id: string; name: string }[]>(initialCustomSegments)

  useEffect(() => {
    try { localStorage.removeItem('sirius:extra-segments') } catch {}
  }, [])

  // Deep link da busca global: /dashboard/contacts?contact=<id> abre o modal de perfil
  useEffect(() => {
    const contactId = searchParams.get('contact')
    if (!contactId) return
    const target = data.find((c) => c.id === contactId)
    if (target) setProfileContact(target)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('contact')
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false })
  }, [searchParams, data, pathname, router])

  async function handleAddSegment(name: string) {
    const result = await createCustomSegment(name)
    if (!result.success) {
      if (result.code === 'DUPLICATE') {
        toast.info(result.error)
      } else {
        toast.error(result.error || 'Erro ao adicionar segmento')
      }
      return
    }
    setCustomSegments((prev) => [...prev, result.segment].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
    toast.success(`Segmento "${result.segment.name}" adicionado.`)
    router.refresh()
  }

  async function handleDeleteSegment(id: string, name: string) {
    const result = await deleteCustomSegment(id)
    if (!result.success) {
      toast.error(result.error || 'Erro ao remover segmento')
      return
    }
    setCustomSegments((prev) => prev.filter((s) => s.id !== id))
    toast.success(`Segmento "${name}" removido.`)
    router.refresh()
  }

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contatos..."
            className="pl-9 h-9 bg-white dark:bg-white/[0.02] border-black/10 dark:border-white/10"
          />
        </div>
        <ContactsFilters data={data} value={filters} onChange={setFilters} customSegments={customSegments} onAddSegment={handleAddSegment} onDeleteSegment={handleDeleteSegment} />
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        search={search}
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
          orgUsers={orgUsers}
          customSegments={customSegments}
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
