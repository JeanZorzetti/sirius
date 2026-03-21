'use client'

import { useState, useEffect, useTransition } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { updateDeal, deleteDeal } from '@/app/dashboard/actions'
import { getDealDetails, addNote, deleteNote, addDealClosing, deleteDealClosing, getDealClosings } from '@/app/dashboard/deals/actions'
import { createContact } from '@/app/dashboard/contacts/actions'
import { Loader2, MessageSquare, History, Tag, Calendar, Send, Trash2, Plus, MessageCircle, DollarSign } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from "@/components/ui/scroll-area"
import { DealInsightsPanel, ScriptGenerator } from '@/components/agi'
import { Wand2 } from 'lucide-react'

type SimpleDeal = {
    id: string
    title: string
    value: any
    stageId: string
    contactId?: string | null
    closeDate?: string | Date | null
    dueDate?: string | Date | null
}

interface EditDealDialogProps {
    deal: SimpleDeal | null
    open: boolean
    onOpenChange: (open: boolean) => void
    stages: { id: string, name: string }[]
    contacts: { id: string, name: string, phone?: string | null }[]
    onOptimisticUpdate?: (dealId: string, updates: any) => void
    onOptimisticDelete?: (dealId: string) => void
    onRollback?: (tempId: string) => void
    onSuccess?: () => void
}

