'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { createContact } from '@/app/[locale]/dashboard/contacts/actions'
import type { ContactOption } from './types'

/** "+" button next to the contact combobox: creates a contact inline. */
export function QuickAddContactPopover({
    onContactCreated,
}: {
    onContactCreated: (contact: ContactOption) => void
}) {
    const tCommon = useTranslations('common')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const result = await createContact(formData)

        setLoading(false)

        if (result.success && result.contact) {
            onContactCreated(result.contact)
            setOpen(false)
            event.currentTarget.reset()
        } else {
            alert(result.error || 'Erro ao criar contato')
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-zinc-50 dark:bg-zinc-900/50"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Adicionar Contato</h4>
                        <p className="text-xs text-zinc-500">Crie um novo contato rapidamente</p>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="quick-name" className="text-xs">Nome *</Label>
                            <Input
                                id="quick-name"
                                name="name"
                                placeholder="João Silva"
                                required
                                className="h-8 text-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="quick-email" className="text-xs">Email</Label>
                            <Input
                                id="quick-email"
                                name="email"
                                type="email"
                                placeholder="joao@empresa.com"
                                className="h-8 text-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="quick-phone" className="text-xs">Telefone</Label>
                            <Input
                                id="quick-phone"
                                name="phone"
                                placeholder="(11) 99999-9999"
                                className="h-8 text-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="quick-company" className="text-xs">Empresa</Label>
                            <Input
                                id="quick-company"
                                name="company"
                                placeholder="Empresa LTDA"
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-8 text-sm bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loading ? tCommon('buttons.saving') : 'Salvar Contato'}
                    </Button>
                </form>
            </PopoverContent>
        </Popover>
    )
}
