'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    DollarSign,
    Plus,
    Trash2,
    Loader2,
    FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EnrichedContact, ClosingEntry } from './contacts-data-table-client'
import { CONTACT_STATUSES } from './contacts-filters'
import { useTranslations } from 'next-intl'
import { addContactClosing, removeContactClosing } from '@/app/[locale]/dashboard/contacts/actions'

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

    // Local closings state — starts from prop, updated optimistically
    const [closings, setClosings] = React.useState<ClosingEntry[]>(contact.closings ?? [])
    React.useEffect(() => {
        setClosings(contact.closings ?? [])
    }, [contact.id, contact.closings])

    // Add form state
    const [showAddForm, setShowAddForm] = React.useState(false)
    const [addDate, setAddDate] = React.useState(new Date().toISOString().slice(0, 10))
    const [addValue, setAddValue] = React.useState('')
    const [addNote, setAddNote] = React.useState('')
    const [adding, setAdding] = React.useState(false)
    const [removingId, setRemovingId] = React.useState<string | null>(null)
    const [addError, setAddError] = React.useState<string | null>(null)

    function resetForm() {
        setAddDate(new Date().toISOString().slice(0, 10))
        setAddValue('')
        setAddNote('')
        setAddError(null)
    }

    async function handleAdd() {
        if (!addValue || parseFloat(addValue.replace(',', '.')) <= 0) {
            setAddError('Valor obrigatório')
            return
        }
        setAdding(true)
        setAddError(null)

        const res = await addContactClosing(contact.id, {
            dealId: contact.activeDealId ?? null,
            date: addDate,
            value: parseFloat(addValue.replace(',', '.')),
            note: addNote.trim() || null,
        })

        setAdding(false)
        if (res.success && res.closing) {
            setClosings(prev => [res.closing!, ...prev])
            setShowAddForm(false)
            resetForm()
        } else {
            setAddError((res as any).error ?? 'Erro ao registrar fechamento')
        }
    }

    async function handleRemove(closingId: string) {
        setRemovingId(closingId)
        const res = await removeContactClosing(closingId)
        setRemovingId(null)
        if (res.success) {
            setClosings(prev => prev.filter(c => c.id !== closingId))
        }
    }

    const totalFaturado = closings.reduce((s, c) => s + c.value, 0)

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
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

                    <DialogHeader className="sr-only">
                        <DialogTitle>Ficha de {contact.name}</DialogTitle>
                    </DialogHeader>

                    <div className="relative flex items-start gap-4">
                        <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1 pt-1">
                            <h2 className="text-lg font-bold tracking-tight text-white truncate">{contact.name}</h2>
                            {contact.company && (
                                <p className="text-sm text-white/70 truncate">{contact.company}</p>
                            )}

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
                                {closings.length > 0 && (
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 backdrop-blur-sm">
                                        <DollarSign className="h-3 w-3" />
                                        R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                                        value={[contact.street, contact.streetNumber, contact.complement].filter(Boolean).join(', ')}
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

                    {/* Histórico de Faturamento */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                Histórico de Faturamento
                            </span>
                            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                            {closings.length > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            )}
                            <button
                                onClick={() => { setShowAddForm(v => !v); setAddError(null) }}
                                className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                title="Registrar fechamento"
                            >
                                <Plus className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                            </button>
                        </div>

                        {showAddForm && (
                            <div className="mb-3 rounded-xl border border-indigo-200/60 dark:border-indigo-800/30 bg-indigo-50/60 dark:bg-indigo-950/20 p-3 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Data</p>
                                        <Input
                                            type="date"
                                            value={addDate}
                                            onChange={e => setAddDate(e.target.value)}
                                            className="h-8 text-sm bg-white dark:bg-zinc-900"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Valor (R$) *</p>
                                        <Input
                                            placeholder="0,00"
                                            value={addValue}
                                            onChange={e => setAddValue(e.target.value)}
                                            className="h-8 text-sm bg-white dark:bg-zinc-900"
                                            inputMode="decimal"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Observação</p>
                                    <Input
                                        placeholder="Ex: Renovação, Produto X..."
                                        value={addNote}
                                        onChange={e => setAddNote(e.target.value)}
                                        className="h-8 text-sm bg-white dark:bg-zinc-900"
                                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                    />
                                </div>
                                {contact.activeDealId && (
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                        Será vinculado ao deal ativo: <span className="font-semibold">{contact.activeStageName}</span>
                                    </p>
                                )}
                                {addError && <p className="text-xs text-red-500">{addError}</p>}
                                <div className="flex gap-2 pt-1">
                                    <Button size="sm" onClick={handleAdd} disabled={adding} className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                                        {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
                                        Registrar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); resetForm() }} className="h-7 text-xs">
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {closings.length > 0 ? (
                            <div className="space-y-2">
                                {closings.map((cl: ClosingEntry) => (
                                    <div
                                        key={cl.id}
                                        className="flex items-start gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/30 px-3 py-2.5 group/closing"
                                    >
                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                            <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                                                    R$ {cl.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                                    {new Date(cl.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                {cl.dealTitle && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        <Kanban className="h-3 w-3" /> {cl.dealTitle}
                                                    </span>
                                                )}
                                                {cl.note && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        <FileText className="h-3 w-3" /> {cl.note}
                                                    </span>
                                                )}
                                                {cl.userName && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        <User className="h-3 w-3" /> {cl.userName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(cl.id)}
                                            disabled={removingId === cl.id}
                                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-0 group-hover/closing:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                                            title="Remover fechamento"
                                        >
                                            {removingId === cl.id
                                                ? <Loader2 className="h-3 w-3 text-red-500 animate-spin" />
                                                : <Trash2 className="h-3 w-3 text-red-500" />
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !showAddForm && (
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Nenhum fechamento registrado.</p>
                            )
                        )}
                    </div>

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
