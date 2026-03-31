'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
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
import { Contact } from '@prisma/client'

export function EditContactDialog({ contact }: { contact: Contact }) {
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
        } catch (error) {
            toast.error('Erro de conexão. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full text-zinc-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Editar contato"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Contato</DialogTitle>
                        <DialogDescription>
                            Atualize as informações de <strong>{contact.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nome</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={contact.name}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={contact.email ?? ''}
                                placeholder="joao@empresa.com"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Telefone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                defaultValue={contact.phone ?? ''}
                                placeholder="(11) 99999-9999"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="company" className="text-right">Empresa</Label>
                            <Input
                                id="company"
                                name="company"
                                defaultValue={contact.company ?? ''}
                                placeholder="Empresa LTDA"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="city" className="text-right">Cidade</Label>
                            <Input
                                id="city"
                                name="city"
                                defaultValue={(contact as any).city ?? ''}
                                placeholder="São Paulo"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="state" className="text-right">Estado</Label>
                            <Input
                                id="state"
                                name="state"
                                defaultValue={(contact as any).state ?? ''}
                                placeholder="SP"
                                maxLength={2}
                                className="col-span-3"
                            />
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
