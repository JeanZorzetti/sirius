'use client'

import { useState } from 'react'
import { Plus, MessageCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeatureGateModal } from '@/components/dashboard/billing/feature-gate-modal'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createDeal } from '@/app/dashboard/actions'

type Stage = {
    id: string
    name: string
}

type Contact = {
    id: string
    name: string
    phone?: string | null
}


export function CreateDealDialog({
    stages,
    contacts: initialContacts,
    dealCount = 0,
    isPro = false
}: {
    stages: Stage[],
    contacts: Contact[],
    dealCount?: number,
    isPro?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedContactId, setSelectedContactId] = useState<string>('')
    const [showNewContact, setShowNewContact] = useState(false)
    const [contacts, setContacts] = useState<Contact[]>(initialContacts)
    const [newContactName, setNewContactName] = useState('')
    const [newContactPhone, setNewContactPhone] = useState('')

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            // Check limits
            if (!isPro && dealCount >= 10) {
                setShowUpgradeModal(true)
                return
            }
        }
        setOpen(newOpen)
        // Reset new contact form when closing
        if (!newOpen) {
            setShowNewContact(false)
            setNewContactName('')
            setNewContactPhone('')
        }
    }

    const handleCreateContact = async () => {
        if (!newContactName.trim()) return

        // Create contact via API
        const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newContactName,
                phone: newContactPhone || undefined
            })
        })

        if (response.ok) {
            const newContact = await response.json()
            setContacts([...contacts, newContact])
            setSelectedContactId(newContact.id)
            setShowNewContact(false)
            setNewContactName('')
            setNewContactPhone('')
        }
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        // Add default user (admin) or handle in server. For MVP we'll pick the first user or pass it.
        // For now, let's hardcode userId in action or pass it if auth works.
        // Auth works (NextAuth). Action can use getServerSession.

        const result = await createDeal(formData)

        setLoading(false)

        if (result.success) {
            setOpen(false)
            // Toast success?
        } else {
            // Might catch server-side limit here too
            if (result.error?.includes('10 negócios')) {
                setOpen(false)
                setShowUpgradeModal(true)
            } else {
                alert("Failed to create deal")
            }
        }
    }

    return (
        <>
            <FeatureGateModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                title="Limite de Negócios Atingido"
                description="O plano gratuito permite até 10 negócios no pipeline. Faça upgrade para remover este limite."
            />

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Novo Deal
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={onSubmit}>
                        <DialogHeader>
                            <DialogTitle>Novo Deal</DialogTitle>
                            <DialogDescription>
                                Crie um novo lead para o seu pipeline.
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
                                    placeholder="Ex: Venda Enterprise"
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
                                    placeholder="0.00"
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="contactId" className="text-right pt-2">
                                    Contato
                                </Label>
                                <div className="col-span-3 space-y-3">
                                    {!showNewContact ? (
                                        <div className="flex gap-2">
                                            <Select name="contactId" onValueChange={setSelectedContactId} value={selectedContactId}>
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
                                            {(() => {
                                                const selectedContact = contacts.find(c => c.id === selectedContactId)
                                                return selectedContact?.phone ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="shrink-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                                                        onClick={() => {
                                                            const phone = selectedContact.phone?.replace(/\D/g, '')
                                                            if (phone) window.open(`https://wa.me/${phone}`, '_blank')
                                                        }}
                                                        title="Conversar no WhatsApp"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </Button>
                                                ) : null
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                                            <div className="space-y-1">
                                                <Label htmlFor="newContactName" className="text-xs">Nome do Contato</Label>
                                                <Input
                                                    id="newContactName"
                                                    value={newContactName}
                                                    onChange={(e) => setNewContactName(e.target.value)}
                                                    placeholder="João Silva"
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="newContactPhone" className="text-xs">Telefone (opcional)</Label>
                                                <Input
                                                    id="newContactPhone"
                                                    value={newContactPhone}
                                                    onChange={(e) => setNewContactPhone(e.target.value)}
                                                    placeholder="+55 11 99999-9999"
                                                    className="h-8"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleCreateContact}
                                                    disabled={!newContactName.trim()}
                                                    className="text-xs"
                                                >
                                                    Salvar Contato
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setShowNewContact(false)}
                                                    className="text-xs"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowNewContact(!showNewContact)}
                                        className="w-full text-xs"
                                    >
                                        <UserPlus className="w-3 h-3 mr-1" />
                                        {showNewContact ? 'Voltar para seleção' : 'Criar Novo Contato'}
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stageId" className="text-right">
                                    Etapa
                                </Label>
                                <div className="col-span-3">
                                    <Select name="stageId" required defaultValue={stages[0]?.id}>
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
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
