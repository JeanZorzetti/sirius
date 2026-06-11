'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import type { ContactOption, ContactDisplayMode } from './types'

export function ContactCombobox({
    contacts,
    value,
    onChange,
    displayMode: externalMode,
    onDisplayModeChange,
}: {
    contacts: ContactOption[]
    value: string
    onChange: (v: string) => void
    displayMode?: ContactDisplayMode
    onDisplayModeChange?: (mode: ContactDisplayMode) => void
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [internalMode, setInternalMode] = useState<ContactDisplayMode>(externalMode || 'name')
    const displayMode = externalMode ?? internalMode
    const selected = contacts.find((c) => c.id === value)

    function handleDisplayModeChange(mode: ContactDisplayMode) {
        setInternalMode(mode)
        onDisplayModeChange?.(mode)
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return contacts
        const q = search.toLowerCase()
        return contacts.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            (c.company ?? '').toLowerCase().includes(q)
        )
    }, [contacts, search])

    function select(id: string) {
        onChange(id)
        setOpen(false)
        setSearch('')
    }

    function getLabel(c: { name: string; company?: string | null }) {
        if (displayMode === 'company') return c.company || c.name
        return c.name
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
                    <span className="truncate">{selected ? getLabel(selected) : 'Sem contato'}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <div className="flex items-center gap-3 border-b border-border/60 px-3 py-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground">
                        <input
                            type="radio"
                            name="contact-display-mode"
                            checked={displayMode === 'name'}
                            onChange={() => handleDisplayModeChange('name')}
                            className="accent-indigo-600"
                        />
                        Nome
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground">
                        <input
                            type="radio"
                            name="contact-display-mode"
                            checked={displayMode === 'company'}
                            onChange={() => handleDisplayModeChange('company')}
                            className="accent-indigo-600"
                        />
                        Empresa
                    </label>
                </div>
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
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate">{getLabel(c)}</span>
                                    {displayMode === 'name' && c.company && c.company !== c.name && (
                                        <span className="truncate text-xs text-muted-foreground">{c.company}</span>
                                    )}
                                    {displayMode === 'company' && c.company && c.name !== c.company && (
                                        <span className="truncate text-xs text-muted-foreground">{c.name}</span>
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
