'use client'
import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useAppBar } from '@/components/mobile/app-bar-context'
import { CreateContactDialog } from './create-contact-dialog'

interface ContactsPageClientProps {
  contactCount: number
}

export function ContactsPageClient({ contactCount }: ContactsPageClientProps) {
  const { setConfig } = useAppBar()
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    setConfig({
      title: 'Contatos',
      subtitle: contactCount > 0 ? `${contactCount} contatos` : undefined,
      showSearch: true,
      primaryAction: {
        icon: <UserPlus className="h-5 w-5" />,
        onClick: () => setCreateOpen(true),
        label: 'Novo contato',
      },
    })
    return () => setConfig(null)
  }, [contactCount])

  return (
    <div className="lg:hidden">
      <CreateContactDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
