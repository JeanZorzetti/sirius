'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import type { ProductOption } from './types'

export function ProductCombobox({
    products,
    value,
    onChange,
}: {
    products: ProductOption[]
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