export function EditDealDialog({
    deal: initialDeal,
    open,
    onOpenChange,
    stages,
    contacts,
    onOptimisticUpdate,
    onOptimisticDelete,
    onRollback,
    onSuccess
}: EditDealDialogProps) {
    const [loading, setLoading] = useState(false)
    const [fullDeal, setFullDeal] = useState<any>(null)
    const [fetchingDetails, setFetchingDetails] = useState(false)
    const [newNote, setNewNote] = useState("")
    const [isPending, startTransition] = useTransition()
    const [localContacts, setLocalContacts] = useState(contacts)
    const [selectedContactId, setSelectedContactId] = useState(initialDeal?.contactId || 'no_contact')
    const [quickAddOpen, setQuickAddOpen] = useState(false)
    const [quickAddLoading, setQuickAddLoading] = useState(false)
    const [showScriptGenerator, setShowScriptGenerator] = useState(false)
    const [confirmDeleteDeal, setConfirmDeleteDeal] = useState(false)
    const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null)

    // Fechamentos state
    const [closings, setClosings] = useState<any[]>([])
    const [loadingClosings, setLoadingClosings] = useState(false)
    const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0])
    const [closingValue, setClosingValue] = useState('')
    const [closingNote, setClosingNote] = useState('')
    const [savingClosing, setSavingClosing] = useState(false)

    // Fetch full details when dialog opens
    useEffect(() => {
        let cancelled = false

        if (open && initialDeal?.id) {
            setFetchingDetails(true)
            Promise.all([
                getDealDetails(initialDeal.id),
                getDealClosings(initialDeal.id),
            ])
                .then(([data, closingsData]) => {
                    if (!cancelled) {
                        setFullDeal(data)
                        setClosings(closingsData)
                    }
                })
                .catch((err) => {
                    if (!cancelled) {
                        console.error("Failed to fetch deal details:", err)
                        alert("Deal não encontrado ou você não tem permissão para acessá-lo.")
                        onOpenChange(false)
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setFetchingDetails(false)
                    }
                })
        } else {
            setFullDeal(null)
        }

        return () => {
            cancelled = true
        }
    }, [open, initialDeal])

    // Sync local state with props
    useEffect(() => {
        setLocalContacts(contacts)
    }, [contacts])

    useEffect(() => {
        setSelectedContactId(initialDeal?.contactId || 'no_contact')
    }, [initialDeal?.contactId])

    async function handleQuickAddContact(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setQuickAddLoading(true)

        const formData = new FormData(event.currentTarget)
        const result = await createContact(formData)

        setQuickAddLoading(false)

        if (result.success && result.contact) {
            // Add to local contacts list
            setLocalContacts(prev => [...prev, result.contact!])
            // Select the new contact
            setSelectedContactId(result.contact.id)
            // Close popover
            setQuickAddOpen(false)
            // Reset form
            event.currentTarget.reset()
        } else {
            alert(result.error || 'Erro ao criar contato')
        }
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!initialDeal) return

        setLoading(true)
        const formData = new FormData(event.currentTarget)
        formData.append('dealId', initialDeal.id)

        // Override contactId with the controlled selected value
        formData.set('contactId', selectedContactId === 'no_contact' ? '' : selectedContactId)

        // Extract updates for optimistic UI
        const updates = {
            title: formData.get('title') as string,
            value: formData.get('value') ? parseFloat(formData.get('value') as string) : null,
            stageId: formData.get('stageId') as string,
            contactId: selectedContactId === 'no_contact' ? null : selectedContactId,
            closeDate: formData.get('closeDate') as string || null,
            dueDate: formData.get('dueDate') as string || null,
        }

        // Apply optimistic update
        if (onOptimisticUpdate) {
            onOptimisticUpdate(initialDeal.id, updates)
        }

        // Close dialog immediately
        onOpenChange(false)
        setLoading(false)

        // Submit to server in background
        try {
            const result = await updateDeal(formData)

            if (result.success) {
                // Sync with server
                if (onSuccess) {
                    onSuccess()
                }
            } else {
                // Rollback not really applicable for updates - just show error
                alert("Erro ao atualizar negócio: " + (result.error || 'Erro desconhecido'))

                // Sync to get correct data
                if (onSuccess) {
                    onSuccess()
                }
            }
        } catch (error) {
            console.error('Error updating deal:', error)
            alert("Erro ao atualizar negócio")

            // Sync to get correct data
            if (onSuccess) {
                onSuccess()
            }
        }
    }

    async function handleDelete() {
        if (!initialDeal) return

        const dealId = initialDeal.id

        // Apply optimistic delete
        if (onOptimisticDelete) {
            onOptimisticDelete(dealId)
        }

        // Close dialog immediately
        onOpenChange(false)

        // Delete on server in background
        try {
            const result = await deleteDeal(dealId)

            if (result.success) {
                // Sync with server
                if (onSuccess) {
                    onSuccess()
                }
            } else {
                alert("Erro ao excluir negócio: " + (result.error || 'Erro desconhecido'))

                // Sync to restore deal
                if (onSuccess) {
                    onSuccess()
                }
            }
        } catch (error) {
            console.error('Error deleting deal:', error)
            alert("Erro ao excluir negócio")

            // Sync to restore deal
            if (onSuccess) {
                onSuccess()
            }
        }
    }

    const handleAddNote = () => {
        if (!newNote.trim() || !initialDeal) return
        startTransition(async () => {
            try {
                await addNote(initialDeal.id, newNote)
                setNewNote("")
                // Refresh details
                const fresh = await getDealDetails(initialDeal.id)
                setFullDeal(fresh)
            } catch (err) {
                console.error("Failed to add note:", err)
                alert("Erro ao adicionar observação. O deal pode não existir mais.")
            }
        })
    }

    const handleAddClosing = async () => {
        if (!closingValue || !closingDate || !initialDeal) return
        setSavingClosing(true)
        try {
            const newClosing = await addDealClosing(initialDeal.id, closingDate, parseFloat(closingValue), closingNote || undefined)
            setClosings(prev => [newClosing, ...prev])
            setClosingValue('')
            setClosingNote('')
            toast.success('Fechamento registrado!')
        } catch {
            toast.error('Erro ao registrar fechamento')
        } finally {
            setSavingClosing(false)
        }
    }

    const handleDeleteClosing = async (closingId: string) => {
        try {
            await deleteDealClosing(closingId)
            setClosings(prev => prev.filter(c => c.id !== closingId))
            toast.success('Fechamento removido')
        } catch {
            toast.error('Erro ao remover fechamento')
        }
    }

    if (!initialDeal) return null

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="text-xl">{initialDeal.title}</DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span className="font-mono text-zinc-400">#{initialDeal.id.slice(0, 5)}</span>
                        <span>•</span>
                        <span>{fetchingDetails ? 'Carregando detalhes...' : (fullDeal?.user?.name ? `Responsável: ${fullDeal.user.name}` : '')}</span>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-b border-zinc-200 dark:border-zinc-800">
                        <TabsList className="bg-transparent h-12 p-0 space-x-6">
                            <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 pb-3 font-normal text-zinc-500 data-[state=active]:text-indigo-500">
                                Detalhes
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 pb-3 font-normal text-zinc-500 data-[state=active]:text-indigo-500">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Observações
                            </TabsTrigger>
                            <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 pb-3 font-normal text-zinc-500 data-[state=active]:text-indigo-500">
                                <History className="w-4 h-4 mr-2" />
                                Histórico
                            </TabsTrigger>
                            <TabsTrigger value="closings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-0 pb-3 font-normal text-zinc-500 data-[state=active]:text-emerald-500">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Fechamentos
                                {closings.length > 0 && (
                                    <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                                        {closings.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="agi" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none px-0 pb-3 font-normal text-zinc-500 data-[state=active]:text-purple-500">
                                <Wand2 className="w-4 h-4 mr-2" />
                                AGI Insights
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            <TabsContent value="details" className="mt-0">
                                <form onSubmit={onSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Título</Label>
                                            <Input name="title" defaultValue={initialDeal.title} required className="bg-zinc-50 dark:bg-zinc-900/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Valor (R$)</Label>
                                            <Input name="value" type="number" step="0.01" defaultValue={Number(initialDeal.value)} className="bg-zinc-50 dark:bg-zinc-900/50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Etapa</Label>
                                            <Select name="stageId" defaultValue={initialDeal.stageId}>
                                                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stages.map((stage) => (
                                                        <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Contato</Label>
                                            <div className="flex gap-2">
                                                <Select
                                                    name="contactId"
                                                    value={selectedContactId}
                                                    onValueChange={setSelectedContactId}
                                                >
                                                    <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900/50">
                                                        <SelectValue placeholder="Sem contato" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="no_contact">Sem contato</SelectItem>
                                                        {localContacts.map((contact) => (
                                                            <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Popover open={quickAddOpen} onOpenChange={setQuickAddOpen}>
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
                                                        <form onSubmit={handleQuickAddContact} className="space-y-4">
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
                                                                disabled={quickAddLoading}
                                                                className="w-full h-8 text-sm bg-indigo-600 hover:bg-indigo-700"
                                                            >
                                                                {quickAddLoading ? 'Salvando...' : 'Salvar Contato'}
                                                            </Button>
                                                        </form>
                                                    </PopoverContent>
                                                </Popover>
                                                {(() => {
                                                    const selectedContact = localContacts.find(c => c.id === selectedContactId)
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
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Data do Fechamento</Label>
                                            <Input
                                                name="closeDate"
                                                type="date"
                                                defaultValue={initialDeal.closeDate ? new Date(initialDeal.closeDate).toISOString().split('T')[0] : ''}
                                                className="bg-zinc-50 dark:bg-zinc-900/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Agenda (Follow-up)</Label>
                                            <Input
                                                name="dueDate"
                                                type="datetime-local"
                                                defaultValue={fullDeal?.dueDate ? new Date(fullDeal.dueDate).toISOString().slice(0, 16) : ''}
                                                className="bg-zinc-50 dark:bg-zinc-900/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-between border-t border-zinc-100 dark:border-zinc-800">
                                        <Button type="button" variant="ghost" onClick={() => setConfirmDeleteDeal(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                            Excluir Negócio
                                        </Button>
                                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>

                            <TabsContent value="notes" className="mt-0 space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Escreva uma observação..."
                                        className="bg-zinc-50 dark:bg-zinc-900/50"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                    />
                                    <Button onClick={handleAddNote} disabled={!newNote.trim() || isPending} size="icon" className="shrink-0 bg-indigo-600">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4 pt-4">
                                    {fetchingDetails ? (
                                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-400" /></div>
                                    ) : fullDeal?.notes?.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-400 text-sm">Nenhuma observação ainda.</div>
                                    ) : (
                                        fullDeal?.notes?.map((note: any) => (
                                            <NoteItem key={note.id} note={note} onDelete={() => {
                                                setConfirmDeleteNoteId(note.id)
                                            }} />
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="timeline" className="mt-0">
                                <div className="space-y-6 pt-2">
                                    {fetchingDetails ? (
                                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-400" /></div>
                                    ) : fullDeal?.activities?.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-400 text-sm">Nenhuma atividade registrada.</div>
                                    ) : (
                                        fullDeal?.activities?.map((activity: any) => (
                                            <ActivityItem key={activity.id} activity={activity} />
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="closings" className="mt-0 space-y-4">
                                {/* Formulário novo fechamento */}
                                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900/50">
                                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Registrar novo fechamento</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Data</Label>
                                            <Input
                                                type="date"
                                                value={closingDate}
                                                onChange={e => setClosingDate(e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-zinc-800"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Valor (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0,00"
                                                value={closingValue}
                                                onChange={e => setClosingValue(e.target.value)}
                                                className="h-8 text-sm bg-white dark:bg-zinc-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Observação (opcional)</Label>
                                        <Input
                                            placeholder="Ex: Renovação anual, produto X..."
                                            value={closingNote}
                                            onChange={e => setClosingNote(e.target.value)}
                                            className="h-8 text-sm bg-white dark:bg-zinc-800"
                                            onKeyDown={e => e.key === 'Enter' && handleAddClosing()}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddClosing}
                                        disabled={!closingValue || !closingDate || savingClosing}
                                        size="sm"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {savingClosing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
                                        Registrar Fechamento
                                    </Button>
                                </div>

                                {/* Lista de fechamentos */}
                                {closings.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                                            <span>{closings.length} fechamento{closings.length > 1 ? 's' : ''}</span>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                Total: R$ {closings.reduce((s, c) => s + c.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        {closings.map(closing => (
                                            <div key={closing.id} className="flex items-start justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg group">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                            R$ {closing.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-xs text-zinc-500">
                                                            {format(new Date(closing.date), "dd/MM/yyyy", { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                    {closing.note && (
                                                        <p className="text-xs text-zinc-500">{closing.note}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 shrink-0"
                                                    onClick={() => handleDeleteClosing(closing.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {closings.length === 0 && !fetchingDetails && (
                                    <div className="text-center py-8 text-zinc-400 text-sm">
                                        Nenhum fechamento registrado ainda.
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="agi" className="mt-0 space-y-4">
                                {/* Script Generator Button */}
                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => setShowScriptGenerator(true)}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all"
                                    >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        Gerar Script de Vendas
                                    </Button>
                                </div>

                                {/* Deal Insights Panel */}
                                {initialDeal?.id && (
                                    <DealInsightsPanel dealId={initialDeal.id} />
                                )}
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>

            {/* Script Generator Modal */}
            <ScriptGenerator
                isOpen={showScriptGenerator}
                onClose={() => setShowScriptGenerator(false)}
                dealId={initialDeal?.id}
            />
        </Dialog>

        <ConfirmDialog
            open={confirmDeleteDeal}
            onOpenChange={setConfirmDeleteDeal}
            title="Excluir negócio"
            description="Tem certeza que deseja excluir este negócio? Esta ação não pode ser desfeita."
            confirmLabel="Excluir"
            onConfirm={handleDelete}
        />

        <ConfirmDialog
            open={!!confirmDeleteNoteId}
            onOpenChange={(open) => !open && setConfirmDeleteNoteId(null)}
            title="Excluir nota"
            description="Tem certeza que deseja excluir esta nota?"
            confirmLabel="Excluir"
            onConfirm={async () => {
                if (confirmDeleteNoteId && initialDeal) {
                    try {
                        await deleteNote(confirmDeleteNoteId)
                        const fresh = await getDealDetails(initialDeal.id)
                        setFullDeal(fresh)
                    } catch {
                        toast.error("Erro ao excluir nota")
                    }
                }
                setConfirmDeleteNoteId(null)
            }}
        />
        </>
    )
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function NoteItem({ note, onDelete }: { note: any, onDelete: () => void }) {
    return (
        <div className="flex gap-3 group">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(note.user?.name || 'User')}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{note.user?.name || 'Usuário'}</span>
                        <span className="text-xs text-zinc-500">{format(new Date(note.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500" onClick={onDelete}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800/50">
                    {note.content}
                </div>
            </div>
        </div>
    )
}

import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

function ActivityItem({ activity }: { activity: any }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'STAGE_CHANGE': return <ArrowRight className="w-3 h-3" />
            case 'VALUE_CHANGE': return <DollarSign className="w-3 h-3" />
            case 'NOTE_ADDED': return <MessageSquare className="w-3 h-3" />
            case 'CREATE': return <Sparkles className="w-3 h-3" />
            default: return <CheckCircle2 className="w-3 h-3" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'STAGE_CHANGE': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            case 'VALUE_CHANGE': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            case 'NOTE_ADDED': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
            default: return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        }
    }

    return (
        <div className="flex gap-4 relative">
            {/* Timeline Line */}
            <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-zinc-100 dark:bg-zinc-800 last:hidden" />

            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 ${getBgColor(activity.type)}`}>
                {getIcon(activity.type)}
            </div>

            <div className="pt-1.5 pb-2">
                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                    <span>{activity.user?.name || 'Sistema'}</span>
                    <span>•</span>
                    <span className="capitalize">{format(new Date(activity.createdAt), "dd MMM, HH:mm", { locale: ptBR })}</span>
                </div>
            </div>
        </div>
    )
}
