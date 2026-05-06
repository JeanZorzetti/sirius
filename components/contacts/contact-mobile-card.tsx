'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { MessageCircle, Phone, Mail, MapPin, Building2, Pencil, Kanban, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import type { EnrichedContact } from './contacts-data-table-client'

interface ContactMobileCardProps {
  contact: EnrichedContact
  selected: boolean
  onToggleSelected: (value: boolean) => void
  onOpenProfile?: () => void
  onEdit?: () => void
}

export function ContactMobileCard({
  contact,
  selected,
  onToggleSelected,
  onOpenProfile,
  onEdit,
}: ContactMobileCardProps) {
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const cleanPhone = contact.phone?.replace(/\D/g, '') || ''

  const handleCall = () => {
    if (cleanPhone) window.location.href = `tel:${cleanPhone}`
  }
  const handleWhatsApp = () => {
    if (cleanPhone) window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  return (
    <SwipeableRow
      disabled={!cleanPhone}
      leftAction={
        cleanPhone
          ? {
              icon: <Phone className="h-5 w-5" />,
              label: 'Ligar',
              background: 'bg-blue-500',
              onAction: handleCall,
            }
          : undefined
      }
      rightAction={
        cleanPhone
          ? {
              icon: <MessageCircle className="h-5 w-5" />,
              label: 'WhatsApp',
              background: 'bg-green-500',
              onAction: handleWhatsApp,
            }
          : undefined
      }
    >
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
          onClick={e => e.stopPropagation()}
        />

        <button
          type="button"
          onClick={onOpenProfile}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-sm font-bold text-indigo-600 ring-1 ring-white/10 dark:text-indigo-300"
        >
          {initials}
        </button>

        <div
          className={cn('min-w-0 flex-1', onOpenProfile && 'cursor-pointer')}
          onClick={onOpenProfile}
        >
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {contact.name}
          </h3>
          {contact.company && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}
          {(contact.activeStageName || contact.assigneeName) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {contact.activeStageName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  <Kanban className="h-2.5 w-2.5" />
                  {contact.activeStageName}
                </span>
              )}
              {contact.assigneeName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                  <User className="h-2.5 w-2.5" />
                  {contact.assigneeName}
                </span>
              )}
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
        {onOpenProfile && (
          <Button
            type="button"
            variant="outline"
            className="touch-target h-11 flex-1 gap-2"
            onClick={onOpenProfile}
          >
            <User className="h-4 w-4" />
            Ver ficha
          </Button>
        )}
        {onEdit && (
          <Button
            type="button"
            variant="outline"
            className="touch-target h-11 flex-none px-4 gap-2"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        )}
      </div>
    </div>
    </SwipeableRow>
  )
}
