'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { updateDeal, deleteDeal } from '@/app/dashboard/actions'

type Deal = {
    id: string
    title: string
    value: any
    stageId: string
    contactId?: string | null
}

type Stage = {
    id: string
    name: string
}

type Contact = {
    id: string
    name: string
}

interface EditDealDialogProps {
    deal: Deal | null
    open: boolean
    onOpenChange: (open: boolean) => void
    stages: Stage[]
    contacts: Contact[]
}

export function EditDealDialog({ deal, open, onOpenChange, stages, contacts }: EditDealDialogProps) {
    const [loading, setLoading] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!deal) return

        setLoading(true)
        const formData = new FormData(event.currentTarget)
        formData.append('dealId', deal.id)

        const result = await updateDeal(formData)
        setLoading(false)

        if (result.success) {
            onOpenChange(false)
        } else {
            alert("Failed to update deal")
        }
    }

    async function handleDelete() {
        if (!deal) return
        if (!confirm('Tem certeza que deseja excluir este deal?')) return

        setLoading(true)
        const result = await deleteDeal(deal.id)
        setLoading(false)

        if (result.success) {
            onOpenChange(false)
        } else {
            alert("Failed to delete deal")
        }
    }

    if (!deal) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Deal</DialogTitle>
                        <DialogDescription>
                            Faça alterações no deal.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Título
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={deal.title}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="value" className="text-right">
                                Valor
                            </Label>
                            <Input
                                id="value"
                                name="value"
                                type="number"
                                step="0.01"
                                defaultValue={deal.value ? Number(deal.value) : ''}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="contactId" className="text-right">
                                Contato
                            </Label>
                            <div className="col-span-3">
                                <Select name="contactId" defaultValue={deal.contactId || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um contato" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contacts.map((contact) => (
                                            <SelectItem key={contact.id} value={contact.id}>
                                                {contact.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stageId" className="text-right">
                                Etapa
                            </Label>
                            <div className="col-span-3">
                                <Select name="stageId" defaultValue={deal.stageId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a etapa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages.map((stage) => (
                                            <SelectItem key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Excluir
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
