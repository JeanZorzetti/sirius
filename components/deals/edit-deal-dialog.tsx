'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useTransition, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
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
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Dialog as TransferDialog,
    DialogContent as TransferDialogContent,
    DialogHeader as TransferDialogHeader,
    DialogTitle as TransferDialogTitle,
    DialogFooter as TransferDialogFooter,
} from '@/components/ui/dialog'
import { updateDeal, deleteDeal, moveDealToPipeline, markDealWon } from '@/app/[locale]/dashboard/actions'
import { getDealDetails, addNote, deleteNote, addDealClosing, deleteDealClosing, getDealClosings } from '@/app/[locale]/dashboard/deals/actions'
import { createContact } from '@/app/[locale]/dashboard/contacts/actions'
import { Loader2, MessageSquare, History, Tag, Calendar, Send, Trash2, Plus, MessageCircle, DollarSign, Phone, Mail, ArrowLeftRight, Bell, BellOff, Clock, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Trophy } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
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
    contacts: { id: string, name: string, phone?: string | null, email?: string | null }[]
    onOptimisticUpdate?: (dealId: string, updates: any) => void
    onOptimisticDelete?: (dealId: string) => void
    onRollback?: (tempId: string) => void
    onSuccess?: () => void
    currentUserId?: string
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
    onSuccess,
    currentUserId,
}: EditDealDialogProps) {
    const tCommon = useTranslations('common')
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fullDeal, setFullDeal] = useState<any>(null)
    const [observations, setObservations] = useState('')
    const [dueDateNote, setDueDateNote] = useState('')
    const [dueDateValue, setDueDateValue] = useState('')
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

    // Transfer pipeline state
    const [showTransferDialog, setShowTransferDialog] = useState(false)
    const [allPipelines, setAllPipelines] = useState<{ id: string; name: string; stages: { id: string; name: string }[] }[]>([])
    const [transferPipelineId, setTransferPipelineId] = useState('')
    const [transferStageId, setTransferStageId] = useState('')
    const [transferring, setTransferring] = useState(false)

    // Products state
    const [products, setProducts] = useState<{ id: string; name: string; price: any }[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string>('no_product')

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
                        setObservations(data?.observations || '')
                        setDueDateNote((data as any)?.dueDateNote || '')
                        setDueDateValue((data as any)?.dueDate ? new Date((data as any).dueDate).toISOString().slice(0, 16) : '')
                        setSelectedProductId((data as any)?.productId || 'no_product')
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

            // Fetch products via REST API (same endpoint used by /dashboard/products)
            fetch('/api/products')
                .then(r => r.ok ? r.json() : [])
                .then((productsData) => {
                    if (!cancelled) setProducts(productsData)
                })
                .catch(() => {/* silent — select will show empty */})

            // Fetch pipelines for transfer feature
            fetch('/api/pipelines')
                .then(r => r.ok ? r.json() : [])
                .then((data) => {
                    if (!cancelled) setAllPipelines(Array.isArray(data) ? data : [])
                })
                .catch(() => {/* silent */})
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
        formData.set('productId', selectedProductId === 'no_product' ? '' : selectedProductId)

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

    async function handleMarkWon() {
        if (!initialDeal) return
        await markDealWon(initialDeal.id)
        onOpenChange(false)
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

    const handleTransferPipeline = async () => {
        if (!initialDeal || !transferPipelineId || !transferStageId) return
        setTransferring(true)
        try {
            const result = await moveDealToPipeline(initialDeal.id, transferPipelineId, transferStageId)
            if (result.success) {
                toast.success('Negócio transferido com sucesso!')
                setShowTransferDialog(false)
                onOpenChange(false)
                if (onSuccess) onSuccess()
            } else {
                toast.error(result.error || 'Erro ao transferir negócio')
            }
        } catch {
            toast.error('Erro ao transferir negócio')
        } finally {
            setTransferring(false)
        }
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
        <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
            <ResponsiveDialogContent
                className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900"
                mobileClassName="h-[92vh] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900"
            >
                <div className="flex h-full flex-col">
                <ResponsiveDialogHeader className="p-6 pb-2 shrink-0">
                    <ResponsiveDialogTitle className="text-xl">{initialDeal.title}</ResponsiveDialogTitle>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span className="font-mono text-zinc-400">#{initialDeal.id.slice(0, 5)}</span>
                        <span>•</span>
                        <span>{fetchingDetails ? 'Carregando detalhes...' : (fullDeal?.user?.name ? `Responsável: ${fullDeal.user.name}` : '')}</span>
                    </div>
                </ResponsiveDialogHeader>

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
                                                <ContactCombobox
                                                    contacts={localContacts}
                                                    value={selectedContactId}
                                                    onChange={setSelectedContactId}
                                                />
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
                                                                {quickAddLoading ? tCommon('buttons.saving') : 'Salvar Contato'}
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
                                                                if (phone) {
                                                                    onOpenChange(false)
                                                                    router.push(`/dashboard/chat?phone=${phone}`)
                                                                }
                                                            }}
                                                            title="Conversar no WhatsApp"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </Button>
                                                    ) : null
                                                })()}
                                            </div>
                                            {(() => {
                                                const selectedContact = localContacts.find(c => c.id === selectedContactId)
                                                if (!selectedContact || (!selectedContact.phone && !selectedContact.email)) return null
                                                return (
                                                    <div className="mt-2 space-y-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs">
                                                        {selectedContact.phone && (
                                                            <a
                                                                href={`tel:${selectedContact.phone.replace(/\D/g, '')}`}
                                                                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                                                            >
                                                                <Phone className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                                                <span className="truncate">{selectedContact.phone}</span>
                                                            </a>
                                                        )}
                                                        {selectedContact.email && (
                                                            <a
                                                                href={`mailto:${selectedContact.email}`}
                                                                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                                                            >
                                                                <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                                                <span className="truncate">{selectedContact.email}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Produto</Label>
                                        <ProductCombobox
                                            products={products}
                                            value={selectedProductId}
                                            onChange={setSelectedProductId}
                                        />
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
                                            <Label className="flex items-center gap-1.5">
                                                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                                                Agenda (Follow-up)
                                            </Label>
                                            <Input
                                                name="dueDate"
                                                type="datetime-local"
                                                value={dueDateValue}
                                                onChange={(e) => setDueDateValue(e.target.value)}
                                                className="bg-zinc-50 dark:bg-zinc-900/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Banner de status do follow-up */}
                                    {dueDateValue && (() => {
                                        const due = new Date(dueDateValue)
                                        const now = new Date()
                                        const diffMs = due.getTime() - now.getTime()
                                        const diffH = diffMs / (1000 * 60 * 60)
                                        const diffD = Math.floor(Math.abs(diffH) / 24)
                                        const isOverdue = diffMs < 0
                                        const isToday = !isOverdue && diffH < 24
                                        const timeLabel = isOverdue
                                            ? diffD === 0 ? 'há algumas horas' : `há ${diffD} dia${diffD > 1 ? 's' : ''}`
                                            : diffH < 1 ? 'em menos de 1 hora'
                                            : diffH < 24 ? `em ${Math.round(diffH)}h`
                                            : `em ${diffD} dia${diffD > 1 ? 's' : ''}`
                                        const formattedDate = format(due, "dd/MM 'às' HH:mm", { locale: ptBR })

                                        return (
                                            <div className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm transition-all ${
                                                isOverdue
                                                    ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30'
                                                    : isToday
                                                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30'
                                                    : 'border-indigo-200 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/30'
                                            }`}>
                                                <div className="mt-0.5 shrink-0">
                                                    {isOverdue
                                                        ? <AlertCircle className="w-4 h-4 text-red-500" />
                                                        : isToday
                                                        ? <Clock className="w-4 h-4 text-amber-500" />
                                                        : <Bell className="w-4 h-4 text-indigo-500" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium leading-none mb-0.5 ${
                                                        isOverdue ? 'text-red-700 dark:text-red-400'
                                                        : isToday ? 'text-amber-700 dark:text-amber-400'
                                                        : 'text-indigo-700 dark:text-indigo-400'
                                                    }`}>
                                                        {isOverdue ? 'Follow-up atrasado' : isToday ? 'Follow-up hoje' : 'Follow-up agendado'}
                                                        <span className="ml-2 font-normal text-xs opacity-80">{formattedDate} · {timeLabel}</span>
                                                    </p>
                                                    {dueDateNote && (
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{dueDateNote}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    title="Marcar como concluído"
                                                    onClick={() => { setDueDateValue(''); setDueDateNote('') }}
                                                    className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    })()}

                                    {/* Nota do follow-up — aparece só quando há data */}
                                    {dueDateValue && (
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                O que fazer neste follow-up?
                                            </Label>
                                            <Input
                                                name="dueDateNote"
                                                value={dueDateNote}
                                                onChange={(e) => setDueDateNote(e.target.value)}
                                                placeholder="Ex: Ligar para apresentar proposta, enviar contrato..."
                                                className="bg-zinc-50 dark:bg-zinc-900/50"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Observações do Deal</Label>
                                        <Textarea
                                            name="observations"
                                            value={observations}
                                            onChange={(e) => setObservations(e.target.value)}
                                            placeholder="Anotações rápidas sobre este negócio..."
                                            className="bg-zinc-50 dark:bg-zinc-900/50 resize-none min-h-[80px]"
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            {initialDeal?.status !== 'WON' && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleMarkWon}
                                                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                                                >
                                                    <Trophy className="w-3.5 h-3.5 mr-1.5" />
                                                    Marcar como Ganho
                                                </Button>
                                            )}
                                            <Button type="button" variant="ghost" onClick={() => setConfirmDeleteDeal(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                Excluir Negócio
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={allPipelines.length === 0}
                                                onClick={() => {
                                                    setTransferPipelineId('')
                                                    setTransferStageId('')
                                                    setShowTransferDialog(true)
                                                }}
                                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                                            >
                                                <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                                                Transferir Pipeline
                                            </Button>
                                        </div>
                                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                            {loading ? tCommon('buttons.saving') : 'Salvar Alterações'}
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
                                                <div className="space-y-0.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                            R$ {closing.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-xs text-zinc-500">
                                                            {format(new Date(closing.date), "dd/MM/yyyy", { locale: ptBR })}
                                                        </span>
                                                        {closing.userName && (
                                                            <span className="text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                                por {closing.userName}
                                                            </span>
                                                        )}
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
                </div>
            </ResponsiveDialogContent>

            {/* Script Generator Modal */}
            <ScriptGenerator
                isOpen={showScriptGenerator}
                onClose={() => setShowScriptGenerator(false)}
                dealId={initialDeal?.id}
            />
        </ResponsiveDialog>

        <TransferDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
            <TransferDialogContent className="sm:max-w-[420px]">
                <TransferDialogHeader>
                    <TransferDialogTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                        Transferir para outro Pipeline
                    </TransferDialogTitle>
                </TransferDialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Pipeline de destino</Label>
                        <Select
                            value={transferPipelineId}
                            onValueChange={(val) => {
                                setTransferPipelineId(val)
                                setTransferStageId('')
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o pipeline" />
                            </SelectTrigger>
                            <SelectContent>
                                {allPipelines.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {transferPipelineId && (
                        <div className="space-y-2">
                            <Label>Etapa de entrada</Label>
                            <Select value={transferStageId} onValueChange={setTransferStageId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a etapa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allPipelines
                                        .find(p => p.id === transferPipelineId)
                                        ?.stages.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <TransferDialogFooter>
                    <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleTransferPipeline}
                        disabled={!transferPipelineId || !transferStageId || transferring}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {transferring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowLeftRight className="w-4 h-4 mr-2" />}
                        Transferir
                    </Button>
                </TransferDialogFooter>
            </TransferDialogContent>
        </TransferDialog>

        <ConfirmDialog
            open={confirmDeleteDeal}
            onOpenChange={setConfirmDeleteDeal}
            title="Excluir negócio"
            description="Tem certeza que deseja excluir este negócio? Esta ação não pode ser desfeita."
            confirmLabel={tCommon('buttons.delete')}
            onConfirm={handleDelete}
        />

        <ConfirmDialog
            open={!!confirmDeleteNoteId}
            onOpenChange={(open) => !open && setConfirmDeleteNoteId(null)}
            title="Excluir nota"
            description="Tem certeza que deseja excluir esta nota?"
            confirmLabel={tCommon('buttons.delete')}
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

function ContactCombobox({
    contacts,
    value,
    onChange,
}: {
    contacts: { id: string; name: string; phone?: string | null; email?: string | null }[]
    value: string
    onChange: (v: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const selected = contacts.find((c) => c.id === value)

    const filtered = useMemo(() => {
        if (!search.trim()) return contacts
        const q = search.toLowerCase()
        return contacts.filter((c) => c.name.toLowerCase().includes(q))
    }, [contacts, search])

    function select(id: string) {
        onChange(id)
        setOpen(false)
        setSearch('')
    }

    const tCommon = useTranslations('common')

    return (
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch('') }}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        !selected && 'text-muted-foreground'
                    )}
                >
                    <span className="truncate">{selected ? selected.name : 'Sem contato'}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <div className="flex items-center border-b border-border/60 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar contato..."
                        className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                    <button
                        type="button"
                        onClick={() => select('no_contact')}
                        className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                            value === 'no_contact' && 'bg-zinc-100 dark:bg-zinc-800'
                        )}
                    >
                        <Check className={cn('h-4 w-4 shrink-0', value === 'no_contact' ? 'opacity-100 text-indigo-600' : 'opacity-0')} />
                        <span className="italic text-muted-foreground">Sem contato</span>
                    </button>
                    {filtered.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">Nenhum contato encontrado.</div>
                    ) : (
                        filtered.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => select(c.id)}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                                    value === c.id && 'bg-indigo-50 dark:bg-indigo-500/10'
                                )}
                            >
                                <Check className={cn('h-4 w-4 shrink-0', value === c.id ? 'opacity-100 text-indigo-600' : 'opacity-0')} />
                                <span className="truncate">{c.name}</span>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

function ProductCombobox({
    products,
    value,
    onChange,
}: {
    products: { id: string; name: string; price: any }[]
    value: string
    onChange: (v: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const selected = products.find((p) => p.id === value)

    const filtered = useMemo(() => {
        if (!search.trim()) return products
        const q = search.toLowerCase()
        return products.filter((p) => p.name.toLowerCase().includes(q))
    }, [products, search])

    function select(id: string) {
        onChange(id)
        setOpen(false)
        setSearch('')
    }

    const tCommon = useTranslations('common')

    return (
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch('') }}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        !selected && 'text-muted-foreground'
                    )}
                >
                    <span className="truncate">{selected ? selected.name : 'Sem produto'}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <div className="flex items-center border-b border-border/60 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar produto..."
                        className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                    <button
                        type="button"
                        onClick={() => select('no_product')}
                        className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                            value === 'no_product' && 'bg-zinc-100 dark:bg-zinc-800'
                        )}
                    >
                        <Check className={cn('h-4 w-4 shrink-0', value === 'no_product' ? 'opacity-100 text-indigo-600' : 'opacity-0')} />
                        <span className="italic text-muted-foreground">Sem produto</span>
                    </button>
                    {filtered.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div>
                    ) : (
                        filtered.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => select(p.id)}
                                className={cn(
                                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                                    value === p.id && 'bg-indigo-50 dark:bg-indigo-500/10'
                                )}
                            >
                                <Check className={cn('h-4 w-4 shrink-0', value === p.id ? 'opacity-100 text-indigo-600' : 'opacity-0')} />
                                <div className="flex items-center justify-between w-full min-w-0 gap-2">
                                    <span className="truncate">{p.name}</span>
                                    {p.price != null && (
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
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
    const tCommon = useTranslations('common')
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

function ActivityItem({ activity }: { activity: any }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'STAGE_CHANGE': return <ArrowRight className="w-3 h-3" />
            case 'PIPELINE_CHANGE': return <ArrowLeftRight className="w-3 h-3" />
            case 'VALUE_CHANGE': return <DollarSign className="w-3 h-3" />
            case 'NOTE_ADDED': return <MessageSquare className="w-3 h-3" />
            case 'CLOSING_ADDED': return <DollarSign className="w-3 h-3" />
            case 'CLOSING_REMOVED': return <Trash2 className="w-3 h-3" />
            case 'CREATE': return <Sparkles className="w-3 h-3" />
            default: return <CheckCircle2 className="w-3 h-3" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'STAGE_CHANGE': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            case 'PIPELINE_CHANGE': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
            case 'VALUE_CHANGE': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            case 'NOTE_ADDED': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'CLOSING_ADDED': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            case 'CLOSING_REMOVED': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        }
    }

    const tCommon = useTranslations('common')

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
