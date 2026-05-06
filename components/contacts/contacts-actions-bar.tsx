'use client'

import dynamic from 'next/dynamic'
import { CreateContactDialog } from '@/components/contacts/create-contact-dialog'

// Lazy-load — só baixa quando o componente realmente renderiza no cliente
const ImportContactsDialog = dynamic(
  () => import('@/components/contacts/import-contacts-dialog').then(m => ({ default: m.ImportContactsDialog })),
  { ssr: false, loading: () => null }
)
const ExportButtons = dynamic(
  () => import('@/components/ui/export-buttons').then(m => ({ default: m.ExportButtons })),
  { ssr: false, loading: () => null }
)

export function ContactsActionsBar() {
  return (
    <div className="flex items-center space-x-2 w-full sm:w-auto">
      <ExportButtons resourceType="contacts" />
      <ImportContactsDialog />
      <CreateContactDialog />
    </div>
  )
}
