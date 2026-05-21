'use client'

import { useState } from 'react'
import { Plus, MapPin, User, Tag, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogDescription,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createContact } from '@/app/[locale]/dashboard/contacts/actions'
import { CONTACT_STATUSES } from '@/components/contacts/contacts-filters'
import { Textarea } from '@/components/ui/textarea'
import { analytics } from '@/lib/posthog'
import { useTranslations } from 'next-intl'

interface CreateContactDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    orgUsers?: { id: string; name: string | null }[]
}

export function CreateContactDialog({ open: externalOpen, onOpenChange: externalOnOpenChange, orgUsers = [] }: CreateContactDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = externalOnOpenChange ?? setInternalOpen
    const [loading, setLoading] = useState(false)
    const [assignedToId, setAssignedToId] = useState<string>('none')
    const [fieldErrors, setFieldErrors] = useState<{ name?: string; document?: string; general?: string }>({})
    const t = useTranslations('components.contacts')
    const tCommon = useTranslations('common')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setFieldErrors({})
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            formData.set('assignedToId', assignedToId)
            const result = await createContact(formData)

            if (result.success) {
                setOpen(false)
            } else {
                const code = 'code' in result ? result.code : undefined
                if (code === 'PLAN_LIMIT_REACHED') {
                    analytics.limitReached({
                        limit_type: 'contacts',
                        current_count: result.current || 0
                    })
                    setFieldErrors({ general: result.error || tCommon('toasts.failedSave') })
                } else if (code === 'DUPLICATE_NAME') {
                    setFieldErrors({ name: result.error || 'Já existe um contato com este nome.' })
                } else if (code === 'DUPLICATE_DOCUMENT') {
                    setFieldErrors({ document: result.error || 'Já existe um contato com este CNPJ.' })
                } else {
                    setFieldErrors({ general: result.error || tCommon('toasts.failedSave') })
                }
            }
        } catch {
            setFieldErrors({ general: tCommon('toasts.failed') })
        } finally {
            setLoading(false)
        }
    }

    function handleOpenChange(value: boolean) {
        if (!value) setFieldErrors({})
        setOpen(value)
    }

    return (
        <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
            {externalOpen === undefined && (
                <ResponsiveDialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> {t('addContact')}
                    </Button>
                </ResponsiveDialogTrigger>
            )}
            <ResponsiveDialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle>{t('createContact')}</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                        {t('addContactDesc')}
                    </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>

                <form id="create-contact-form" onSubmit={onSubmit}>
                    <div className="grid gap-5 py-2">
                        {fieldErrors.general && (
                            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{fieldErrors.general}</p>
                        )}
                        {/* Dados básicos */}
                        <div className="grid gap-3">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right text-sm">{tCommon('fields.name')} *</Label>
                                <div className="col-span-3">
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="João Silva"
                                        className={fieldErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                                        required
                                        onChange={() => setFieldErrors(prev => ({ ...prev, name: undefined }))}
                                    />
                                    {fieldErrors.name && (
                                        <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right text-sm">{tCommon('fields.email')}</Label>
                                <Input id="email" name="email" type="email" placeholder="joao@empresa.com" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right text-sm">{tCommon('fields.phone')}</Label>
                                <Input id="phone" name="phone" placeholder="(11) 99999-9999" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="company" className="text-right text-sm">{tCommon('fields.company')}</Label>
                                <Input id="company" name="company" placeholder="Empresa LTDA" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="document" className="text-right text-sm">CNPJ</Label>
                                <div className="col-span-3">
                                    <Input
                                        id="document"
                                        name="document"
                                        placeholder="00.000.000/0001-00"
                                        className={fieldErrors.document ? 'border-destructive focus-visible:ring-destructive' : ''}
                                        onChange={() => setFieldErrors(prev => ({ ...prev, document: undefined }))}
                                    />
                                    {fieldErrors.document && (
                                        <p className="mt-1 text-xs text-destructive">{fieldErrors.document}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Responsável */}
                        {orgUsers.length > 0 && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-sm flex items-center justify-end gap-1.5">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    Responsável
                                </Label>
                                <div className="col-span-3">
                                    <Select value={assignedToId} onValueChange={setAssignedToId}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sem responsável" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sem responsável</SelectItem>
                                            {orgUsers.map(u => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.name ?? u.id}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right text-sm">Etiqueta</Label>
                            <div className="col-span-3">
                                <Select name="status" defaultValue="none">
                                    <SelectTrigger id="status">
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

                        {/* Separador de endereço */}
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tCommon('fields.address')}</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Endereço */}
                        <div className="grid gap-3">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="zipCode" className="text-right text-sm">{tCommon('fields.zipCode')}</Label>
                                <Input id="zipCode" name="zipCode" placeholder="00000-000" className="col-span-3 max-w-[160px]" maxLength={9} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="street" className="text-right text-sm">{tCommon('fields.address')}</Label>
                                <Input id="street" name="street" placeholder="Av. Paulista" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="streetNumber" className="text-right text-sm">#</Label>
                                <div className="col-span-3 flex gap-3">
                                    <Input id="streetNumber" name="streetNumber" placeholder="1000" className="w-28" />
                                    <Input id="complement" name="complement" placeholder="Apto 42, Sala 3..." className="flex-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="city" className="text-right text-sm">{tCommon('fields.city')}</Label>
                                <div className="col-span-3 flex gap-3">
                                    <Input id="city" name="city" placeholder="São Paulo" className="flex-1" />
                                    <Input id="state" name="state" placeholder="SP" maxLength={2} className="w-16 uppercase" />
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
                            <Label htmlFor="observations" className="text-right text-sm pt-2">Anotações</Label>
                            <Textarea
                                id="observations"
                                name="observations"
                                placeholder="Anotações internas sobre este contato..."
                                className="col-span-3 min-h-[100px] resize-y text-sm"
                            />
                        </div>
                    </div>
                </form>

                <ResponsiveDialogFooter>
                    <Button type="submit" form="create-contact-form" disabled={loading}>
                        {loading ? tCommon('buttons.saving') : tCommon('buttons.save')}
                    </Button>
                </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    )
}
