'use client'

import { useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
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
import { createContact } from '@/app/[locale]/dashboard/contacts/actions'
import { analytics } from '@/lib/posthog'
import { useTranslations } from 'next-intl'

interface CreateContactDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateContactDialog({ open: externalOpen, onOpenChange: externalOnOpenChange }: CreateContactDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = externalOnOpenChange ?? setInternalOpen
    const [loading, setLoading] = useState(false)
    const t = useTranslations('components.contacts')
    const tCommon = useTranslations('common')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)
            const result = await createContact(formData)

            if (result.success) {
                setOpen(false)
            } else {
                if ('code' in result && result.code === 'PLAN_LIMIT_REACHED') {
                    analytics.limitReached({
                        limit_type: 'contacts',
                        current_count: result.current || 0
                    })
                }
                alert(result.error || tCommon('toasts.failedSave'))
            }
        } catch {
            alert(tCommon('toasts.failed'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <ResponsiveDialog open={open} onOpenChange={setOpen}>
            {externalOpen === undefined && (
                <ResponsiveDialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> {t('addContact')}
                    </Button>
                </ResponsiveDialogTrigger>
            )}
            <ResponsiveDialogContent className="sm:max-w-[520px]">
                <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle>{t('createContact')}</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                        {t('addContactDesc')}
                    </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>

                <form id="create-contact-form" onSubmit={onSubmit}>
                    <div className="grid gap-5 py-2">
                        {/* Dados básicos */}
                        <div className="grid gap-3">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right text-sm">{tCommon('fields.name')} *</Label>
                                <Input id="name" name="name" placeholder="João Silva" className="col-span-3" required />
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
