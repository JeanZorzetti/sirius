'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

export function AnalyticsDateFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const from = searchParams.get('from') ?? ''
    const to = searchParams.get('to') ?? ''
    const isFiltered = from || to

    function apply(newFrom: string, newTo: string) {
        const params = new URLSearchParams()
        if (newFrom) params.set('from', newFrom)
        if (newTo) params.set('to', newTo)
        router.push(`${pathname}?${params.toString()}`)
    }

    function clear() {
        router.push(pathname)
    }

    return (
        <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">Data do Fechamento — De</Label>
                <Input
                    type="date"
                    defaultValue={from}
                    className="h-8 w-36 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    onChange={(e) => apply(e.target.value, to)}
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">Até</Label>
                <Input
                    type="date"
                    defaultValue={to}
                    className="h-8 w-36 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    onChange={(e) => apply(from, e.target.value)}
                />
            </div>
            {isFiltered && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clear}
                    className="h-8 text-xs text-zinc-500 hover:text-zinc-700 gap-1"
                >
                    <X className="h-3.5 w-3.5" />
                    Limpar filtro
                </Button>
            )}
        </div>
    )
}
