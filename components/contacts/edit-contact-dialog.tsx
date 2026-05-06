'use client'

import { useState } from 'react'
import { Pencil, MapPin } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { updateContact } from '@/app/[locale]/dashboard/contacts/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
}

export function EditContactDialog({
    contact,
    trigger,
}: {
    contact: EditableContact
    trigger?: React.ReactNode
}) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
