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
import { updateDeal, deleteDeal } from '@/app/dashboard/actions'
import { getDealDetails, addNote } from '@/app/dashboard/deals/actions' // Assuming these exist
import { Loader2, MessageSquare, History, Tag, Calendar, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from "@/components/ui/scroll-area"

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
    contacts: { id: string, name: string }[]
}

export function EditDealDialog({ deal: initialDeal, open, onOpenChange, stages, contacts }: EditDealDialogProps) {
    const [loading, setLoading] = useState(false)
    const [fullDeal, setFullDeal] = useState<any>(null)
    const [fetchingDetails, setFetchingDetails] = useState(false)
    const [newNote, setNewNote] = useState("")
    const [isPending, startTransition] = useTransition()

    // Fetch full details when dialog opens
    useEffect(() => {
        if (open && initialDeal?.id) {
            setFetchingDetails(true)
            getDealDetails(initialDeal.id)
                .then(setFullDeal) // Assuming action returns the deal with relations
                .catch(console.error)
                .finally(() => setFetchingDetails(false))
        } else {
            setFullDeal(null)
        }
    }, [open, initialDeal])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!initialDeal) return

        setLoading(true)
        const formData = new FormData(event.currentTarget)
        formData.append('dealId', initialDeal.id)

        const result = await updateDeal(formData)
        setLoading(false)

        if (result.success) {
            onOpenChange(false)
        } else {
            alert("Failed to update deal")
        }
    }

    async function handleDelete() {
        if (!initialDeal) return
        if (!confirm('Tem certeza que deseja excluir este deal?')) return

        setLoading(true)
        const result = await deleteDeal(initialDeal.id)
        setLoading(false)

        if (result.success) {
            onOpenChange(false)
        } else {
            alert("Failed to delete deal")
        }
    }

    const handleAddNote = () => {
        if (!newNote.trim() || !initialDeal) return
        startTransition(async () => {
            await addNote(initialDeal.id, newNote)
            setNewNote("")
            // Refresh details
            const fresh = await getDealDetails(initialDeal.id)
            setFullDeal(fresh)
        })
    }

    if (!initialDeal) return null

    return (
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
                                            <Select name="contactId" defaultValue={initialDeal.contactId || 'no_contact'}>
                                                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900/50">
                                                    <SelectValue placeholder="Sem contato" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="no_contact">Sem contato</SelectItem>
                                                    {contacts.map((contact) => (
                                                        <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Data de Previsão</Label>
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

                                    {/* Additional fields coming soon: Tags, Date */}

                                    <div className="pt-4 flex justify-between border-t border-zinc-100 dark:border-zinc-800">
                                        <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
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
                                            <div key={note.id} className="group relative pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 pb-4 last:pb-0">
                                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 ring-4 ring-white dark:ring-zinc-950" />
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{note.user?.name || 'Usuário'}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(note.createdAt), "dd MMM HH:mm", { locale: ptBR })}</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                                        {note.content}
                                                    </p>
                                                </div>
                                            </div>
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
                                            <div key={activity.id} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                                                    <div className="w-px h-full bg-zinc-200 dark:bg-zinc-800 my-1" />
                                                </div>
                                                <div className="pb-6">
                                                    <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                                                        {activity.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                                        <span>{activity.user?.name}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(activity.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
