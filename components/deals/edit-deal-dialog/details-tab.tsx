'use client'

import type { RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeftRight, Bell, Mail, MessageCircle, Phone, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ContactCombobox } from './contact-combobox'
import { ProductCombobox } from './product-combobox'
import { QuickAddContactPopover } from './quick-add-contact-popover'
import { FollowUpBanner } from './follow-up-banner'
import type { ContactDisplayMode, ContactOption, ProductOption, SimpleDeal } from './types'

export interface DetailsTabProps {
    deal: SimpleDeal
    stages: { id: string; name: string }[]
    contacts: ContactOption[]
    onContactCreated: (contact: ContactOption) => void
    selectedContactId: string
    onContactChange: (id: string) => void
    products: ProductOption[]
    selectedProductId: string
    onProductChange: (id: string) => void
    observations: string
    onObservationsChange: (v: string) => void
    dueDateValue: string
    onDueDateValueChange: (v: string) => void
    dueDateNote: string
    onDueDateNoteChange: (v: string) => void
    displayMode?: ContactDisplayMode
    onDisplayModeChange?: (mode: ContactDisplayMode) => void
    loading: boolean
    formRef: RefObject<HTMLFormElement | null>
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    onCompleteFollowUp: () => void
    onMarkWon: () => void
    onDeleteRequest: () => void
    onTransferRequest: () => void
    transferDisabled: boolean
    onNavigateToChat: (phone: string) => void
}

export function DetailsTab({
    deal, stages, contacts, onContactCreated,
    selectedContactId, onContactChange,
    products, selectedProductId, onProductChange,
    observations, onObservationsChange,
    dueDateValue, onDueDateValueChange,
    dueDateNote, onDueDateNoteChange,
    displayMode, onDisplayModeChange,
    loading, formRef, onSubmit, onCompleteFollowUp,
    onMarkWon, onDeleteRequest, onTransferRequest, transferDisabled,
    onNavigateToChat,
}: DetailsTabProps) {
    const tCommon = useTranslations('common')
    const selectedContact = contacts.find(c => c.id === selectedContactId)

    return (
        <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Título</Label>
                    <Input name="title" defaultValue={deal.title} required className="bg-zinc-50 dark:bg-zinc-900/50" />
                </div>
                <div className="space-y-2">
                    <Label>R$ Valor Estimado</Label>
                    <Input name="value" type="number" step="0.01" defaultValue={Number(deal.value)} className="bg-zinc-50 dark:bg-zinc-900/50" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Etapa</Label>
                    <Select name="stageId" defaultValue={deal.stageId}>
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
                    <Label>Nome</Label>
                    <div className="flex gap-2">
                        <ContactCombobox
                            contacts={contacts}
                            value={selectedContactId}
                            onChange={onContactChange}
                            displayMode={displayMode}
                            onDisplayModeChange={onDisplayModeChange}
                        />
                        <QuickAddContactPopover onContactCreated={onContactCreated} />
                        {selectedContact?.phone && (
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                                onClick={() => {
                                    const phone = selectedContact.phone?.replace(/\D/g, '')
                                    if (phone) onNavigateToChat(phone)
                                }}
                                title="Conversar no WhatsApp"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    {selectedContact && (selectedContact.phone || selectedContact.email) && (
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
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Produto</Label>
                <ProductCombobox
                    products={products}
                    value={selectedProductId}
                    onChange={onProductChange}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Data do Fechamento</Label>
                    <Input
                        name="closeDate"
                        type="date"
                        defaultValue={deal.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : ''}
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
                        onChange={(e) => onDueDateValueChange(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-900/50"
                    />
                </div>
            </div>

            {/* Banner de status do follow-up */}
            {dueDateValue && (
                <FollowUpBanner
                    dueDateValue={dueDateValue}
                    dueDateNote={dueDateNote}
                    onComplete={onCompleteFollowUp}
                />
            )}

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
                        onChange={(e) => onDueDateNoteChange(e.target.value)}
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
                    onChange={(e) => onObservationsChange(e.target.value)}
                    placeholder="Anotações rápidas sobre este negócio..."
                    className="bg-zinc-50 dark:bg-zinc-900/50 resize-none min-h-[80px]"
                />
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    {deal.status !== 'WON' && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onMarkWon}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                        >
                            <Trophy className="w-3.5 h-3.5 mr-1.5" />
                            Marcar como Ganho
                        </Button>
                    )}
                    <Button type="button" variant="ghost" onClick={onDeleteRequest} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Excluir Negócio
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={transferDisabled}
                        onClick={onTransferRequest}
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
    )
}
