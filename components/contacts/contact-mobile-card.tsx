'use client'

import { Contact } from '@prisma/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { MessageCircle, Phone, Mail, MapPin, Building2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditContactDialog } from '@/components/contacts/edit-contact-dialog'

interface ContactMobileCardProps {
  contact: Contact
  selected: boolean
  onToggleSelected: (value: boolean) => void
}

export function ContactMobileCard({
  contact,
  selected,
  onToggleSelected,
}: ContactMobileCardProps) {
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const cleanPhone = contact.phone?.replace(/\D/g, '') || ''

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white dark:bg-white/[0.02] backdrop-blur-xl shadow-sm transition-all',
        selected
          ? 'border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-500/5'
          : 'border-black/5 dark:border-white/5',
      )}
    >
      {/* Header — avatar + nome + checkbox */}
      <div className="flex items-start gap-3 p-4">
        <Checkbox
          checked={selected}
          onCheckedChange={v => onToggleSelected(!!v)}
          aria-label={`Selecionar ${contact.name}`}
          className="mt-1 touch-target border-zinc-300 dark:border-zinc-600"
        />

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-sm font-bold text-indigo-600 ring-1 ring-white/10 dark:text-indigo-300">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {contact.name}
          </h3>
          {contact.company && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metadata — email, telefone, localização */}
      {(contact.email || contact.phone || contact.city || contact.state) && (
        <div className="space-y-1.5 border-t border-border/40 px-4 py-3 text-xs">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex min-h-[32px] items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${cleanPhone}`}
              className="flex min-h-[32px] items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <span className="font-mono">{contact.phone}</span>
            </a>
          )}
          {(contact.city || contact.state) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <span>
                {[contact.city, contact.state?.toUpperCase()].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions — thumb zone */}
      <div className="flex items-center gap-2 border-t border-border/40 p-3">
        {cleanPhone && (
          <Button
            type="button"
            variant="outline"
            className="touch-target h-11 flex-1 gap-2 border-green-500/30 text-green-600 hover:bg-green-500/10 dark:border-green-500/20 dark:text-green-400"
            onClick={() => window.open(`https://wa.me/${cleanPhone}`, '_blank')}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        )}
        <EditContactDialog
          contact={contact}
          trigger={
            <Button
              type="button"
              variant="outline"
              className={cn(
                'touch-target h-11 gap-2',
                cleanPhone ? 'flex-none px-4' : 'flex-1',
              )}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          }
        />
      </div>
    </div>
  )
}
