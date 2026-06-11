'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { DollarSign, History, Loader2, MessageSquare, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DealInsightsPanel, ScriptGenerator } from '@/components/agi'
import { updateDeal, deleteDeal, markDealWon } from '@/app/[locale]/dashboard/actions'
import { getDealDetails, getDealClosings } from '@/app/[locale]/dashboard/deals/actions'
import { DetailsTab } from './details-tab'
import { ClosingsTab } from './closings-tab'
import { NotesTab } from './notes-tab'
import { ActivityItem } from './timeline-items'
import { TransferPipelineDialog } from './transfer-pipeline-dialog'
import type {
    DealClosing, EditDealDialogProps, FullDeal, PipelineOption, ProductOption,
} from './types'

export type { EditDealDialogProps, SimpleDeal } from './types'

// `onRollback` and `currentUserId` remain in EditDealDialogProps for the
// existing call sites but are not consumed here (they never were)
export function EditDealDialog({
    deal: initialDeal,
    open,
    onOpenChange,
    stages,
    contacts,
    onOptimisticUpdate,
    onOptimisticDelete,
    onSuccess,
    canViewClosings = true,
    contactDisplayMode: externalDisplayMode,
    onContactDisplayModeChange,
}: EditDealDialogProps) {
    const tCommon = useTranslations('common')
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fullDeal, setFullDeal] = useState<FullDeal | null>(null)
    const [observations, setObservations] = useState('')
    const [dueDateNote, setDueDateNote] = useState('')
    const [dueDateValue, setDueDateValue] = useState('')
    const [fetchingDetails, setFetchingDetails] = useState(false)
    const [localContacts, setLocalContacts] = useState(contacts)
    const [selectedContactId, setSelectedContactId] = useState(initialDeal?.contactId || 'no_contact')
    const [showScriptGenerator, setShowScriptGenerator] = useState(false)
    const [confirmDeleteDeal, setConfirmDeleteDeal] = useState(false)
    const [showTransferDialog, setShowTransferDialog] = useState(false)
    const [allPipelines, setAllPipelines] = useState<PipelineOption[]>([])
    const [products, setProducts] = useState<ProductOption[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string>('no_product')
    const [closings, setClosings] = useState<DealClosing[]>([])
    const formRef = useRef<HTMLFormElement>(null)
    const completingFollowUpRef = useRef(false)

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
                        setDueDateNote(data?.dueDateNote || '')
                        setDueDateValue(data?.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : '')
                        setSelectedProductId(data?.productId || 'no_product')
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
        if (open) {
            setSelectedContactId(initialDeal?.contactId || 'no_contact')
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialDeal?.id])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!initialDeal) return

        setLoading(true)
        const formData = new FormData(event.currentTarget)
        formData.append('dealId', initialDeal.id)

        // Override contactId with the controlled selected value
        const contactIdToSave = selectedContactId === 'no_contact' ? '' : selectedContactId
        formData.set('contactId', contactIdToSave)
        formData.set('productId', selectedProductId === 'no_product' ? '' : selectedProductId)

        try {
            const result = await updateDeal(formData)

            if (result.success) {
                // Apply optimistic update
                if (onOptimisticUpdate) {
                    onOptimisticUpdate(initialDeal.id, {
                        title: formData.get('title') as string,
                        value: formData.get('value') ? parseFloat(formData.get('value') as string) : null,
                        stageId: formData.get('stageId') as string,
                        contactId: contactIdToSave || null,
                        closeDate: formData.get('closeDate') as string || null,
                        dueDate: formData.get('dueDate') as string || null,
                    })
                }
                if (completingFollowUpRef.current) {
                    completingFollowUpRef.current = false
                    toast.success('Follow-up concluído')
                    if (onSuccess) onSuccess()
                } else {
                    onOpenChange(false)
                    if (onSuccess) onSuccess()
                }
            } else {
                toast.error("Erro ao atualizar negócio: " + (result.error || 'Erro desconhecido'))
            }
        } catch (error) {
            console.error('Error updating deal:', error)
            toast.error("Erro ao atualizar negócio")
        } finally {
            setLoading(false)
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
                if (onSuccess) onSuccess()
            } else {
                alert("Erro ao excluir negócio: " + (result.error || 'Erro desconhecido'))
                // Sync to restore deal
                if (onSuccess) onSuccess()
            }
        } catch (error) {
            console.error('Error deleting deal:', error)
            alert("Erro ao excluir negócio")
            // Sync to restore deal
            if (onSuccess) onSuccess()
        }
    }

    if (!initialDeal) return null

    const tabTriggerClass = "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none px-0 pb-3 font-normal text-zinc-500 data-[state=active]:text-indigo-500"

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
                            <TabsTrigger value="details" className={tabTriggerClass}>
                                Detalhes
                            </TabsTrigger>
                            <TabsTrigger value="notes" className={tabTriggerClass}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Observações
                            </TabsTrigger>
                            <TabsTrigger value="timeline" className={tabTriggerClass}>
                                <History className="w-4 h-4 mr-2" />
                                Histórico
                            </TabsTrigger>
                            {canViewClosings && (
                            <TabsTrigger value="closings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-0 pb-3 font-normal text-zinc-500 data-[state=active]:text-emerald-500">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Fechamentos
                                {closings.length > 0 && (
                                    <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                                        {closings.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            )}
                            <TabsTrigger value="agi" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none px-0 pb-3 font-normal text-zinc-500 data-[state=active]:text-purple-500">
                                <Wand2 className="w-4 h-4 mr-2" />
                                AGI Insights
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            <TabsContent value="details" className="mt-0">
                                <DetailsTab
                                    deal={initialDeal}
                                    stages={stages}
                                    contacts={localContacts}
                                    onContactCreated={(contact) => {
                                        setLocalContacts(prev => [...prev, contact])
                                        setSelectedContactId(contact.id)
                                    }}
                                    selectedContactId={selectedContactId}
                                    onContactChange={setSelectedContactId}
                                    products={products}
                                    selectedProductId={selectedProductId}
                                    onProductChange={setSelectedProductId}
                                    observations={observations}
                                    onObservationsChange={setObservations}
                                    dueDateValue={dueDateValue}
                                    onDueDateValueChange={setDueDateValue}
                                    dueDateNote={dueDateNote}
                                    onDueDateNoteChange={setDueDateNote}
                                    displayMode={externalDisplayMode}
                                    onDisplayModeChange={onContactDisplayModeChange}
                                    loading={loading}
                                    formRef={formRef}
                                    onSubmit={onSubmit}
                                    onCompleteFollowUp={() => {
                                        setDueDateValue('')
                                        setDueDateNote('')
                                        completingFollowUpRef.current = true
                                        setTimeout(() => formRef.current?.requestSubmit(), 0)
                                    }}
                                    onMarkWon={handleMarkWon}
                                    onDeleteRequest={() => setConfirmDeleteDeal(true)}
                                    onTransferRequest={() => setShowTransferDialog(true)}
                                    transferDisabled={allPipelines.length === 0}
                                    onNavigateToChat={(phone) => {
                                        onOpenChange(false)
                                        router.push(`/dashboard/chat?phone=${phone}`)
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="notes" className="mt-0 space-y-4">
                                <NotesTab
                                    dealId={initialDeal.id}
                                    notes={fullDeal?.notes}
                                    fetchingDetails={fetchingDetails}
                                    onDetailsChange={setFullDeal}
                                />
                            </TabsContent>

                            <TabsContent value="timeline" className="mt-0">
                                <div className="space-y-6 pt-2">
                                    {fetchingDetails ? (
                                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-400" /></div>
                                    ) : fullDeal?.activities?.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-400 text-sm">Nenhuma atividade registrada.</div>
                                    ) : (
                                        fullDeal?.activities?.map((activity) => (
                                            <ActivityItem key={activity.id} activity={activity} />
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            {canViewClosings && (
                                <TabsContent value="closings" className="mt-0 space-y-4">
                                    <ClosingsTab
                                        dealId={initialDeal.id}
                                        products={products}
                                        closings={closings}
                                        setClosings={setClosings}
                                        fetchingDetails={fetchingDetails}
                                    />
                                </TabsContent>
                            )}

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

            <TransferPipelineDialog
                open={showTransferDialog}
                onOpenChange={setShowTransferDialog}
                dealId={initialDeal.id}
                pipelines={allPipelines}
                onTransferred={() => {
                    onOpenChange(false)
                    if (onSuccess) onSuccess()
                }}
            />
        </ResponsiveDialog>

        <ConfirmDialog
            open={confirmDeleteDeal}
            onOpenChange={setConfirmDeleteDeal}
            title="Excluir negócio"
            description="Tem certeza que deseja excluir este negócio? Esta ação não pode ser desfeita."
            confirmLabel={tCommon('buttons.delete')}
            onConfirm={handleDelete}
        />

        </>
    )
}
