'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useMemo } from 'react'
import { Pencil, MapPin, Tag, User, NotebookPen, Building2, ChevronsUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { updateContact } from '@/app/[locale]/dashboard/contacts/actions'
import { CONTACT_STATUSES, DEFAULT_SEGMENTS } from '@/components/contacts/contacts-filters'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type EditableContact = {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    company?: string | null
    city?: string | null
    state?: string | null
    zipCode?: string | null
    street?: string | null
    streetNumber?: string | null
    complement?: string | null
    status?: string | null
    assignedToId?: string | null
    observations?: string | null
    document?: string | null
    segment?: string | null
}

export function EditContactDialog({
    contact,
    orgUsers = [],
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: {
    contact: EditableContact
    orgUsers?: { id: string; name: string | null }[]
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    const router = useRouter()
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen
    const [loading, setLoading] = useState(false)
    const [assignedToIdValue, setAssignedToIdValue] = useState(contact.assignedToId ?? 'none')
    const [statusValue, setStatusValue] = useState(contact.status ?? 'none')
    const [segmentOpen, setSegmentOpen] = useState(false)
    const [segmentValue, setSegmentValue] = useState(contact.segment ?? '')
    const [segmentSearch, setSegmentSearch] = useState('')

    const filteredSegments = useMemo(() => {
        if (!segmentSearch.trim()) return DEFAULT_SEGMENTS
        const q = segmentSearch.toLowerCase()
        return DEFAULT_SEGMENTS.filter((s) => s.toLowerCase().includes(q))
    }, [segmentSearch])

    useEffect(() => {
        setAssignedToIdValue(contact.assignedToId ?? 'none')
        setStatusValue(contact.status ?? 'none')
        setSegmentValue(contact.segment ?? '')
    }, [contact.assignedToId, contact.status, contact.segment])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            const result = await updateContact(contact.id, formData)

            if (result.success) {
                toast.success('Contato atualizado com sucesso')
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Falha ao atualizar contato')
            }
        } catch {
            toast.error('Erro de conexão. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const c = contact

    const tCommon = useTranslations('common')

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {trigger ?? (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Editar contato"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Contato</DialogTitle>
                        <DialogDescription>
                            Atualize as informações de <strong>{contact.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        {/* Dados básicos */}
                        <div className="grid gap-3">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right text-sm">Nome *</Label>
                                <Input id="edit-name" name="name" defaultValue={contact.name} className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-email" className="text-right text-sm">Email</Label>
                                <Input id="edit-email" name="email" type="email" defaultValue={contact.email ?? ''} placeholder="joao@empresa.com" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-phone" className="text-right text-sm">Telefone</Label>
                                <Input id="edit-phone" name="phone" defaultValue={contact.phone ?? ''} placeholder="(11) 99999-9999" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-company" className="text-right text-sm">Empresa</Label>
                                <Input id="edit-company" name="company" defaultValue={contact.company ?? ''} placeholder="Empresa LTDA" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-document" className="text-right text-sm">CNPJ</Label>
                                <Input id="edit-document" name="document" defaultValue={contact.document ?? ''} placeholder="00.000.000/0001-00" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-sm flex items-center justify-end gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    Segmento
                                </Label>
                                <div className="col-span-3">
                                    <input type="hidden" name="segment" value={segmentValue} />
                                    <Popover open={segmentOpen} onOpenChange={(v) => { setSegmentOpen(v); if (!v) setSegmentSearch('') }}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between font-normal text-left h-9"
                                            >
                                                <span className={cn('truncate', !segmentValue && 'text-muted-foreground')}>
                                                    {segmentValue || 'Selecionar segmento...'}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[280px] p-0" align="start">
                                            <div className="border-b border-border/60 p-2">
                                                <Input
                                                    value={segmentSearch}
                                                    onChange={(e) => setSegmentSearch(e.target.value)}
                                                    placeholder="Buscar segmento..."
                                                    className="h-8 text-sm"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-56 overflow-y-auto p-1">
                                                {segmentValue && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSegmentValue(''); setSegmentOpen(false) }}
                                                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 italic"
                                                    >
                                                        Sem segmento
                                                    </button>
                                                )}
                                                {filteredSegments.length === 0 ? (
                                                    <div className="py-4 text-center text-xs text-muted-foreground">Nenhum resultado.</div>
                                                ) : (
                                                    filteredSegments.map((seg) => (
                                                        <button
                                                            key={seg}
                                                            type="button"
                                                            onClick={() => { setSegmentValue(seg); setSegmentOpen(false); setSegmentSearch('') }}
                                                            className={cn(
                                                                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors',
                                                                'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                                                                segmentValue === seg && 'bg-indigo-50/60 dark:bg-indigo-500/5'
                                                            )}
                                                        >
                                                            <Check className={cn('h-4 w-4 shrink-0 text-indigo-600', segmentValue === seg ? 'opacity-100' : 'opacity-0')} />
                                                            <span className="truncate">{seg}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            {orgUsers.length > 0 && (
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-assignedTo" className="text-right text-sm">Responsável</Label>
                                    <div className="col-span-3">
                                        <input type="hidden" name="assignedToId" value={assignedToIdValue} />
                                        <Select value={assignedToIdValue} onValueChange={setAssignedToIdValue}>
                                            <SelectTrigger id="edit-assignedTo">
                                                <SelectValue placeholder="Sem responsável" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    <span className="flex items-center gap-2 text-muted-foreground italic">
                                                        <User className="h-3.5 w-3.5" /> Sem responsável
                                                    </span>
                                                </SelectItem>
                                                {orgUsers.map(u => (
                                                    <SelectItem key={u.id} value={u.id}>
                                                        <span className="flex items-center gap-2">
                                                            <User className="h-3.5 w-3.5 text-violet-500" /> {u.name ?? u.id}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-status" className="text-right text-sm">Etiqueta</Label>
                            <div className="col-span-3">
                                <input type="hidden" name="status" value={statusValue} />
                                <Select value={statusValue} onValueChange={setStatusValue}>
                                    <SelectTrigger id="edit-status">
                                        <SelectValue placeholder="Sem status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sem status</SelectItem>
                                        {CONTACT_STATUSES.map(s => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Separador endereço */}
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Endereço</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Endereço */}
                        <div className="grid gap-3">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-zipCode" className="text-right text-sm">CEP</Label>
                                <Input id="edit-zipCode" name="zipCode" defaultValue={c.zipCode ?? ''} placeholder="00000-000" maxLength={9} className="col-span-3 max-w-[160px]" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-street" className="text-right text-sm">Rua</Label>
                                <Input id="edit-street" name="street" defaultValue={c.street ?? ''} placeholder="Av. Paulista" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-streetNumber" className="text-right text-sm">Número</Label>
                                <div className="col-span-3 flex gap-3">
                                    <Input id="edit-streetNumber" name="streetNumber" defaultValue={c.streetNumber ?? ''} placeholder="1000" className="w-28" />
                                    <Input id="edit-complement" name="complement" defaultValue={c.complement ?? ''} placeholder="Apto 42, Sala 3..." className="flex-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-city" className="text-right text-sm">Cidade</Label>
                                <div className="col-span-3 flex gap-3">
                                    <Input id="edit-city" name="city" defaultValue={c.city ?? ''} placeholder="São Paulo" className="flex-1" />
                                    <Input id="edit-state" name="state" defaultValue={c.state ?? ''} placeholder="SP" maxLength={2} className="w-16 uppercase" />
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="flex items-center gap-2">
                            <NotebookPen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="edit-observations" className="text-right text-sm pt-2">Anotações</Label>
                            <Textarea
                                id="edit-observations"
                                name="observations"
                                defaultValue={c.observations ?? ''}
                                placeholder="Anotações internas sobre este contato..."
                                className="col-span-3 min-h-[100px] resize-y text-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? tCommon('buttons.saving') : tCommon('buttons.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
