'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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

interface CreateContactDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateContactDialog({ open: externalOpen, onOpenChange: externalOnOpenChange }: CreateContactDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = externalOnOpenChange ?? setInternalOpen
    const [loading, setLoading] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(event.currentTarget)

            const result = await createContact(formData)

            if (result.success) {
                setOpen(false)
            } else {
                console.error('[CreateContact] Server action error:', result)
                if ('code' in result && result.code === 'PLAN_LIMIT_REACHED') {
                    analytics.limitReached({
                        limit_type: 'contacts',
                        current_count: result.current || 0
                    })
                }
                alert(result.error || 'Falha ao criar contato')
            }
        } catch (error) {
            console.error('[CreateContact] Exception:', error)
            alert('Erro de conexão ao criar contato. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const formContent = (
        <form id="create-contact-form" onSubmit={onSubmit}>
            <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome</Label>
                    <Input id="name" name="name" placeholder="João Silva" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="joao@empresa.com" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Telefone</Label>
                    <Input id="phone" name="phone" placeholder="(11) 99999-9999" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right">Empresa</Label>
                    <Input id="company" name="company" placeholder="Empresa LTDA" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="city" className="text-right">Cidade</Label>
                    <Input id="city" name="city" placeholder="São Paulo" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="state" className="text-right">Estado</Label>
                    <Input id="state" name="state" placeholder="SP" maxLength={2} className="col-span-3" />
                </div>
            </div>
        </form>
    )

    const footerContent = (
        <Button type="submit" form="create-contact-form" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
        </Button>
    )

    return (
        <ResponsiveDialog open={open} onOpenChange={setOpen}>
            {externalOpen === undefined && (
                <ResponsiveDialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Contato
                    </Button>
                </ResponsiveDialogTrigger>
            )}
            <ResponsiveDialogContent className="sm:max-w-[425px]">
                <ResponsiveDialogHeader>
                    <ResponsiveDialogTitle>Novo Contato</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                        Adicione um novo contato à sua base.
                    </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                {formContent}
                <ResponsiveDialogFooter>
                    {footerContent}
                </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
        </ResponsiveDialog>
    )
}
