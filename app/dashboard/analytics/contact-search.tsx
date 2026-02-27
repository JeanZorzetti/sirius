'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X } from 'lucide-react'

export function ContactSearch() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const current = searchParams.get('csearch') ?? ''

    function apply(val: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (val.trim()) params.set('csearch', val.trim()); else params.delete('csearch')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex flex-col gap-1">
            <Label className="text-xs text-zinc-500">Buscar por contato</Label>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <Input
                    type="text"
                    placeholder="Nome do contato..."
                    defaultValue={current}
                    className="h-8 w-44 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 pl-7 pr-6"
                    onBlur={(e) => apply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && apply((e.target as HTMLInputElement).value)}
                />
                {current && (
                    <button
                        onClick={() => apply('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    )
}
