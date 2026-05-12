'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Phone,
    Mail,
    Building2,
    MapPin,
    MessageCircle,
    Pencil,
    Kanban,
    User,
    Hash,
    Navigation,
    Calendar,
    Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EnrichedContact } from './contacts-data-table-client'
import { CONTACT_STATUSES } from './contacts-filters'
import { useTranslations } from 'next-intl'

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  active:      { bg: 'bg-emerald-500/20', text: 'text-emerald-100', dot: 'bg-emerald-400' },
  prospect:    { bg: 'bg-blue-500/20',    text: 'text-blue-100',    dot: 'bg-blue-400' },
  inactive:    { bg: 'bg-white/10',       text: 'text-white/60',    dot: 'bg-white/40' },
  researching: { bg: 'bg-amber-500/20',   text: 'text-amber-100',   dot: 'bg-amber-400' },
  trash:       { bg: 'bg-red-500/20',     text: 'text-red-200',     dot: 'bg-red-400' },
}

interface ContactProfileModalProps {
    contact: EnrichedContact
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: () => void
}

function InfoRow({
    icon: Icon,
    label,
    value,
    href,
    className,
}: {
    icon: React.ElementType
    label: string
    value: string | null | undefined
    href?: string
    className?: string
}) {
    if (!value) return null
    return (
        <div className={cn('flex items-start gap-3 group/row', className)}>
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800/60">
                <Icon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{label}</p>
                {href ? (
                    <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="mt-0.5 block truncate text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        {value}
                    </a>
                ) : (
                    <p className="mt-0.5 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{value}</p>
                )}
            </div>
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{children}</span>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
        </div>
    )
}

export function ContactProfileModal({ contact, open, onOpenChange, onEdit }: ContactProfileModalProps) {
    const tCommon = useTranslations('common')
    const t = useTranslations('components.contacts')
    const initials = contact.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    const phone = contact.phone?.replace(/\D/g, '')

    const addressParts = [
        contact.street && contact.streetNumber
            ? `${contact.street}, ${contact.streetNumber}${contact.complement ? ` — ${contact.complement}` : ''}`
            : contact.street,
        contact.city && contact.state
            ? `${contact.city} — ${contact.state.toUpperCase()}`
            : contact.city || contact.state?.toUpperCase(),
        contact.zipCode,
    ].filter(Boolean)

    const fullAddress = addressParts.join('\n')

    const mapsUrl = fullAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress.replace(/\n/g, ', '))}`
        : null

    const createdAt = contact.createdAt
        ? new Date(contact.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
        : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
                {/* Hero header */}
                <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 pb-8 pt-6">
                    {/* Subtle noise texture */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                    <DialogHeader className="sr-only">
                        <DialogTitle>Ficha de {contact.name}</DialogTitle>
                    </DialogHeader>

                    <div className="relative flex items-start gap-4">
                        {/* Avatar */}
                        <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1 pt-1">
                            <h2 className="text-lg font-bold tracking-tight text-white truncate">{contact.name}</h2>
                            {contact.company && (
                                <p className="text-sm text-white/70 truncate">{contact.company}</p>
                            )}

                            {/* Badges row */}
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {contact.status && (() => {
                                    const style = STATUS_BADGE[contact.status]
                                    const lbl = CONTACT_STATUSES.find(s => s.value === contact.status)?.label ?? contact.status
                                    return (
                                        <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm', style?.bg, style?.text)}>
                                            <span className={cn('h-1.5 w-1.5 rounded-full', style?.dot)} />
                                            {lbl}
                                        </div>
                                    )
                                })()}
                                {contact.activeStageName && (
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                                        <Kanban className="h-3 w-3" />
                                        {contact.activeStageName}
                                        {contact.assigneeName && (
                                            <span className="text-white/60">· {contact.assigneeName}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="relative mt-5 flex gap-2">
                        {phone && (
                            <a
                                href={`tel:+${phone}`}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
                            >
                                <Phone className="h-3.5 w-3.5" /> Ligar
                            </a>
                        )}
                        {phone && (
                            <a
                                href={`https://wa.me/${phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
                            >
                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                            </a>
                        )}
                        {contact.email && (
                            <a
                                href={`mailto:${contact.email}`}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
                            >
                                <Mail className="h-3.5 w-3.5" /> Email
                            </a>
                        )}
                        {mapsUrl && (
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
                            >
                                <Navigation className="h-3.5 w-3.5" /> Rota
                            </a>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[50vh] overflow-y-auto">
                    {/* Contato */}
                    <div>
                        <SectionTitle>Contato</SectionTitle>
                        <div className="space-y-3">
                            <InfoRow icon={Phone} label="Telefone" value={contact.phone} href={phone ? `tel:+${phone}` : undefined} />
                            <InfoRow icon={Mail} label="Email" value={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} />
                            <InfoRow icon={Building2} label="Empresa" value={contact.company} />
                        </div>
                    </div>

                    {/* Endereço */}
                    {(contact.street || contact.city || contact.zipCode) && (
                        <div>
                            <SectionTitle>Endereço</SectionTitle>
                            <div className="space-y-3">
                                {contact.zipCode && (
                                    <InfoRow icon={Hash} label="CEP" value={contact.zipCode} />
                                )}
                                {contact.street && (
                                    <InfoRow
                                        icon={MapPin}
                                        label="Logradouro"
                                        value={[
                                            contact.street,
                                            contact.streetNumber,
                                            contact.complement,
                                        ].filter(Boolean).join(', ')}
                                    />
                                )}
                                {(contact.city || contact.state) && (
                                    <InfoRow
                                        icon={MapPin}
                                        label="Cidade / Estado"
                                        value={[contact.city, contact.state?.toUpperCase()].filter(Boolean).join(' — ')}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pipeline */}
                    {(contact.activeStageName || contact.assigneeName) && (
                        <div>
                            <SectionTitle>Pipeline</SectionTitle>
                            <div className="space-y-3">
                                <InfoRow icon={Kanban} label="Etapa ativa" value={contact.activeStageName} />
                                <InfoRow icon={User} label="Responsável" value={contact.assigneeName} />
                            </div>
                        </div>
                    )}

                    {/* Meta */}
                    <div>
                        <SectionTitle>Informações</SectionTitle>
                        <div className="space-y-3">
                            {contact.status && (
                                <InfoRow
                                    icon={Tag}
                                    label="Status"
                                    value={CONTACT_STATUSES.find(s => s.value === contact.status)?.label ?? contact.status}
                                />
                            )}
                            <InfoRow icon={Calendar} label="Cadastrado em" value={createdAt} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-muted-foreground">
                        {tCommon('buttons.close')}
                    </Button>
                    {onEdit && (
                        <Button size="sm" className="gap-1.5" onClick={() => { onOpenChange(false); onEdit() }}>
                            <Pencil className="h-3.5 w-3.5" /> {tCommon('buttons.edit')}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
