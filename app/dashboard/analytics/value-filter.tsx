'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

export function ValueFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const vmin = searchParams.get('vmin') ?? ''
    const vmax = searchParams.get('vmax') ?? ''
    const isFiltered = vmin || vmax

    function apply(newMin: string, newMax: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (newMin) params.set('vmin', newMin); else params.delete('vmin')
        if (newMax) params.set('vmax', newMax); else params.delete('vmax')
        router.push(`${pathname}?${params.toString()}`)
    }

    function clear() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('vmin')
        params.delete('vmax')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">Valor — Mín (R$)</Label>
                <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    defaultValue={vmin}
                    className="h-8 w-28 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    onBlur={(e) => apply(e.target.value, vmax)}
                    onKeyDown={(e) => e.key === 'Enter' && apply((e.target as HTMLInputElement).value, vmax)}
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label className="text-xs text-zinc-500">Máx (R$)</Label>
                <Input
                    type="number"
                    min={0}
                    placeholder="∞"
                    defaultValue={vmax}
                    className="h-8 w-28 text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                    onBlur={(e) => apply(vmin, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && apply(vmin, (e.target as HTMLInputElement).value)}
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
                    Limpar
                </Button>
            )}
        </div>
    )
}
