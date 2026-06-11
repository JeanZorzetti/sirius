'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, ChevronsUpDown, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { addDealClosing, deleteDealClosing } from '@/app/[locale]/dashboard/deals/actions'
import type { DealClosing, ProductOption } from './types'

export function ClosingsTab({
    dealId,
    products,
    closings,
    setClosings,
    fetchingDetails,
}: {
    dealId: string
    products: ProductOption[]
    closings: DealClosing[]
    setClosings: Dispatch<SetStateAction<DealClosing[]>>
    fetchingDetails: boolean
}) {
    const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0])
    const [closingValue, setClosingValue] = useState('')
    const [closingNote, setClosingNote] = useState('')
    const [savingClosing, setSavingClosing] = useState(false)
    const [closingProductId, setClosingProductId] = useState<string>('none')
    const [closingProductSearch, setClosingProductSearch] = useState('')
    const [closingProductOpen, setClosingProductOpen] = useState(false)

    const handleAddClosing = async () => {
        if (!closingValue || !closingDate) return
        setSavingClosing(true)
        try {
            const newClosing = await addDealClosing(
                dealId,
                closingDate,
                parseFloat(closingValue),
                closingNote || undefined,
                closingProductId !== 'none' ? closingProductId : undefined,
            ) as DealClosing
            setClosings(prev => [newClosing, ...prev])
            setClosingValue('')
            setClosingNote('')
            setClosingProductId('none')
            setClosingProductSearch('')
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

    return (
        <>
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
                <div className="space-y-1">
                    <Label className="text-xs">Produto (opcional)</Label>
                    <Popover open={closingProductOpen} onOpenChange={setClosingProductOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-zinc-800 px-3 text-sm hover:border-zinc-400 transition-colors"
                            >
                                <span className={cn('truncate text-left', closingProductId === 'none' && 'text-zinc-400')}>
                                    {closingProductId !== 'none'
                                        ? products.find(p => p.id === closingProductId)?.name ?? 'Produto selecionado'
                                        : 'Selecionar produto...'}
                                </span>
                                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="start">
                            <div className="flex items-center gap-2 border-b px-3 py-2">
                                <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                <input
                                    autoFocus
                                    placeholder="Buscar produto..."
                                    value={closingProductSearch}
                                    onChange={e => setClosingProductSearch(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                                />
                            </div>
                            <div className="max-h-40 overflow-y-auto py-1">
                                {closingProductId !== 'none' && (
                                    <button
                                        type="button"
                                        onClick={() => { setClosingProductId('none'); setClosingProductSearch(''); setClosingProductOpen(false) }}
                                        className="flex w-full items-center px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    >
                                        Limpar seleção
                                    </button>
                                )}
                                {products
                                    .filter(p => p.name.toLowerCase().includes(closingProductSearch.toLowerCase()))
                                    .map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => { setClosingProductId(p.id); setClosingProductSearch(''); setClosingProductOpen(false) }}
                                            className={cn(
                                                'flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors',
                                                closingProductId === p.id && 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                                            )}
                                        >
                                            <span className="truncate">{p.name}</span>
                                            {closingProductId === p.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                                        </button>
                                    ))
                                }
                                {products.filter(p => p.name.toLowerCase().includes(closingProductSearch.toLowerCase())).length === 0 && (
                                    <p className="px-3 py-2 text-xs text-zinc-400">Nenhum produto encontrado.</p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
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
                                {closing.productName && (
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">📦 {closing.productName}</p>
                                )}
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
        </>
    )
}
